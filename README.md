# calm-ai

A conversational AI agent built with LangChain and LangGraph, supporting multiple LLM providers and input interfaces.

## Features

- Multi-model support: OpenAI, Google GenAI, Anthropic, Kimi
- Multiple input interfaces: Command Line, Telegram Bot
- Session management with conversation history
- Built with TypeScript and LangGraph

## Prerequisites

- Node.js >= 18
- Yarn 4.x (berry)

## Installation

```bash
yarn install
```

## Configuration

Create a `.env` file in the project root:

```env
# LLM API Keys (at least one required)
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
KIMI_API_KEY=your_kimi_api_key

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ALLOWED_USERS=user_id_1,user_id_2
```

## Usage

### Start the Agent

```bash
yarn start
```

### Available Commands

- Type your message to chat with the AI
- `/clear` - Clear conversation history and start fresh

### Supported Models

| Model | Enum Value | Provider |
|-------|------------|----------|
| OpenAI | `openai` | OpenAI |
| Google GenAI | `google-genai` | Google |
| Anthropic | `anthropic` | Anthropic |
| Kimi | `kimi` | Moonshot |

## Development

```bash
# Build TypeScript
yarn build

# Run linter
yarn lint

# Fix lint issues
yarn lint:fix
```

## Project Structure

```
src/
├── index.ts              # Entry point
├── agents/               # LangGraph agent definitions
├── interfaces/           # Input interfaces (CLI, Telegram)
├── models/               # LLM model implementations
├── services/             # Business logic services
├── helpers/              # Utility functions
└── type/                 # TypeScript types and enums
```
