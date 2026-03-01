import type { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { BaseModel, type ModelConfig, type ModelResponse } from "../base.model";

interface OpenAIConfig extends ModelConfig {
  baseURL?: string;
}

class OpenAIModel extends BaseModel {
  private client: ChatOpenAI;

  constructor(config: OpenAIConfig) {
    super(config);
    this.validateConfig();

    const { apiKey, model, temperature = 0.7, maxTokens } = this.config;
    const { baseURL } = config;

    this.client = new ChatOpenAI({
      apiKey,
      model,
      temperature,
      maxTokens,
      configuration: baseURL ? { baseURL } : undefined,
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

export { OpenAIModel };
export type { OpenAIConfig };

