import * as readline from "readline";
import { logger } from "@helpers/logger";
import type { InputHandler, InputInterface } from "../base";

class CommandInterface implements InputInterface {
  private rl: readline.Interface | null = null;
  private handler: InputHandler | null = null;
  private isRunning = false;
  private log = logger.child("CLI");

  onInput(handler: InputHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.rl.setPrompt("> ");
    this.rl.prompt();

    this.rl.on("line", async (line) => {
      const input = line.trim();

      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        this.stop();
        return;
      }

      if (!input) {
        this.rl?.prompt();
        return;
      }

      if (this.handler) {
        try {
          const response = await this.handler(input);
          this.log.info(response);
        } catch (error) {
          const { message } = error as Error;
          this.log.error(`Error: ${message}`);
        }
      }

      this.rl?.prompt();
    });

    this.rl.on("close", () => {
      this.isRunning = false;
      this.log.info("Goodbye!");
      process.exit(0);
    });
  }

  stop(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    this.isRunning = false;
  }
}

export { CommandInterface };
