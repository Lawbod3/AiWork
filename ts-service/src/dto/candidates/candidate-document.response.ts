import { DocumentType } from './upload-document.dto';

export class CandidateDocumentResponse {
  id!: string;
  candidateId!: string;
  documentType!: DocumentType;
  fileName!: string;
  uploadedAt!: Date;
}
