import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseMessage } from "@langchain/core/messages";
import { BaseModel, type ModelConfig, type ModelResponse } from "../base.model";

interface AnthropicConfig extends ModelConfig {
  baseURL?: string;
}

class AnthropicModel extends BaseModel {
  private client: ChatAnthropic;

  constructor(config: AnthropicConfig) {
    super(config);
    this.validateConfig();

    const { apiKey, model, temperature = 0.7, maxTokens = 4096 } = this.config;
    const { baseURL } = config;

    this.client = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: model,
      temperature,
      maxTokens,
      clientOptions: baseURL ? { baseURL } : undefined,
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

export { AnthropicModel };
export type { AnthropicConfig };
