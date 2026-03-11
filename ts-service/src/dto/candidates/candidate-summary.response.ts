export type SummaryStatus = 'pending' | 'completed' | 'failed';
export type RecommendedDecision = 'advance' | 'hold' | 'reject';

export class CandidateSummaryResponse {
  id!: string;
  candidateId!: string;
  status!: SummaryStatus;
  score!: number | null;
  strengths!: string[] | null;
  concerns!: string[] | null;
  summary!: string | null;
  recommendedDecision!: RecommendedDecision | null;
  provider!: string | null;
  errorMessage!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
