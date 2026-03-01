import { Agent, type ChatMessage } from "@agents/index";
import { logger } from "@helpers/logger";
import type { InputInterface } from "@interfaces/base";
import { CommandInterface } from "@interfaces/command/index";
import { TelegramInterface } from "@interfaces/telegram/index";
import { LLM_MODEL } from "@type/enum/model";
import dotenv from "dotenv";

class SessionManager {
  private sessions = new Map<string, ChatMessage[]>();

  getSession(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId) ?? [];
  }

  updateSession(sessionId: string, messages: ChatMessage[]): void {
    this.sessions.set(sessionId, messages);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

function createInputHandler(
  graph: ReturnType<Agent["compile"]>,
  sessionManager: SessionManager,
  defaultSessionId: string
) {
  return async (input: string, sessionId?: string): Promise<string> => {
    const actualSessionId = sessionId ?? defaultSessionId;

    if (input.toLowerCase() === "/clear") {
      sessionManager.clearSession(actualSessionId);
      return "Session cleared. Starting fresh conversation.";
    }

    const currentMessages = sessionManager.getSession(actualSessionId);

    const result = await graph.invoke({
      messages: currentMessages,
      input,
    });

    const { messages } = result;
    sessionManager.updateSession(actualSessionId, messages);

    const lastMessage = messages[messages.length - 1];
    return lastMessage?.content ?? "No response";
  };
}

function createInterfaces(): InputInterface[] {
  const interfaces: InputInterface[] = [];

  interfaces.push(new CommandInterface());

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  if (telegramToken) {
    const allowedUserIds = process.env.TELEGRAM_ALLOWED_USERS
      ?.split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    interfaces.push(
      new TelegramInterface({
        botToken: telegramToken,
        allowedUserIds,
      })
    );
    logger.info("Telegram interface enabled");
  }

  return interfaces;
}

async function main() {
  try {
    dotenv.config();

    const agent = new Agent({
      modelName: LLM_MODEL.KIMI,
      modelConfig: {
        apiKey: process.env.KIMI_API_KEY ?? "",
        model: "kimi-k2.5",
      },
      systemPrompt: "You are a helpful AI assistant.",
    });
    const graph = agent.compile();

    const sessionManager = new SessionManager();
    const interfaces = createInterfaces();

    for (const iface of interfaces) {
      const sessionId = iface.constructor.name;
      const inputHandler = createInputHandler(graph, sessionManager, sessionId);
      iface.onInput(inputHandler);
    }

    logger.info("Agent initialized. Starting all interfaces...");

    await Promise.all(interfaces.map((iface) => iface.start()));
  } catch (error) {
    const { message } = error as Error;
    logger.error(`Fatal error: ${message}`);
    process.exit(1);
  }
}

main();
