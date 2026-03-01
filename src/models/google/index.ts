import type { BaseMessage } from "@langchain/core/messages";
import {
  ChatGoogleGenerativeAI,
  type GoogleGenerativeAIChatInput,
} from "@langchain/google-genai";
import { BaseModel, type ModelConfig, type ModelResponse } from "../base.model";

interface GoogleConfig extends ModelConfig {
  safetySettings?: GoogleGenerativeAIChatInput["safetySettings"];
}

class GoogleModel extends BaseModel {
  private client: ChatGoogleGenerativeAI;

  constructor(config: GoogleConfig) {
    super(config);
    this.validateConfig();

    const { apiKey, model, temperature = 0.7, maxTokens } = this.config;
    const { safetySettings } = config;

    this.client = new ChatGoogleGenerativeAI({
      apiKey,
      model,
      temperature,
      maxOutputTokens: maxTokens,
      safetySettings,
    });
  }

  async invoke(messages: BaseMessage[]): Promise<ModelResponse> {
    const response = await this.client.invoke(messages);

    return {
      content: typeof response.content === "string" ? response.content : "",
      usage: response.usage_metadata
        ? {
            inputTokens: response.usage_metadata.input_tokens,
            outputTokens: response.usage_metadata.output_tokens,
          }
        : undefined,
    };
  }

  async *stream(messages: BaseMessage[]): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.stream(messages);

    for await (const chunk of stream) {
      if (typeof chunk.content === "string") {
        yield chunk.content;
      }
    }
  }
}

export { GoogleModel };
export type { GoogleConfig };

