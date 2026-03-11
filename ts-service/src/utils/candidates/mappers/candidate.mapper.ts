import { Injectable } from '@nestjs/common';
import { CandidateDocument } from '../../../entities/candidate-document.entity';
import { CandidateSummary } from '../../../entities/candidate-summary.entity';
import { CandidateDocumentResponse } from '../../../dto/candidates/candidate-document.response';
import { CandidateSummaryResponse } from '../../../dto/candidates/candidate-summary.response';

/**
 * Mapper for transforming entities to response DTOs
 * Handles serialization, JSON parsing, and field transformation
 */
@Injectable()
export class CandidateMapper {
  /**
   * Map CandidateDocument entity to response DTO
   * Filters out internal fields (storageKey, rawText)
   */
  mapDocumentToResponse(
    document: CandidateDocument,
  ): CandidateDocumentResponse {
    const response = new CandidateDocumentResponse();
    response.id = document.id;
    response.candidateId = document.candidateId;
    response.documentType = document.documentType as any;
    response.fileName = document.fileName;
    response.uploadedAt = document.uploadedAt;
    return response;
  }

  /**
   * Map CandidateSummary entity to response DTO
   * Parses JSON fields (strengths, concerns)
   * Handles null values gracefully
   */
  mapSummaryToResponse(
    summary: CandidateSummary,
  ): CandidateSummaryResponse {
    const response = new CandidateSummaryResponse();
    response.id = summary.id;
    response.candidateId = summary.candidateId;
    response.status = summary.status;
    response.score = summary.score;
    response.strengths = summary.strengths
      ? JSON.parse(summary.strengths)
      : null;
    response.concerns = summary.concerns
      ? JSON.parse(summary.concerns)
      : null;
    response.summary = summary.summary;
    response.recommendedDecision = summary.recommendedDecision as
      | 'advance'
      | 'hold'
      | 'reject'
      | null;
    response.provider = summary.provider;
    response.errorMessage = summary.errorMessage;
    response.createdAt = summary.createdAt;
    response.updatedAt = summary.updatedAt;
    return response;
  }
}
