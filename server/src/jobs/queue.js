const logger = require('../config/logger');

/**
 * Lightweight in-process background job queue
 * Interface-compatible with future BullMQ / Redis queues
 */
class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.handlers = new Map();
    this.isProcessing = false;
  }

  /**
   * Register a job type handler
   */
  process(jobType, handlerFn) {
    this.handlers.set(jobType, handlerFn);
    logger.info({ jobType }, 'Registered background job worker');
  }

  /**
   * Add a job to queue
   */
  async add(jobType, data = {}, options = {}) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job = {
      id: jobId,
      type: jobType,
      data,
      options,
      status: 'QUEUED',
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null
    };

    this.jobs.set(jobId, job);
    logger.debug({ jobId, jobType }, 'Added job to background queue');

    // Run asynchronously without blocking caller
    setImmediate(() => this.executeNext(jobId));

    return job;
  }

  async executeNext(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'FAILED';
      job.error = `No handler registered for job type: ${job.type}`;
      logger.error({ jobId, type: job.type }, job.error);
      return;
    }

    job.status = 'RUNNING';
    job.startedAt = new Date();

    try {
      logger.debug({ jobId, type: job.type }, 'Executing background job');
      const result = await handler(job.data);
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.result = result;
      logger.debug({ jobId, type: job.type }, 'Background job completed successfully');
    } catch (err) {
      job.status = 'FAILED';
      job.completedAt = new Date();
      job.error = err.message;
      logger.error({ jobId, type: job.type, error: err.message, stack: err.stack }, 'Background job failed');
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }
}

const jobQueue = new JobQueue();
module.exports = { jobQueue };
