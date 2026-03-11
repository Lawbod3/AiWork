import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import * as path from 'path';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { InitialStarterEntities1710000000000 } from '../migrations/1710000000000-InitialStarterEntities';
import { AddCandidateDocumentsAndSummaries1710000000001 } from '../migrations/1710000000001-AddCandidateDocumentsAndSummaries';

export const defaultDatabaseUrl =
  'sqlite:./talentflow.db';

export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions => {
  // Determine if using SQLite or PostgreSQL
  const isSqlite = databaseUrl.startsWith('sqlite');

  if (isSqlite) {
    // SQLite configuration (local development)
    return {
      type: 'sqlite',
      database: databaseUrl.replace('sqlite:', ''),
      entities: [SampleWorkspace, SampleCandidate, CandidateDocument, CandidateSummary],
      migrations: [InitialStarterEntities1710000000000, AddCandidateDocumentsAndSummaries1710000000001],
      migrationsTableName: 'typeorm_migrations',
      synchronize: false,
      logging: false,
    };
  } else {
    // PostgreSQL configuration (production)
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [SampleWorkspace, SampleCandidate, CandidateDocument, CandidateSummary],
      migrations: [InitialStarterEntities1710000000000, AddCandidateDocumentsAndSummaries1710000000001],
      migrationsTableName: 'typeorm_migrations',
      synchronize: false,
      logging: false,
    };
  }
};
