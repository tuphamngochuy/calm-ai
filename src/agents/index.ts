import { END, GraphWrapper, START } from "@graphs/index";
import { logger } from "@helpers/logger";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { BaseModel, type ModelConfig } from "@models/base.model";
import { ModelFactory } from "@services/model/modelFactory.service";
import { NODE_NAME } from "@type/enum/langGraph";
import { LLM_MODEL } from "@type/enum/model";

interface AgentConfig {
  modelName: LLM_MODEL;
  modelConfig: ModelConfig;
  systemPrompt?: string;
}

interface ChatMessage {
  role: "system" | "human" | "assistant";
  content: string;
}

const AgentState = Annotation.Root({
  messages: Annotation<ChatMessage[]>({
    reducer: (state, action) => [...state, ...action],
    default: () => [],
  }),
  input: Annotation<string>({
    reducer: (_, action) => action,
    default: () => "",
  }),
});

type AgentStateType = typeof AgentState.State;

class Agent {
  private stateGraph;
  private model: BaseModel;
  private systemPrompt: string;

  constructor(config: AgentConfig) {
    const { modelName, modelConfig, systemPrompt = "You are a helpful assistant." } = config;

    this.model = ModelFactory.create(modelName, modelConfig);
    this.systemPrompt = systemPrompt;

    this.stateGraph = new GraphWrapper(AgentState)
      .addNode(NODE_NAME.USER_PROMPT, this.userPromptNode.bind(this))
      .addNode(NODE_NAME.LLM, this.llmNode.bind(this))
      .addEdge(START, NODE_NAME.USER_PROMPT)
      .addEdge(NODE_NAME.USER_PROMPT, NODE_NAME.LLM)
      .addEdge(NODE_NAME.LLM, END);
  }

  private userPromptNode(state: AgentStateType): Partial<AgentStateType> {
    const { input, messages } = state;

    if (messages.length === 0) {
      return {
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "human", content: input },
        ],
      };
    }

    return {
      messages: [{ role: "human", content: input }],
    };
  }

  private async llmNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
    const { messages } = state;

    const langchainMessages: BaseMessage[] = messages.map((msg) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content);
        case "human":
          return new HumanMessage(msg.content);
        case "assistant":
          return new AIMessage(msg.content);
      }
    });

    const response = await this.model.invoke(langchainMessages);

    logger.debug(`LLM Usage: ${JSON.stringify(response.usage)}`);

    return {
      messages: [{ role: "assistant", content: response.content }],
    };
  }

  compile() {
    return this.stateGraph.compile();
  }
}

export { Agent, AgentState };
export type { AgentConfig, ChatMessage };

