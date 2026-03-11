import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

@Injectable()
export class GeminiProvider implements SummarizationProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set. Gemini provider will not work.');
    }
    this.client = new GoogleGenerativeAI(apiKey || '');
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = this.buildPrompt(input);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.text();
      const parsed = this.parseResponse(responseText);

      return parsed;
    } catch (error) {
      this.logger.error(
        `Failed to generate summary for candidate ${input.candidateId}`,
        error,
      );
      throw error;
    }
  }

  private buildPrompt(input: CandidateSummaryInput): string {
    const documentsText = input.documents.join('\n\n---\n\n');

    return `You are a recruiting analyst. Analyze the following candidate documents and provide a structured assessment.

CANDIDATE DOCUMENTS:
${documentsText}

Provide your assessment in the following JSON format (respond ONLY with valid JSON, no markdown or extra text):
{
  "score": <number 0-100>,
  "strengths": [<list of 2-3 key strengths as strings>],
  "concerns": [<list of 1-2 concerns as strings>],
  "summary": "<2-3 sentence professional summary>",
  "recommendedDecision": "<one of: 'advance', 'hold', 'reject'>"
}

Be concise and professional. Base your assessment on the actual content provided.`;
  }

  private parseResponse(responseText: string): CandidateSummaryResult {
    try {
      // Extract JSON from response (handle cases where model adds markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (
        typeof parsed.score !== 'number' ||
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.concerns) ||
        typeof parsed.summary !== 'string' ||
        !['advance', 'hold', 'reject'].includes(parsed.recommendedDecision)
      ) {
        throw new Error('Invalid response structure');
      }

      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        strengths: parsed.strengths.slice(0, 5),
        concerns: parsed.concerns.slice(0, 5),
        summary: parsed.summary.slice(0, 1000),
        recommendedDecision: parsed.recommendedDecision,
      };
    } catch (error) {
      this.logger.error('Failed to parse Gemini response', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid LLM response format: ${message}`);
    }
  }
}
