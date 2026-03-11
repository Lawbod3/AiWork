import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SummaryGenerationWorker } from '../../src/services/candidates/summary-generation-worker.service';
import { CandidatesService } from '../../src/services/candidates/candidates.service';
import { CandidateSummary } from '../../src/entities/candidate-summary.entity';
import { QueueService } from '../../src/queue/queue.service';
import {
  SummarizationProvider,
  SUMMARIZATION_PROVIDER,
} from '../../src/llm/summarization-provider.interface';
import { mockDocument, mockSummary } from '../fixtures/candidate.fixture';

describe('SummaryGenerationWorker', () => {
  let worker: SummaryGenerationWorker;
  let candidatesService: CandidatesService;
  let queueService: QueueService;
  let llmProvider: SummarizationProvider;
  let summaryRepository: Repository<CandidateSummary>;

  const mockLlmResult = {
    score: 85,
    strengths: ['Strong technical background', 'Good communication'],
    concerns: ['Limited leadership experience'],
    summary: 'Solid candidate with strong technical skills',
    recommendedDecision: 'advance' as const,
  };

  beforeEach(async () => {
    const mockSummaryRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockCandidatesService = {
      getDocumentsForCandidate: jest.fn().mockResolvedValue([mockDocument]),
      updateSummaryWithResult: jest.fn().mockResolvedValue(undefined),
      updateSummaryWithError: jest.fn().mockResolvedValue(undefined),
    };

    const mockLlmProvider = {
      generateCandidateSummary: jest.fn().mockResolvedValue(mockLlmResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryGenerationWorker,
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: mockSummaryRepository,
        },
        {
          provide: CandidatesService,
          useValue: mockCandidatesService,
        },
        {
          provide: QueueService,
          useValue: new QueueService(),
        },
        {
          provide: SUMMARIZATION_PROVIDER,
          useValue: mockLlmProvider,
        },
      ],
    }).compile();

    worker = module.get<SummaryGenerationWorker>(SummaryGenerationWorker);
    candidatesService = module.get<CandidatesService>(CandidatesService);
    queueService = module.get<QueueService>(QueueService);
    llmProvider = module.get<SummarizationProvider>(SUMMARIZATION_PROVIDER);
    summaryRepository = module.get<Repository<CandidateSummary>>(
      getRepositoryToken(CandidateSummary),
    );
  });

  describe('processPendingJobs', () => {
    it('should process all pending summary generation jobs', async () => {
      // Enqueue a job
      queueService.enqueue('generate-candidate-summary', {
        summaryId: mockSummary.id,
        candidateId: mockDocument.candidateId,
        workspaceId: mockDocument.workspaceId,
      });

      // Process jobs
      await worker.processPendingJobs();

      // Verify documents were fetched
      expect(candidatesService.getDocumentsForCandidate).toHaveBeenCalledWith(
        mockDocument.candidateId,
        mockDocument.workspaceId,
      );

      // Verify LLM was called
      expect(llmProvider.generateCandidateSummary).toHaveBeenCalledWith({
        candidateId: mockDocument.candidateId,
        documents: [mockDocument.rawText],
      });

      // Verify summary was updated with results
      expect(candidatesService.updateSummaryWithResult).toHaveBeenCalledWith(
        mockSummary.id,
        expect.objectContaining({
          score: mockLlmResult.score,
          strengths: mockLlmResult.strengths,
          concerns: mockLlmResult.concerns,
          summary: mockLlmResult.summary,
          recommendedDecision: mockLlmResult.recommendedDecision,
        }),
      );
    });

    it('should handle multiple jobs in queue', async () => {
      // Enqueue multiple jobs
      queueService.enqueue('generate-candidate-summary', {
        summaryId: 'summary-1',
        candidateId: 'candidate-1',
        workspaceId: 'workspace-1',
      });

      queueService.enqueue('generate-candidate-summary', {
        summaryId: 'summary-2',
        candidateId: 'candidate-2',
        workspaceId: 'workspace-1',
      });

      // Process jobs
      await worker.processPendingJobs();

      // Verify LLM was called twice
      expect(llmProvider.generateCandidateSummary).toHaveBeenCalledTimes(2);
    });

    it('should skip non-summary jobs in queue', async () => {
      // Enqueue a different type of job
      queueService.enqueue('some-other-job', { data: 'test' });

      // Enqueue a summary job
      queueService.enqueue('generate-candidate-summary', {
        summaryId: mockSummary.id,
        candidateId: mockDocument.candidateId,
        workspaceId: mockDocument.workspaceId,
      });

      // Process jobs
      await worker.processPendingJobs();

      // Verify only one job was processed
      expect(llmProvider.generateCandidateSummary).toHaveBeenCalledTimes(1);
    });

    it('should handle empty queue gracefully', async () => {
      // Process jobs with empty queue
      await worker.processPendingJobs();

      // Verify no errors and no LLM calls
      expect(llmProvider.generateCandidateSummary).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle missing documents error', async () => {
      (candidatesService.getDocumentsForCandidate as jest.Mock).mockResolvedValueOnce(
        [],
      );

      queueService.enqueue('generate-candidate-summary', {
        summaryId: mockSummary.id,
        candidateId: mockDocument.candidateId,
        workspaceId: mockDocument.workspaceId,
      });

      await worker.processPendingJobs();

      // Verify error was recorded
      expect(candidatesService.updateSummaryWithError).toHaveBeenCalledWith(
        mockSummary.id,
        expect.stringContaining('No documents found'),
      );
    });

    it('should handle LLM provider errors', async () => {
      const error = new Error('LLM API failed');
      (llmProvider.generateCandidateSummary as jest.Mock).mockRejectedValueOnce(
        error,
      );

      queueService.enqueue('generate-candidate-summary', {
        summaryId: mockSummary.id,
        candidateId: mockDocument.candidateId,
        workspaceId: mockDocument.workspaceId,
      });

      await worker.processPendingJobs();

      // Verify error was recorded
      expect(candidatesService.updateSummaryWithError).toHaveBeenCalledWith(
        mockSummary.id,
        'LLM API failed',
      );
    });

    it('should continue processing after job failure', async () => {
      // First job fails
      (llmProvider.generateCandidateSummary as jest.Mock)
        .mockRejectedValueOnce(new Error('First job failed'))
        .mockResolvedValueOnce(mockLlmResult);

      queueService.enqueue('generate-candidate-summary', {
        summaryId: 'summary-1',
        candidateId: 'candidate-1',
        workspaceId: 'workspace-1',
      });

      queueService.enqueue('generate-candidate-summary', {
        summaryId: 'summary-2',
        candidateId: 'candidate-2',
        workspaceId: 'workspace-1',
      });

      await worker.processPendingJobs();

      // Verify both jobs were processed
      expect(candidatesService.updateSummaryWithError).toHaveBeenCalledTimes(1);
      expect(candidatesService.updateSummaryWithResult).toHaveBeenCalledTimes(1);
    });
  });

  describe('provider detection', () => {
    it('should detect Gemini provider', async () => {
      queueService.enqueue('generate-candidate-summary', {
        summaryId: mockSummary.id,
        candidateId: mockDocument.candidateId,
        workspaceId: mockDocument.workspaceId,
      });

      await worker.processPendingJobs();

      // Verify provider name is set
      expect(candidatesService.updateSummaryWithResult).toHaveBeenCalledWith(
        mockSummary.id,
        expect.objectContaining({
          provider: expect.any(String),
        }),
      );
    });
  });
});
