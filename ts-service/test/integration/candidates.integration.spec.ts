import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ExecutionContext } from '@nestjs/common';
import { CandidatesController } from '../../src/controllers/candidates/candidates.controller';
import { CandidatesService } from '../../src/services/candidates/candidates.service';
import { CandidateMapper } from '../../src/utils/candidates/mappers/candidate.mapper';
import { FakeAuthGuard } from '../../src/auth/fake-auth.guard';
import { DocumentType } from '../../src/dto/candidates/upload-document.dto';
import { mockCandidate, mockUser } from '../fixtures/candidate.fixture';

/**
 * Integration Tests - DTO Validation at HTTP Boundary
 * 
 * Tests that class-validator decorators work correctly:
 * - @IsEnum validates DocumentType
 * - @MinLength validates rawText >= 10 chars
 * - @MaxLength validates fileName <= 255 chars
 * - @IsString validates field types
 */
describe('Candidates Integration Tests - DTO Validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockService = {
      uploadDocument: jest.fn().mockImplementation(() =>
        Promise.resolve({
          id: 'doc-123',
          fileName: 'resume.pdf',
          documentType: DocumentType.RESUME,
          createdAt: new Date(),
        }),
      ),
      requestSummaryGeneration: jest.fn().mockImplementation(() =>
        Promise.resolve({
          id: 'summary-123',
          status: 'pending',
          createdAt: new Date(),
        }),
      ),
      listSummaries: jest.fn().mockImplementation(() => Promise.resolve([])),
      getSummary: jest.fn().mockImplementation(() =>
        Promise.resolve({
          id: 'summary-123',
          status: 'completed',
          createdAt: new Date(),
        }),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        { provide: CandidatesService, useValue: mockService },
        CandidateMapper,
      ],
    })
      .overrideGuard(FakeAuthGuard)
      .useValue({ canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockUser;
        return true;
      }})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('UploadDocumentDto Validation', () => {
    it('should accept valid DTO with all required fields', async () => {
      const validDto = {
        documentType: DocumentType.RESUME,
        fileName: 'resume.pdf',
        rawText: 'John Doe is a software engineer with 5 years of experience.',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(validDto)
        .expect(201);
    });

    it('should reject invalid documentType (not in enum)', async () => {
      const invalidDto = {
        documentType: 'INVALID_TYPE',
        fileName: 'resume.pdf',
        rawText: 'John Doe is a software engineer with 5 years of experience.',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject rawText < 10 characters (@MinLength)', async () => {
      const invalidDto = {
        documentType: DocumentType.RESUME,
        fileName: 'resume.pdf',
        rawText: 'Short',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject fileName > 255 characters (@MaxLength)', async () => {
      const invalidDto = {
        documentType: DocumentType.RESUME,
        fileName: 'a'.repeat(256),
        rawText: 'John Doe is a software engineer with 5 years of experience.',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      const incompleteDto = {
        documentType: DocumentType.RESUME,
        // missing fileName and rawText
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(incompleteDto)
        .expect(400);
    });

    it('should reject non-string rawText (@IsString)', async () => {
      const invalidDto = {
        documentType: DocumentType.RESUME,
        fileName: 'resume.pdf',
        rawText: 12345,
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject non-string fileName (@IsString)', async () => {
      const invalidDto = {
        documentType: DocumentType.RESUME,
        fileName: 123,
        rawText: 'John Doe is a software engineer with 5 years of experience.',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(invalidDto)
        .expect(400);
    });

    it('should accept all valid DocumentType enum values', async () => {
      const types = [
        DocumentType.RESUME,
        DocumentType.COVER_LETTER,
        DocumentType.PORTFOLIO,
        DocumentType.OTHER,
      ];

      for (const type of types) {
        const validDto = {
          documentType: type,
          fileName: 'document.pdf',
          rawText: 'This is a valid document with sufficient length.',
        };

        await request(app.getHttpServer())
          .post(`/candidates/${mockCandidate.id}/documents`)
          .send(validDto)
          .expect(201);
      }
    });

    it('should accept rawText with exactly 10 characters (minimum)', async () => {
      const validDto = {
        documentType: DocumentType.RESUME,
        fileName: 'resume.pdf',
        rawText: '1234567890',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(validDto)
        .expect(201);
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 201 Created for successful document upload', async () => {
      const validDto = {
        documentType: DocumentType.RESUME,
        fileName: 'resume.pdf',
        rawText: 'John Doe is a software engineer with 5 years of experience.',
      };

      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/documents`)
        .send(validDto)
        .expect(201);
    });

    it('should return 202 Accepted for summary generation', async () => {
      await request(app.getHttpServer())
        .post(`/candidates/${mockCandidate.id}/summaries/generate`)
        .expect(202);
    });

    it('should return 200 OK for list summaries', async () => {
      await request(app.getHttpServer())
        .get(`/candidates/${mockCandidate.id}/summaries`)
        .expect(200);
    });

    it('should return 200 OK for get single summary', async () => {
      await request(app.getHttpServer())
        .get(`/candidates/${mockCandidate.id}/summaries/summary-123`)
        .expect(200);
    });
  });
});
