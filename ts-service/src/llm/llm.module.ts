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
        // Use Gemini if API key is provided, otherwise use fake provider
        const useGemini = !!process.env.GEMINI_API_KEY;
        return useGemini ? new GeminiProvider() : new FakeSummarizationProvider();
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER, FakeSummarizationProvider, GeminiProvider],
})
export class LlmModule {}
