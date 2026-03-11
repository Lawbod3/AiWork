import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

import { CandidateDocument } from '../../entities/candidate-document.entity';
import { CandidateSummary } from '../../entities/candidate-summary.entity';
import { SampleCandidate } from '../../entities/sample-candidate.entity';
import { QueueService } from '../../queue/queue.service';
import { AuthUser } from '../../auth/auth.types';
import { UploadDocumentDto, DocumentType } from '../../dto/candidates/upload-document.dto';
import { CandidateDocumentResponse } from '../../dto/candidates/candidate-document.response';
import { CandidateSummaryResponse } from '../../dto/candidates/candidate-summary.response';
import { CandidateMapper } from '../../utils/candidates/mappers/candidate.mapper';

@Injectable()
export class CandidatesService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
    private readonly queueService: QueueService,
    private readonly mapper: CandidateMapper,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Upload a candidate document
   * Saves file to disk and creates database record
   */
  async uploadDocument(
    user: AuthUser,
    candidateId: string,
    dto: UploadDocumentDto,
  ): Promise<CandidateDocumentResponse> {
    // Verify candidate exists and belongs to user's workspace
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, workspaceId: user.workspaceId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Generate unique file path
    const documentId = uuidv4();
    const storageKey = path.join(this.uploadsDir, `${documentId}.txt`);

    // Write file to disk
    try {
      fs.writeFileSync(storageKey, dto.rawText, 'utf-8');
    } catch (error) {
      throw new BadRequestException('Failed to save document');
    }

    // Create database record
    const document = this.documentRepository.create({
      id: documentId,
      candidateId,
      workspaceId: user.workspaceId,
      documentType: dto.documentType as DocumentType,
      fileName: dto.fileName,
      storageKey,
      rawText: dto.rawText,
      uploadedAt: new Date(),
    });

    await this.documentRepository.save(document);

    return this.mapper.mapDocumentToResponse(document);
  }

  /**
   * Request summary generation
   * Creates pending summary record and enqueues background job
   */
  async requestSummaryGeneration(
    user: AuthUser,
    candidateId: string,
  ): Promise<CandidateSummaryResponse> {
    // Verify candidate exists and belongs to user's workspace
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, workspaceId: user.workspaceId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Create pending summary record
    const summaryId = uuidv4();
    const summary = this.summaryRepository.create({
      id: summaryId,
      candidateId,
      workspaceId: user.workspaceId,
      status: 'pending',
    });

    await this.summaryRepository.save(summary);

    // Enqueue background job
    await this.queueService.enqueue('generate-candidate-summary', {
      summaryId,
      candidateId,
      workspaceId: user.workspaceId,
    });

    return this.mapper.mapSummaryToResponse(summary);
  }

  /**
   * List all summaries for a candidate
   */
  async listSummaries(
    user: AuthUser,
    candidateId: string,
  ): Promise<CandidateSummaryResponse[]> {
    // Verify candidate exists and belongs to user's workspace
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, workspaceId: user.workspaceId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const summaries = await this.summaryRepository.find({
      where: { candidateId, workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });

    return summaries.map((s) => this.mapper.mapSummaryToResponse(s));
  }

  /**
   * Get a single summary
   */
  async getSummary(
    user: AuthUser,
    candidateId: string,
    summaryId: string,
  ): Promise<CandidateSummaryResponse> {
    // Verify candidate exists and belongs to user's workspace
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, workspaceId: user.workspaceId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const summary = await this.summaryRepository.findOne({
      where: {
        id: summaryId,
        candidateId,
        workspaceId: user.workspaceId,
      },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return this.mapper.mapSummaryToResponse(summary);
  }

  /**
   * Get all documents for a candidate (used by worker)
   */
  async getDocumentsForCandidate(
    candidateId: string,
    workspaceId: string,
  ): Promise<CandidateDocument[]> {
    return this.documentRepository.find({
      where: { candidateId, workspaceId },
      order: { uploadedAt: 'DESC' },
    });
  }

  /**
   * Update summary with LLM results
   */
  async updateSummaryWithResult(
    summaryId: string,
    result: {
      score: number;
      strengths: string[];
      concerns: string[];
      summary: string;
      recommendedDecision: 'advance' | 'hold' | 'reject';
      provider: string;
      promptVersion: number;
    },
  ): Promise<void> {
    await this.summaryRepository.update(
      { id: summaryId },
      {
        status: 'completed',
        score: result.score,
        strengths: JSON.stringify(result.strengths),
        concerns: JSON.stringify(result.concerns),
        summary: result.summary,
        recommendedDecision: result.recommendedDecision,
        provider: result.provider,
        promptVersion: result.promptVersion,
        updatedAt: new Date(),
      },
    );
  }

  /**
   * Update summary with error
   */
  async updateSummaryWithError(
    summaryId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.summaryRepository.update(
      { id: summaryId },
      {
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      },
    );
  }
}
