const { jobQueue } = require('../queue');
const productionService = require('../../modules/production/production.service');
const logger = require('../../config/logger');

/**
 * Register export workers
 */
function initExportWorkers() {
  jobQueue.process('PRODUCTION_EXCEL_EXPORT', async (data) => {
    logger.info({ filters: data.filters }, 'Worker generating Excel export...');
    const buffer = await productionService.exportExcel(data.filters, data.context);
    return { bufferLength: buffer.length };
  });
}

module.exports = { initExportWorkers };
