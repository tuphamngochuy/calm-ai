import { BaseModel, type ModelConfig } from "@models/base.model";
import { OpenAIModel } from "@models/openAI/index";
import { AnthropicModel } from "@models/anthropic/index";
import { GoogleModel } from "@models/google/index";
import { KimiModel } from "@models/kimi/index";
import { LLM_MODEL } from "@type/enum/model";

type ModelConfigMap = {
  [LLM_MODEL.OPENAI]: ModelConfig & { baseURL?: string };
  [LLM_MODEL.ANTHROPIC]: ModelConfig & { baseURL?: string };
  [LLM_MODEL.GOOGLE_GENAI]: ModelConfig;
  [LLM_MODEL.KIMI]: Omit<ModelConfig, "model"> & { model?: string };
};

class ModelFactory {
  private static modelRegistry: Record<LLM_MODEL, new (config: ModelConfig) => BaseModel> = {
    [LLM_MODEL.OPENAI]: OpenAIModel,
    [LLM_MODEL.ANTHROPIC]: AnthropicModel,
    [LLM_MODEL.GOOGLE_GENAI]: GoogleModel,
    [LLM_MODEL.KIMI]: KimiModel,
  };

  static create<T extends LLM_MODEL>(
    modelName: T,
    config: ModelConfigMap[T]
  ): BaseModel {
    const ModelClass = this.modelRegistry[modelName];

    if (!ModelClass) {
      throw new Error(`Unsupported model: ${modelName}`);
    }

    return new ModelClass(config as ModelConfig);
  }

  static isSupported(modelName: string): modelName is LLM_MODEL {
    return Object.values(LLM_MODEL).includes(modelName as LLM_MODEL);
  }

  static getSupportedModels(): LLM_MODEL[] {
    return Object.values(LLM_MODEL);
  }
}

export { ModelFactory };
export type { ModelConfigMap };
