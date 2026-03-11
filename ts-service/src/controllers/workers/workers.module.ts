import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkersController } from './workers.controller';
import { SummaryGenerationWorker } from '../../services/candidates/summary-generation-worker.service';
import { CandidateSummary } from '../../entities/candidate-summary.entity';
import { CandidatesService } from '../../services/candidates/candidates.service';
import { CandidateDocument } from '../../entities/candidate-document.entity';
import { SampleCandidate } from '../../entities/sample-candidate.entity';
import { QueueModule } from '../../queue/queue.module';
import { LlmModule } from '../../llm/llm.module';
import { CandidateMapper } from '../../utils/candidates/mappers/candidate.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateSummary, CandidateDocument, SampleCandidate]),
    QueueModule,
    LlmModule,
  ],
  controllers: [WorkersController],
  providers: [SummaryGenerationWorker, CandidatesService, CandidateMapper],
})
export class WorkersModule {}
