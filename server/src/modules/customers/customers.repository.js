/**
 * Customers Repository
 * Handles persistent storage of customer directory (Customer Name, Party Name, Billing Address, GST No, Phone)
 */
const { knex } = require('../../database/knex');
const logger = require('../../config/logger');

class CustomersRepository {
  _cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  }

  _enforceTenant(tenantId) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId');
  }

  async findByPhoneOrName(phoneNumber, name, tenantId) {
    try {
      this._enforceTenant(tenantId);
      const cleanPhone = this._cleanPhone(phoneNumber);
      const query = knex('customers').where('tenant_id', tenantId);

      if (cleanPhone && cleanPhone.length >= 7) {
        const last10 = cleanPhone.slice(-10);
        query.where(function() {
          this.where('phone_number', 'like', `%${last10}%`);
          if (name) {
            this.orWhereRaw('LOWER(customer_name) = ?', [name.toLowerCase().trim()])
                .orWhereRaw('LOWER(party_name) = ?', [name.toLowerCase().trim()]);
          }
        });
      } else if (name) {
        query.where(function() {
          this.whereRaw('LOWER(customer_name) = ?', [name.toLowerCase().trim()])
              .orWhereRaw('LOWER(party_name) = ?', [name.toLowerCase().trim()]);
        });
      } else {
        return null;
      }

      const match = await query.orderBy('updated_at', 'desc').first();
      return match || null;
    } catch (err) {
      logger.error({ error: err.message }, 'Error in findByPhoneOrName');
      return null;
    }
  }

  async upsertCustomer({ customer_name, party_name, billing_address, gst_no, phone_number, tenant_id }) {
    try {
      this._enforceTenant(tenant_id);
      if (!party_name && !customer_name && !phone_number) return null;

      const cleanPhone = this._cleanPhone(phone_number);
      const existing = await this.findByPhoneOrName(phone_number, party_name || customer_name, tenant_id);

      if (existing) {
        const updates = {
          updated_at: new Date()
        };
        if (customer_name !== undefined) updates.customer_name = customer_name ? customer_name.trim() : null;
        if (party_name !== undefined) updates.party_name = party_name ? party_name.trim() : 'Unknown Party';
        if (billing_address !== undefined) updates.billing_address = billing_address ? billing_address.trim() : null;
        if (gst_no !== undefined) updates.gst_no = gst_no ? gst_no.trim() : '-';
        if (phone_number !== undefined) updates.phone_number = phone_number ? phone_number.trim() : null;

        const [updated] = await knex('customers')
          .where({ id: existing.id, tenant_id })
          .update(updates)
          .returning('*');

        logger.info({ customerId: existing.id, party: party_name || customer_name }, 'Updated customer profile');
        return updated || existing;
      } else {
        const [inserted] = await knex('customers')
          .insert({
            customer_name: customer_name ? customer_name.trim() : null,
            party_name: party_name ? party_name.trim() : 'Unknown Party',
            billing_address: billing_address ? billing_address.trim() : null,
            gst_no: gst_no ? gst_no.trim() : '-',
            phone_number: phone_number ? phone_number.trim() : null,
            tenant_id,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('*');

        logger.info({ customerId: inserted?.id, party: party_name || customer_name }, 'Inserted new customer profile');
        return inserted;
      }
    } catch (err) {
      logger.error({ error: err.message }, 'Error in upsertCustomer');
      return null;
    }
  }

  async getAll(tenantId, limit = 100) {
    try {
      this._enforceTenant(tenantId);
      return knex('customers').where('tenant_id', tenantId).orderBy('updated_at', 'desc').limit(limit);
    } catch (err) {
      logger.error({ error: err.message }, 'Error in getAll customers');
      return [];
    }
  }

  async updateCustomer(id, data, tenantId) {
    try {
      this._enforceTenant(tenantId);
      const updates = { ...data, updated_at: new Date() };
      const [updated] = await knex('customers')
        .where({ id, tenant_id: tenantId })
        .update(updates)
        .returning('*');
      return updated;
    } catch (err) {
      logger.error({ error: err.message }, `Error updating customer ${id}`);
      throw err;
    }
  }

  async createCustomer(data) {
    try {
      this._enforceTenant(data.tenant_id);
      const [inserted] = await knex('customers')
        .insert({
          customer_name: data.customer_name ? data.customer_name.trim() : null,
          party_name: data.party_name ? data.party_name.trim() : 'Unknown Party',
          billing_address: data.billing_address ? data.billing_address.trim() : null,
          gst_no: data.gst_no ? data.gst_no.trim() : '-',
          phone_number: data.phone_number ? data.phone_number.trim() : null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      return inserted;
    } catch (err) {
      logger.error({ error: err.message }, 'Error creating customer');
      throw err;
    }
  }

  async deleteCustomer(id, tenantId) {
    try {
      this._enforceTenant(tenantId);
      const deleted = await knex('customers').where({ id, tenant_id: tenantId }).del();
      return deleted > 0;
    } catch (err) {
      logger.error({ error: err.message }, `Error deleting customer ${id}`);
      throw err;
    }
  }
}

module.exports = new CustomersRepository();
