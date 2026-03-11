import { Controller, Post } from '@nestjs/common';
import { SummaryGenerationWorker } from '../../services/candidates/summary-generation-worker.service';

@Controller('workers')
export class WorkersController {
  constructor(private readonly summaryWorker: SummaryGenerationWorker) {}

  /**
   * Trigger processing of all pending summary generation jobs
   * This endpoint is for manual testing and development
   * In production, this would be called by a scheduler (cron job, etc.)
   */
  @Post('candidate-summaries')
  async processCandidateSummaries(): Promise<{ message: string }> {
    await this.summaryWorker.processPendingJobs();
    return { message: 'Summary generation jobs processed' };
  }
}
