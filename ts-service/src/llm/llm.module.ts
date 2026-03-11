import { Module } from '@nestjs/common';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiProvider } from './gemini.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  providers: [
    FakeSummarizationProvider,
    GeminiProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      useFactory: () => {
        // Use Gemini in production if API key is set, otherwise use fake
        const useGemini = process.env.GEMINI_API_KEY && process.env.NODE_ENV === 'production';
        return useGemini ? new GeminiProvider() : new FakeSummarizationProvider();
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER, FakeSummarizationProvider, GeminiProvider],
})
export class LlmModule {}
