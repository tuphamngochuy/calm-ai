import type { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { BaseModel, type ModelConfig, type ModelResponse } from "../base.model";

const KIMI_BASE_URL = "https://api.moonshot.ai/v1";

interface KimiConfig extends Omit<ModelConfig, "model"> {
  model?: string;
}

class KimiModel extends BaseModel {
  private client: ChatOpenAI;

  constructor(config: KimiConfig) {
    super({
      ...config,
      model: config.model ?? "moonshot-v1-8k",
    });
    this.validateConfig();

    const { apiKey, model, temperature = 1, maxTokens } = this.config;

    if (temperature < 1) {
      throw new Error("Temperature must be greater than 1");
    }

    this.client = new ChatOpenAI({
      apiKey,
      model,
      temperature,
      maxTokens,
      configuration: {
        baseURL: KIMI_BASE_URL,
      },
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

export { KimiModel };
export type { KimiConfig };

