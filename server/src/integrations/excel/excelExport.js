/**
 * Excel Export Integration
 * 
 * Exports production records from PostgreSQL into a styled, professional Excel (.xlsx) file
 * using ExcelJS.
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const env = require('../../config/env');

const COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Date', key: 'date', width: 14 },
  { header: 'Time', key: 'time', width: 10 },
  { header: 'Name / Worker', key: 'contact_name', width: 22 },
  { header: 'WhatsApp Number', key: 'whatsapp_number', width: 22 },
  { header: 'Yarn Count / Type', key: 'yarn', width: 18 },
  { header: 'Ends', key: 'ends', width: 14 },
  { header: 'Meter', key: 'meter', width: 16 },
  { header: 'Panna (Beam Width)', key: 'panna', width: 20 },
  { header: 'Total Beam', key: 'total_beam', width: 14 },
  { header: 'Source', key: 'source', width: 14 },
  { header: 'Status', key: 'status', width: 14 }
];

const HEADER_STYLE = {
  font: {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E79' }
  },
  alignment: {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true
  },
  border: {
    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    bottom: { style: 'medium', color: { argb: 'FF0F2537' } },
    right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
  }
};

const CELL_BORDER = {
  top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
  left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
  bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
  right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
};

/**
 * Generates an Excel workbook buffer from an array of production records
 * 
 * @param {Array<object>} records 
 * @returns {Promise<Buffer>}
 */
async function generateProductionExcelBuffer(records = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Textile ERP System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Production Report', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = COLUMNS;
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = HEADER_STYLE.font;
    cell.fill = HEADER_STYLE.fill;
    cell.alignment = HEADER_STYLE.alignment;
    cell.border = HEADER_STYLE.border;
  });

  for (const r of records) {
    const row = sheet.addRow([
      r.id,
      r.date,
      r.time,
      r.contact_name || 'Unknown',
      r.whatsapp_number,
      r.yarn,
      Number(r.ends) || 0,
      Number(r.meter) || 0,
      Number(r.panna) || 0,
      Number(r.total_beam) || 0,
      r.source || 'WHATSAPP',
      r.status || 'VERIFIED'
    ]);

    row.height = 20;

    // Formatting
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

    // Numbers
    const cEnds = row.getCell(7);
    cEnds.alignment = { vertical: 'middle', horizontal: 'right' };
    cEnds.numFmt = '#,##0';

    const cMeter = row.getCell(8);
    cMeter.alignment = { vertical: 'middle', horizontal: 'right' };
    cMeter.numFmt = '#,##0.##';

    const cPanna = row.getCell(9);
    cPanna.alignment = { vertical: 'middle', horizontal: 'right' };
    cPanna.numFmt = '#,##0.##';

    const cBeams = row.getCell(10);
    cBeams.alignment = { vertical: 'middle', horizontal: 'right' };
    cBeams.numFmt = '#,##0';

    row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' };

    row.eachCell((cell) => {
      cell.border = CELL_BORDER;
    });
  }

  // Summary Row if records exist
  if (records.length > 0) {
    const totalRow = sheet.addRow([
      'Total',
      '',
      '',
      '',
      '',
      '',
      { formula: `SUM(G2:G${records.length + 1})` },
      { formula: `SUM(H2:H${records.length + 1})` },
      { formula: `AVERAGE(I2:I${records.length + 1})` },
      { formula: `SUM(J2:J${records.length + 1})` },
      '',
      ''
    ]);

    totalRow.height = 24;
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'double' }
      };
    });
  }

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  generateProductionExcelBuffer,
  generateProductionWorkbookBuffer: generateProductionExcelBuffer
};
