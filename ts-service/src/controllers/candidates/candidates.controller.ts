import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FakeAuthGuard } from '../../auth/fake-auth.guard';
import { CurrentUser } from '../../auth/auth-user.decorator';
import { AuthUser } from '../../auth/auth.types';
import { CandidatesService } from '../../services/candidates/candidates.service';
import { UploadDocumentDto } from '../../dto/candidates/upload-document.dto';
import { CandidateDocumentResponse } from '../../dto/candidates/candidate-document.response';
import { CandidateSummaryResponse } from '../../dto/candidates/candidate-summary.response';

@Controller('candidates')
@UseGuards(FakeAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * Upload a candidate document
   * POST /candidates/:candidateId/documents
   * Returns 201 Created with document details
   */
  @Post(':candidateId/documents')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: UploadDocumentDto,
  ): Promise<CandidateDocumentResponse> {
    return this.candidatesService.uploadDocument(user, candidateId, dto);
  }

  /**
   * Request summary generation for a candidate
   * POST /candidates/:candidateId/summaries/generate
   * Returns 202 Accepted (job queued, not yet processed)
   */
  @Post(':candidateId/summaries/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestSummaryGeneration(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ): Promise<CandidateSummaryResponse> {
    return this.candidatesService.requestSummaryGeneration(user, candidateId);
  }

  /**
   * List all summaries for a candidate
   * GET /candidates/:candidateId/summaries
   * Returns 200 OK with array of summaries
   */
  @Get(':candidateId/summaries')
  @HttpCode(HttpStatus.OK)
  async listSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ): Promise<CandidateSummaryResponse[]> {
    return this.candidatesService.listSummaries(user, candidateId);
  }

  /**
   * Get a single summary
   * GET /candidates/:candidateId/summaries/:summaryId
   * Returns 200 OK with summary details
   */
  @Get(':candidateId/summaries/:summaryId')
  @HttpCode(HttpStatus.OK)
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ): Promise<CandidateSummaryResponse> {
    return this.candidatesService.getSummary(user, candidateId, summaryId);
  }
}
