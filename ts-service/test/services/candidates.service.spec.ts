import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidatesService } from '../../src/services/candidates/candidates.service';
import { CandidateDocument } from '../../src/entities/candidate-document.entity';
import { CandidateSummary } from '../../src/entities/candidate-summary.entity';
import { SampleCandidate } from '../../src/entities/sample-candidate.entity';
import { CandidateMapper } from '../../src/utils/candidates/mappers/candidate.mapper';
import { QueueService } from '../../src/queue/queue.service';
import {
  mockCandidate,
  mockDocument,
  mockSummary,
  mockUploadDocumentDto,
  mockUser,
} from '../fixtures/candidate.fixture';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let documentRepository: Repository<CandidateDocument>;
  let summaryRepository: Repository<CandidateSummary>;
  let candidateRepository: Repository<SampleCandidate>;
  let mapper: CandidateMapper;
  let queueService: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        CandidateMapper,
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            enqueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
    documentRepository = module.get<Repository<CandidateDocument>>(
      getRepositoryToken(CandidateDocument),
    );
    summaryRepository = module.get<Repository<CandidateSummary>>(
      getRepositoryToken(CandidateSummary),
    );
    candidateRepository = module.get<Repository<SampleCandidate>>(
      getRepositoryToken(SampleCandidate),
    );
    mapper = module.get<CandidateMapper>(CandidateMapper);
    queueService = module.get<QueueService>(QueueService);
  });

  describe('uploadDocument', () => {
    it('should successfully upload a document', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(documentRepository, 'create').mockReturnValue(mockDocument as any);
      jest.spyOn(documentRepository, 'save').mockResolvedValue(mockDocument as any);
      jest.spyOn(mapper, 'mapDocumentToResponse').mockReturnValue({
        id: mockDocument.id,
        fileName: mockDocument.fileName,
        documentType: mockDocument.documentType,
        createdAt: mockDocument.createdAt,
      } as any);

      const result = await service.uploadDocument(
        mockUser,
        mockCandidate.id,
        mockUploadDocumentDto,
      );

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: mockUser.workspaceId },
      });
      expect(documentRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when candidate not found', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.uploadDocument(mockUser, 'nonexistent-id', mockUploadDocumentDto),
      ).rejects.toThrow('Candidate not found');
    });

    it('should enforce workspace access control', async () => {
      const otherWorkspaceUser = { ...mockUser, workspaceId: 'other-workspace' };
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.uploadDocument(otherWorkspaceUser, mockCandidate.id, mockUploadDocumentDto),
      ).rejects.toThrow('Candidate not found');

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: otherWorkspaceUser.workspaceId },
      });
    });
  });;

  describe('requestSummaryGeneration', () => {
    it('should create pending summary and enqueue job', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(summaryRepository, 'create').mockReturnValue({
        ...mockSummary,
        status: 'pending',
      } as any);
      jest.spyOn(summaryRepository, 'save').mockResolvedValue({
        ...mockSummary,
        status: 'pending',
      } as any);
      jest.spyOn(queueService, 'enqueue').mockReturnValue({
        id: 'job-123',
        name: 'generate-candidate-summary',
        payload: {},
        enqueuedAt: new Date().toISOString(),
      } as any);
      jest.spyOn(mapper, 'mapSummaryToResponse').mockReturnValue({
        id: mockSummary.id,
        status: 'pending',
        summary: mockSummary.summary,
        createdAt: mockSummary.createdAt,
      } as any);

      const result = await service.requestSummaryGeneration(mockUser, mockCandidate.id);

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: mockUser.workspaceId },
      });
      expect(summaryRepository.create).toHaveBeenCalled();
      expect(summaryRepository.save).toHaveBeenCalled();
      expect(queueService.enqueue).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when candidate not found', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.requestSummaryGeneration(mockUser, 'nonexistent-id'),
      ).rejects.toThrow('Candidate not found');
    });
  });;

  describe('listSummaries', () => {
    it('should return all summaries for candidate in workspace', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(summaryRepository, 'find').mockResolvedValue([mockSummary as any]);
      jest.spyOn(mapper, 'mapSummaryToResponse').mockReturnValue({
        id: mockSummary.id,
        status: mockSummary.status,
        summary: mockSummary.summary,
        createdAt: mockSummary.createdAt,
      } as any);

      const result = await service.listSummaries(mockUser, mockCandidate.id);

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: mockUser.workspaceId },
      });
      expect(summaryRepository.find).toHaveBeenCalledWith({
        where: {
          candidateId: mockCandidate.id,
          workspaceId: mockUser.workspaceId,
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when candidate not found', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.listSummaries(mockUser, 'nonexistent-id'),
      ).rejects.toThrow('Candidate not found');
    });

    it('should enforce workspace isolation', async () => {
      const otherWorkspaceUser = { ...mockUser, workspaceId: 'other-workspace' };
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.listSummaries(otherWorkspaceUser, mockCandidate.id),
      ).rejects.toThrow('Candidate not found');

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: otherWorkspaceUser.workspaceId },
      });
    });
  });

  describe('getSummary', () => {
    it('should return summary by ID', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(summaryRepository, 'findOne').mockResolvedValue(mockSummary as any);
      jest.spyOn(mapper, 'mapSummaryToResponse').mockReturnValue({
        id: mockSummary.id,
        status: mockSummary.status,
        summary: mockSummary.summary,
        createdAt: mockSummary.createdAt,
      } as any);

      const result = await service.getSummary(
        mockUser,
        mockCandidate.id,
        mockSummary.id,
      );

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: mockUser.workspaceId },
      });
      expect(summaryRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockSummary.id,
          candidateId: mockCandidate.id,
          workspaceId: mockUser.workspaceId,
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when candidate not found', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getSummary(mockUser, 'nonexistent-id', mockSummary.id),
      ).rejects.toThrow('Candidate not found');
    });

    it('should throw NotFoundException when summary not found', async () => {
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(mockCandidate as any);
      jest.spyOn(summaryRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getSummary(mockUser, mockCandidate.id, 'nonexistent-id'),
      ).rejects.toThrow('Summary not found');
    });

    it('should enforce workspace access control', async () => {
      const otherWorkspaceUser = { ...mockUser, workspaceId: 'other-workspace' };
      jest.spyOn(candidateRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getSummary(otherWorkspaceUser, mockCandidate.id, mockSummary.id),
      ).rejects.toThrow('Candidate not found');

      expect(candidateRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidate.id, workspaceId: otherWorkspaceUser.workspaceId },
      });
    });
  });

  describe('updateSummaryWithResult', () => {
    it('should update summary with LLM result', async () => {
      jest.spyOn(summaryRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateSummaryWithResult(mockSummary.id, {
        score: 85,
        strengths: ['Technical expertise', 'Leadership'],
        concerns: ['Limited experience'],
        summary: 'Strong technical background',
        recommendedDecision: 'advance',
        provider: 'gemini',
        promptVersion: 1,
      });

      expect(summaryRepository.update).toHaveBeenCalledWith(
        { id: mockSummary.id },
        expect.objectContaining({
          status: 'completed',
          score: 85,
          summary: 'Strong technical background',
          recommendedDecision: 'advance',
        }),
      );
    });
  });

  describe('updateSummaryWithError', () => {
    it('should update summary with error status', async () => {
      jest.spyOn(summaryRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateSummaryWithError(mockSummary.id, 'LLM API timeout');

      expect(summaryRepository.update).toHaveBeenCalledWith(
        { id: mockSummary.id },
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'LLM API timeout',
        }),
      );
    });
  });
});
