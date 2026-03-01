type InputHandler = (input: string, sessionId?: string) => Promise<string>;

interface InputInterface {
  start(): Promise<void>;
  stop(): void;
  onInput(handler: InputHandler): void;
}

export type { InputHandler, InputInterface };
