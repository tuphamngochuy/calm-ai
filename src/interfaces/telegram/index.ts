import { Telegraf, Context } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "@helpers/logger";
import type { InputHandler, InputInterface } from "../base";

interface TelegramConfig {
  botToken: string;
  allowedUserIds?: number[];
}

class TelegramInterface implements InputInterface {
  private bot: Telegraf;
  private handler: InputHandler | null = null;
  private allowedUserIds: number[] | null;
  private log = logger.child("Telegram");

  constructor(config: TelegramConfig) {
    const { botToken, allowedUserIds } = config;

    if (!botToken) {
      throw new Error("Telegram bot token is required");
    }

    this.bot = new Telegraf(botToken);
    this.allowedUserIds = allowedUserIds ?? null;

    this.setupHandlers();
  }

  onInput(handler: InputHandler): void {
    this.handler = handler;
  }

  private setupHandlers(): void {
    this.bot.command("start", (ctx) => {
      ctx.reply("Hello! I'm your AI assistant. Send me a message to start chatting.");
    });

    this.bot.command("help", (ctx) => {
      ctx.reply(
        "Available commands:\n" +
        "/start - Start the bot\n" +
        "/clear - Clear conversation history\n" +
        "/help - Show this help message\n\n" +
        "Just send me any message to chat with the AI."
      );
    });

    this.bot.command("clear", async (ctx) => {
      if (!this.isUserAllowed(ctx)) return;

      const sessionId = `telegram_${ctx.from?.id}`;
      if (this.handler) {
        await this.handler("/clear", sessionId);
        await ctx.reply("Conversation history cleared. Starting fresh!");
      }
    });

    this.bot.on(message("text"), async (ctx) => {
      if (!this.isUserAllowed(ctx)) {
        this.log.warn(`Unauthorized access attempt from user ${ctx.from?.id}`);
        return;
      }

      const userMessage = ctx.message.text;
      const userId = ctx.from?.id;
      const sessionId = `telegram_${userId}`;

      this.log.debug(`Received message from user ${userId}: ${userMessage}`);

      if (!this.handler) {
        await ctx.reply("Bot is not configured to handle messages yet.");
        return;
      }

      try {
        await ctx.sendChatAction("typing");

        const response = await this.handler(userMessage, sessionId);

        await ctx.reply(response, { parse_mode: "Markdown" });
      } catch (error) {
        const { message } = error as Error;
        this.log.error(`Error processing message: ${message}`);
        await ctx.reply("Sorry, an error occurred while processing your message.");
      }
    });

    this.bot.catch((error, ctx) => {
      this.log.error(`Bot error for ${ctx.updateType}:`, error);
    });
  }

  private isUserAllowed(ctx: Context): boolean {
    if (!this.allowedUserIds) {
      return true;
    }

    const userId = ctx.from?.id;
    if (!userId) {
      return false;
    }

    return this.allowedUserIds.includes(userId);
  }

  async start(): Promise<void> {
    this.log.info("Starting Telegram bot...");

    await this.bot.launch();

    this.log.info("Telegram bot started successfully");

    process.once("SIGINT", () => this.stop());
    process.once("SIGTERM", () => this.stop());
  }

  stop(): void {
    this.log.info("Stopping Telegram bot...");
    this.bot.stop("SIGINT");
  }
}

export { TelegramInterface };
export type { TelegramConfig };
