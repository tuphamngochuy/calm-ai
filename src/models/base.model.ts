import type { BaseMessage } from "@langchain/core/messages";

interface ModelConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface ModelResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

abstract class BaseModel {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract invoke(messages: BaseMessage[]): Promise<ModelResponse>;

  abstract stream(
    messages: BaseMessage[]
  ): AsyncGenerator<string, void, unknown>;

  get modelName(): string {
    return this.config.model;
  }

  protected validateConfig(): void {
    const { apiKey, model } = this.config;
    if (!apiKey) {
      throw new Error("API key is required");
    }
    if (!model) {
      throw new Error("Model name is required");
    }
  }
}

export { BaseModel };
export type { ModelConfig, ModelResponse };
