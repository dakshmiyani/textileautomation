const assert = require('assert');
const request = require('supertest');
const { parseProductionMessage } = require('../src/integrations/whatsapp/parser');
const { validateProductionData } = require('../src/integrations/whatsapp/validator');
const { duplicateDetector } = require('../src/integrations/whatsapp/duplicateDetector');
const { generateProductionWorkbookBuffer } = require('../src/integrations/excel/excelExport');
const { testConnectionAndMigrate, knex } = require('../src/database/knex');
const authService = require('../src/modules/auth/authService');
const productionService = require('../src/modules/production/productionService');
const app = require('../src/app');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING TEXTILE ERP BACKEND TESTS');
  console.log('========================================\n');

  // 1. WhatsApp Parser Tests
  console.log('--- 1. WhatsApp Parser Tests ---');
  await test('Standard yarn production message format', () => {
    const raw = `Yarn: 40s
Ends: 1200
Meter: 5000
Panna(beam width): 63
Total beam: 10`;
    const parsed = parseProductionMessage(raw);
    assert(parsed !== null, 'Should parse valid message');
    assert.strictEqual(parsed.yarn, '40s');
    assert.strictEqual(parsed.ends, '1200');
    assert.strictEqual(parsed.meter, '5000');
    assert.strictEqual(parsed.panna, '63');
    assert.strictEqual(parsed.totalBeam, '10');
  });

  await test('Flexible casing, spacing, and aliases', () => {
    const raw = `yarn: 30/1 combed
ends : 1450
Meters: 7500.5
beam width: 72
Total beams: 8`;
    const parsed = parseProductionMessage(raw);
    assert(parsed !== null, 'Should parse flexible message');
    assert.strictEqual(parsed.yarn, '30/1 combed');
    assert.strictEqual(parsed.ends, '1450');
    assert.strictEqual(parsed.meter, '7500.5');
    assert.strictEqual(parsed.panna, '72');
    assert.strictEqual(parsed.totalBeam, '8');
  });

  await test('Non-production conversation must be rejected (null)', () => {
    const raw = 'Hello, can you send the bill for yesterday?';
    const parsed = parseProductionMessage(raw);
    assert.strictEqual(parsed, null, 'Normal conversation must be ignored');
  });

  // 2. WhatsApp Validator Tests
  console.log('\n--- 2. WhatsApp Validator Tests ---');
  await test('Valid numeric conversion and bounds', () => {
    const valid = validateProductionData({
      yarn: '60s cotton',
      ends: '1800',
      meter: '12000',
      panna: '60',
      totalBeam: '12'
    });
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.data.ends, 1800);
    assert.strictEqual(valid.data.meter, 12000);
    assert.strictEqual(valid.data.panna, 60);
    assert.strictEqual(valid.data.totalBeam, 12);
  });

  await test('Invalid or negative numbers fail validation', () => {
    const invalid = validateProductionData({
      yarn: '',
      ends: '-5',
      meter: 'abc',
      panna: '0',
      totalBeam: '2'
    });
    assert.strictEqual(invalid.isValid, false);
    assert(invalid.errors.length >= 3, 'Should have multiple validation errors');
  });

  // 3. Duplicate Detection Tests
  console.log('\n--- 3. Duplicate Detection Tests ---');
  await test('Duplicate message IDs within grace window are caught', () => {
    const msgId = 'test_msg_id_' + Date.now();
    assert.strictEqual(duplicateDetector.isDuplicate(msgId, '+919999999999', 'Yarn: 40s...'), false);
    assert.strictEqual(duplicateDetector.isDuplicate(msgId, '+919999999999', 'Yarn: 40s...'), true);
  });

  // 4. Database & Seed Verification
  console.log('\n--- 4. Database & Seed Tests ---');
  await test('Database connection and migration sync', async () => {
    await testConnectionAndMigrate();
    const roles = await knex('roles').select('*');
    assert(roles.length >= 6, 'Must have 6 predefined roles');
    const admin = await knex('users').where('email', 'admin@textileerp.com').first();
    assert(admin !== null, 'Seeded admin user must exist');
  });

  // 5. Auth Service Tests
  console.log('\n--- 5. Auth Service & RBAC Tests ---');
  let authToken = '';
  await test('Admin login with seeded credentials and JWT issuance', async () => {
    const result = await authService.login({
      email: 'admin@textileerp.com',
      password: 'Admin@123',
      ip: '127.0.0.1',
      userAgent: 'TestRunner'
    });

    assert(result.tokens && result.tokens.accessToken, 'Access token must be returned');
    assert.strictEqual(result.user.role, 'SUPER_ADMIN');
    assert(result.user.permissions.includes('production.read'), 'Must have production.read permission');
    authToken = result.tokens.accessToken;
  });

  await test('Invalid credentials throw AuthenticationError', async () => {
    try {
      await authService.login({
        email: 'admin@textileerp.com',
        password: 'WrongPassword',
        ip: '127.0.0.1'
      });
      assert.fail('Should have thrown authentication error');
    } catch (e) {
      assert(e.name === 'AuthenticationError' || e.message.includes('Invalid'));
    }
  });

  // 6. Production Service Tests
  console.log('\n--- 6. Production Service & Repository Tests ---');
  let createdRecordId = null;
  await test('Create production record and verify persistence', async () => {
    const record = await productionService.createRecord(
      {
        date: '2026-10-01',
        time: '12:00 PM',
        yarn: '40s Combed Hosiery',
        ends: 1350,
        meter: 6200,
        panna: 64,
        total_beam: 10,
        contact_name: 'Test Weaver',
        whatsapp_number: '+919876543210',
        source: 'WHATSAPP'
      },
      { source: 'WHATSAPP' }
    );

    assert(record.id !== undefined, 'Record must have ID');
    assert.strictEqual(Number(record.meter), 6200);
    createdRecordId = record.id;
  });

  await test('Retrieve production record by ID and calculate KPIs', async () => {
    const record = await productionService.getRecordById(createdRecordId);
    assert.strictEqual(record.yarn, '40s Combed Hosiery');

    const kpis = await productionService.getKPIs();
    assert(kpis.overall.meters > 0, 'KPI overall meters must be greater than 0');
    assert(kpis.whatsappSubmissions >= 1, 'WhatsApp submissions count must be at least 1');
  });

  // 7. Excel Export Tests
  console.log('\n--- 7. ExcelJS Export Tests ---');
  await test('Generate styled Excel workbook buffer from records', async () => {
    const buffer = await productionService.exportExcel({});
    assert(Buffer.isBuffer(buffer), 'Export must return a Buffer');
    assert(buffer.length > 1000, 'Excel buffer must contain valid workbook binary data');
  });

  // 8. API HTTP Integration Tests
  console.log('\n--- 8. API Endpoints via HTTP ---');
  await test('GET /api/v1/health returns 200 OK', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  await test('POST /api/v1/auth/login logs in and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@textileerp.com', password: 'Admin@123' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.tokens.accessToken);
  });

  await test('GET /api/v1/production with valid JWT token returns paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/production')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.data));
    assert(res.body.pagination.total > 0);
  });

  await test('GET /api/v1/production without token is rejected with 401', async () => {
    const res = await request(app).get('/api/v1/production');
    assert.strictEqual(res.status, 401);
  });

  console.log('\n--- 9. Textile Orders & Calculation Tests ---');
  await test('Parse Surat textile order message and compute warp metrics', async () => {
    const { parseOrderMessage, formatOrderReplyMessage } = require('../src/integrations/whatsapp/orderParser');
    const sampleMsg = `શ્રી ગણેશાય નમઃ
*KESARI NANDAN TEX FAB*

*ORDER DETAILS*
DATE  : 28/09/2026
ORDER : SO-000274

*BILLING*
YOGI TEX FAB
Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130
GST NO: -

*ITEM DETAILS*
ITEM  : 21/1 NYLON BRIGHT MONO
ENDS  : 11808
PANNA : 54"

*PRICING*
*RATE    : 300++*
CARTAGE : ₹800 / Beam
*NOTE    : RS.400 WILL BE CHARGED ON EVERY OUT BEAM*

*BEAM DETAILS*
6   x  8550 METER
TOTAL BEAM : 6
*TOTAL MTR  : 51300 METER*

*TERMS*
15 DAYS NET BILL TO BILL
(1.5% interest after due date)

*DELIVERY*
Delivery after 7 Days

*IMPORTANT*
[NO FABRICS CLAIM]
[No Dyeing Guarantee]`;

    const parsed = parseOrderMessage(sampleMsg);
    assert(parsed, 'Order should be parsed');
    assert.strictEqual(parsed.order_no, 'SO-000274');
    assert.strictEqual(parsed.party_name, 'YOGI TEX FAB');
    assert.strictEqual(parsed.ends, 11808);
    assert.strictEqual(parsed.beam_count, 6);
    assert.strictEqual(parsed.total_meters, 51300);
    assert.strictEqual(parsed.calculations.totalWeightKg, 1413.42);
    assert.strictEqual(parsed.calculations.cartageTotal, 4800);
    assert.strictEqual(parsed.calculations.outBeamTotal, 2400);
    assert.strictEqual(parsed.calculations.subtotal, 431225.28);

    const reply = formatOrderReplyMessage(parsed);
    assert(reply.includes('KESARI NANDAN TEX FAB'), 'Reply must include mill name');
    assert(reply.includes('SO-000274'), 'Reply must include order number');
    assert(reply.includes('YOGI TEX FAB'), 'Reply must include party name');
    assert(reply.includes('51300 METER'), 'Reply must include total meters');
    assert(reply.includes('CUSTOMER :'), 'Reply must include customer line');
    assert(reply.includes('PARTY    :'), 'Reply must include party line');
    assert(reply.includes('ADDRESS  :'), 'Reply must include address line');
    assert(reply.includes('GST NO   :'), 'Reply must include gst line');
  });

  await test('Save customer name, party name, address and gst no and send in reply', async () => {
    const customersRepository = require('../src/modules/customers/customersRepository');
    const { validateProductionData } = require('../src/integrations/whatsapp/validator');

    // 1. Upsert customer profile
    const savedCustomer = await customersRepository.upsertCustomer({
      customer_name: 'Asmita miyani',
      party_name: 'YOGI TEX FAB',
      billing_address: 'Plot No. 12-13, Jalbhumi Industrial, Olpad Sayan Road, Surat, Gujarat - 394130',
      gst_no: '24AAAAA0000A1Z5',
      phone_number: '+917021483568'
    });

    assert(savedCustomer, 'Customer should be saved in database');
    assert.strictEqual(savedCustomer.customer_name, 'Asmita miyani');
    assert.strictEqual(savedCustomer.party_name, 'YOGI TEX FAB');
    assert.strictEqual(savedCustomer.gst_no, '24AAAAA0000A1Z5');

    // 2. Validate production data with customer profile context
    const parsedProduction = {
      yarn: '21/1 NYLON BRIGHT MONO',
      ends: '11808',
      meter: '8550',
      panna: '54',
      totalBeam: '6'
    };

    const validation = validateProductionData(parsedProduction, {
      phoneNumber: '+917021483568',
      senderName: 'Asmita miyani',
      customerProfile: savedCustomer
    });

    assert(validation.isValid, 'Production validation must succeed');
    assert(validation.replyMessage.includes('CUSTOMER : Asmita miyani'), 'Reply must contain saved customer name');
    assert(validation.replyMessage.includes('PARTY    : YOGI TEX FAB'), 'Reply must contain saved party name');
    assert(validation.replyMessage.includes('Plot No. 12-13, Jalbhumi Industrial'), 'Reply must contain saved address');
    assert(validation.replyMessage.includes('GST NO   : 24AAAAA0000A1Z5'), 'Reply must contain saved GST no');
  });

  await test('GET /api/v1/orders returns list of orders', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.data));
  });

  console.log('\n========================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  // Close Knex connection so process exits cleanly
  await knex.destroy();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
