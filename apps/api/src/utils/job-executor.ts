import { Logger } from '@nestjs/common';

export async function runJobs(
  jobName: string,
  job: () => Promise<void>,
  logger: Logger,
) {
  try {
    logger.log(`[${jobName}] job started`);

    const start = Date.now();

    await job();

    logger.log(`[${jobName}] job success ${Date.now() - start}ms`);
  } catch (err) {
    logger.error(`[${jobName}] failed`, err);
  }
}
