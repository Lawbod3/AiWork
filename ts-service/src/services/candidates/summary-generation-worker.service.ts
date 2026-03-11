import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateSummary } from '../../entities/candidate-summary.entity';
import { QueueService, EnqueuedJob } from '../../queue/queue.service';
import {
  SummarizationProvider,
  SUMMARIZATION_PROVIDER,
} from '../../llm/summarization-provider.interface';
import { CandidatesService } from './candidates.service';

interface SummaryGenerationJob {
  summaryId: string;
  candidateId: string;
  workspaceId: string;
}

@Injectable()
export class SummaryGenerationWorker {
  private readonly logger = new Logger(SummaryGenerationWorker.name);

  constructor(
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    private readonly queueService: QueueService,
    private readonly candidatesService: CandidatesService,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly llmProvider: SummarizationProvider,
  ) {}

  /**
   * Process all pending summary generation jobs in the queue
   * This should be called periodically or triggered manually
   */
  async processPendingJobs(): Promise<void> {
    const jobs = this.queueService.getQueuedJobs();
    const summaryJobs = jobs.filter(
      (job) => job.name === 'generate-candidate-summary',
    ) as EnqueuedJob<SummaryGenerationJob>[];

    this.logger.log(`Processing ${summaryJobs.length} pending summary jobs`);

    for (const job of summaryJobs) {
      await this.processJob(job);
    }
  }

  /**
   * Process a single summary generation job
   */
  private async processJob(
    job: EnqueuedJob<SummaryGenerationJob>,
  ): Promise<void> {
    const { summaryId, candidateId, workspaceId } = job.payload;

    try {
      this.logger.log(
        `Processing summary job ${summaryId} for candidate ${candidateId}`,
      );

      // Fetch candidate documents
      const documents = await this.candidatesService.getDocumentsForCandidate(
        candidateId,
        workspaceId,
      );

      if (documents.length === 0) {
        throw new Error('No documents found for candidate');
      }

      // Extract raw text from documents
      const documentTexts = documents.map((doc) => doc.rawText);

      // Call LLM provider to generate summary
      const result = await this.llmProvider.generateCandidateSummary({
        candidateId,
        documents: documentTexts,
      });

      // Update summary with results
      await this.candidatesService.updateSummaryWithResult(summaryId, {
        score: result.score,
        strengths: result.strengths,
        concerns: result.concerns,
        summary: result.summary,
        recommendedDecision: result.recommendedDecision,
        provider: this.getProviderName(),
        promptVersion: 1,
      });

      this.logger.log(`Successfully processed summary ${summaryId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process summary ${summaryId}: ${errorMessage}`,
        error,
      );

      // Update summary with error
      await this.candidatesService.updateSummaryWithError(
        summaryId,
        errorMessage,
      );
    }
  }

  /**
   * Get the name of the LLM provider being used
   */
  private getProviderName(): string {
    const providerClass = this.llmProvider.constructor.name;
    if (providerClass.includes('Gemini')) {
      return 'gemini';
    }
    if (providerClass.includes('Fake')) {
      return 'fake';
    }
    return 'unknown';
  }
}
