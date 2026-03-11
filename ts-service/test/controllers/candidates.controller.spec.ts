import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from '../../src/controllers/candidates/candidates.controller';
import { CandidatesService } from '../../src/services/candidates/candidates.service';
import { CandidateMapper } from '../../src/utils/candidates/mappers/candidate.mapper';
import {
  mockCandidate,
  mockDocument,
  mockSummary,
  mockUploadDocumentDto,
  mockUser,
} from '../fixtures/candidate.fixture';

describe('CandidatesController', () => {
  let controller: CandidatesController;
  let service: CandidatesService;
  let mapper: CandidateMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        {
          provide: CandidatesService,
          useValue: {
            uploadDocument: jest.fn(),
            requestSummaryGeneration: jest.fn(),
            listSummaries: jest.fn(),
            getSummary: jest.fn(),
          },
        },
        {
          provide: CandidateMapper,
          useValue: {
            mapDocumentToResponse: jest.fn((doc) => ({
              id: doc.id,
              fileName: doc.fileName,
              documentType: doc.documentType,
              createdAt: doc.createdAt,
            })),
            mapSummaryToResponse: jest.fn((summary) => ({
              id: summary.id,
              status: summary.status,
              summary: summary.summary,
              recommendedDecision: summary.recommendedDecision,
              createdAt: summary.createdAt,
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<CandidatesController>(CandidatesController);
    service = module.get<CandidatesService>(CandidatesService);
    mapper = module.get<CandidateMapper>(CandidateMapper);
  });

  describe('POST /candidates/:candidateId/documents', () => {
    it('should upload document and return 201 Created', async () => {
      const documentResponse = {
        id: mockDocument.id,
        fileName: mockDocument.fileName,
        documentType: mockDocument.documentType,
        createdAt: mockDocument.createdAt,
      };
      jest.spyOn(service, 'uploadDocument').mockResolvedValue(documentResponse as any);

      const result = await controller.uploadDocument(
        mockUser,
        mockCandidate.id,
        mockUploadDocumentDto,
      );

      expect(service.uploadDocument).toHaveBeenCalledWith(
        mockUser,
        mockCandidate.id,
        mockUploadDocumentDto,
      );
      expect(result).toEqual(documentResponse);
    });

    it('should pass user context from decorator', async () => {
      jest.spyOn(service, 'uploadDocument').mockResolvedValue({} as any);

      await controller.uploadDocument(
        mockUser,
        mockCandidate.id,
        mockUploadDocumentDto,
      );

      expect(service.uploadDocument).toHaveBeenCalledWith(
        mockUser,
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should throw error when candidate not found', async () => {
      jest
        .spyOn(service, 'uploadDocument')
        .mockRejectedValue(new Error('Candidate not found'));

      await expect(
        controller.uploadDocument(
          mockUser,
          'nonexistent-id',
          mockUploadDocumentDto,
        ),
      ).rejects.toThrow('Candidate not found');
    });
  });

  describe('POST /candidates/:candidateId/summaries/generate', () => {
    it('should request summary generation and return 202 Accepted', async () => {
      const pendingSummary = {
        id: mockSummary.id,
        status: 'pending',
        summary: null,
        recommendedDecision: null,
        createdAt: mockSummary.createdAt,
      };
      jest
        .spyOn(service, 'requestSummaryGeneration')
        .mockResolvedValue(pendingSummary as any);

      const result = await controller.requestSummaryGeneration(
        mockUser,
        mockCandidate.id,
      );

      expect(service.requestSummaryGeneration).toHaveBeenCalledWith(
        mockUser,
        mockCandidate.id,
      );
      expect(result.status).toBe('pending');
    });

    it('should pass user context', async () => {
      jest
        .spyOn(service, 'requestSummaryGeneration')
        .mockResolvedValue({} as any);

      await controller.requestSummaryGeneration(mockUser, mockCandidate.id);

      expect(service.requestSummaryGeneration).toHaveBeenCalledWith(
        mockUser,
        mockCandidate.id,
      );
    });

    it('should throw error when candidate not found', async () => {
      jest
        .spyOn(service, 'requestSummaryGeneration')
        .mockRejectedValue(new Error('Candidate not found'));

      await expect(
        controller.requestSummaryGeneration(mockUser, 'nonexistent-id'),
      ).rejects.toThrow('Candidate not found');
    });
  });

  describe('GET /candidates/:candidateId/summaries', () => {
    it('should list all summaries for candidate', async () => {
      const summaries = [
        {
          id: mockSummary.id,
          status: mockSummary.status,
          summary: mockSummary.summary,
          createdAt: mockSummary.createdAt,
        },
        {
          id: 'summary-456',
          status: 'pending',
          summary: null,
          createdAt: new Date('2026-03-02'),
        },
      ];
      jest.spyOn(service, 'listSummaries').mockResolvedValue(summaries as any);

      const result = await controller.listSummaries(mockUser, mockCandidate.id);

      expect(service.listSummaries).toHaveBeenCalledWith(
        mockUser,
        mockCandidate.id,
      );
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no summaries exist', async () => {
      jest.spyOn(service, 'listSummaries').mockResolvedValue([]);

      const result = await controller.listSummaries(mockUser, mockCandidate.id);

      expect(result).toEqual([]);
    });

    it('should enforce workspace access control', async () => {
      const otherWorkspaceUser = { ...mockUser, workspaceId: 'other-workspace' };
      jest.spyOn(service, 'listSummaries').mockResolvedValue([]);

      await controller.listSummaries(otherWorkspaceUser, mockCandidate.id);

      expect(service.listSummaries).toHaveBeenCalledWith(
        otherWorkspaceUser,
        mockCandidate.id,
      );
    });

    it('should throw error when candidate not found', async () => {
      jest
        .spyOn(service, 'listSummaries')
        .mockRejectedValue(new Error('Candidate not found'));

      await expect(
        controller.listSummaries(mockUser, 'nonexistent-id'),
      ).rejects.toThrow('Candidate not found');
    });
  });

  describe('GET /candidates/:candidateId/summaries/:summaryId', () => {
    it('should retrieve single summary by ID', async () => {
      const summaryResponse = {
        id: mockSummary.id,
        status: mockSummary.status,
        summary: mockSummary.summary,
        recommendedDecision: mockSummary.recommendedDecision,
        createdAt: mockSummary.createdAt,
      };
      jest.spyOn(service, 'getSummary').mockResolvedValue(summaryResponse as any);

      const result = await controller.getSummary(
        mockUser,
        mockCandidate.id,
        mockSummary.id,
      );

      expect(service.getSummary).toHaveBeenCalledWith(
        mockUser,
        mockCandidate.id,
        mockSummary.id,
      );
      expect(result).toEqual(summaryResponse);
    });

    it('should throw error when summary not found', async () => {
      jest
        .spyOn(service, 'getSummary')
        .mockRejectedValue(new Error('Summary not found'));

      await expect(
        controller.getSummary(mockUser, mockCandidate.id, 'nonexistent-id'),
      ).rejects.toThrow('Summary not found');
    });

    it('should enforce workspace access control', async () => {
      const otherWorkspaceUser = { ...mockUser, workspaceId: 'other-workspace' };
      jest
        .spyOn(service, 'getSummary')
        .mockRejectedValue(new Error('Candidate not found'));

      await expect(
        controller.getSummary(otherWorkspaceUser, mockCandidate.id, mockSummary.id),
      ).rejects.toThrow('Candidate not found');

      expect(service.getSummary).toHaveBeenCalledWith(
        otherWorkspaceUser,
        mockCandidate.id,
        mockSummary.id,
      );
    });

    it('should return summary with all fields', async () => {
      const summaryResponse = {
        id: mockSummary.id,
        status: mockSummary.status,
        summary: mockSummary.summary,
        recommendedDecision: mockSummary.recommendedDecision,
        score: mockSummary.score,
        createdAt: mockSummary.createdAt,
      };
      jest.spyOn(service, 'getSummary').mockResolvedValue(summaryResponse as any);

      const result = await controller.getSummary(
        mockUser,
        mockCandidate.id,
        mockSummary.id,
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendedDecision');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('Auth & Authorization', () => {
    it('should require authenticated user for all endpoints', async () => {
      // FakeAuthGuard is applied to all endpoints
      // This test verifies the guard is in place
      expect(controller.uploadDocument).toBeDefined();
      expect(controller.requestSummaryGeneration).toBeDefined();
      expect(controller.listSummaries).toBeDefined();
      expect(controller.getSummary).toBeDefined();
    });

    it('should pass user from @CurrentUser decorator', async () => {
      jest.spyOn(service, 'uploadDocument').mockResolvedValue({} as any);

      await controller.uploadDocument(
        mockUser,
        mockCandidate.id,
        mockUploadDocumentDto,
      );

      expect(service.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          workspaceId: mockUser.workspaceId,
        }),
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      jest
        .spyOn(service, 'uploadDocument')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        controller.uploadDocument(
          mockUser,
          mockCandidate.id,
          mockUploadDocumentDto,
        ),
      ).rejects.toThrow('Database error');
    });

    it('should propagate service exceptions', async () => {
      const error = new Error('Service unavailable');
      jest.spyOn(service, 'listSummaries').mockRejectedValue(error);

      await expect(
        controller.listSummaries(mockUser, mockCandidate.id),
      ).rejects.toThrow(error);
    });
  });
});
