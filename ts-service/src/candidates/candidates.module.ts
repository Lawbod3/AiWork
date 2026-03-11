import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { CandidatesService } from '../services/candidates/candidates.service';
import { CandidatesController } from '../controllers/candidates/candidates.controller';
import { CandidateMapper } from '../utils/candidates/mappers/candidate.mapper';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateDocument,
      CandidateSummary,
      SampleCandidate,
    ]),
    QueueModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService, CandidateMapper],
  exports: [CandidatesService],
})
export class CandidatesModule {}
