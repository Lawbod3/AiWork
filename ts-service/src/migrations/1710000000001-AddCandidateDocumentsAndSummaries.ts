import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddCandidateDocumentsAndSummaries1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create candidate_documents table
    await queryRunner.createTable(
      new Table({
        name: 'candidate_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'candidate_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'raw_text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'uploaded_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign key for candidate_documents
    await queryRunner.createForeignKey(
      'candidate_documents',
      new TableForeignKey({
        name: 'fk_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for candidate_documents
    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    // Create candidate_summaries table
    await queryRunner.createTable(
      new Table({
        name: 'candidate_summaries',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'candidate_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'strengths',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'concerns',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recommended_decision',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'prompt_version',
            type: 'integer',
            default: '1',
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign key for candidate_summaries
    await queryRunner.createForeignKey(
      'candidate_summaries',
      new TableForeignKey({
        name: 'fk_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for candidate_summaries
    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for candidate_summaries
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_status');
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_workspace_id');
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_id');

    // Drop foreign key and table for candidate_summaries
    await queryRunner.dropForeignKey('candidate_summaries', 'fk_candidate_summaries_candidate_id');
    await queryRunner.dropTable('candidate_summaries');

    // Drop indexes for candidate_documents
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_workspace_id');
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_id');

    // Drop foreign key and table for candidate_documents
    await queryRunner.dropForeignKey('candidate_documents', 'fk_candidate_documents_candidate_id');
    await queryRunner.dropTable('candidate_documents');
  }
}
