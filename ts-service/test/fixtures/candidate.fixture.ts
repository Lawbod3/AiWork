import { UploadDocumentDto, DocumentType } from '../../src/dto/candidates/upload-document.dto';
import { SummaryStatus } from '../../src/entities/candidate-summary.entity';

export const mockUser = {
  id: 'user-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  email: 'test@example.com',
};

export const mockCandidate = {
  id: 'candidate-123',
  workspaceId: 'workspace-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
};

export const mockDocument = {
  id: 'doc-123',
  candidateId: 'candidate-123',
  workspaceId: 'workspace-123',
  fileName: 'resume.pdf',
  storageKey: '/uploads/doc-123.txt',
  documentType: DocumentType.RESUME,
  rawText: 'John Doe is a software engineer with 5 years of experience...',
  uploadedAt: new Date('2026-03-01'),
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
};

export const mockSummary = {
  id: 'summary-123',
  candidateId: 'candidate-123',
  workspaceId: 'workspace-123',
  status: 'completed' as SummaryStatus,
  score: 85,
  strengths: '["Technical expertise", "Leadership"]',
  concerns: '["Limited experience"]',
  summary: 'Strong technical background with leadership potential',
  recommendedDecision: 'advance',
  provider: 'gemini',
  promptVersion: 1,
  errorMessage: null,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
};

export const mockUploadDocumentDto: UploadDocumentDto = {
  documentType: DocumentType.RESUME,
  fileName: 'resume.pdf',
  rawText: 'John Doe is a software engineer with 5 years of experience in full-stack development.',
};

export const mockInvalidUploadDto = {
  documentType: 'INVALID_TYPE',
  fileName: 'test.pdf',
  rawText: 'Short',
};
