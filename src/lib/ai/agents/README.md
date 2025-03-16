# Agent Framework

This is a TypeScript implementation of an agent framework inspired by OpenAI's agent framework. It provides a structured way to build, configure, and run AI agents with tools, guardrails, and handoffs.

## Core Components

- **Agent**: The main class that represents an AI agent with instructions, tools, and other configurations.
- **Runner**: A utility class for running agents and managing their execution.
- **Tools**: Functions that agents can use to perform actions.
- **Guardrails**: Checks that run before or after agent execution to ensure safety and quality.
- **Handoffs**: Mechanism for agents to delegate tasks to other specialized agents.

## Basic Usage

```typescript
import { Agent, Runner } from '../ai/agents';

// Create a simple agent
const agent = new Agent({
  name: "SimpleAgent",
  instructions: "You are a helpful assistant. Answer user questions concisely and accurately.",
  model: "gpt-4",
  modelSettings: {
    temperature: 0.7,
    maxTokens: 1000
  }
});

// Create a context for the agent
const context = {
  chatId: "chat-123",
  userId: "user-123",
  organisationId: "org-123"
};

// Run the agent
const result = await Runner.run(
  agent,
  "What is the capital of France?",
  context
);

console.log(result.output); // "Paris"
```

## Adding Tools

Tools allow agents to perform actions beyond just generating text:

```typescript
import { Agent, functionTool } from '../ai/agents';

// Create a function tool
const getWeatherTool = functionTool(
  async (args: { city: string }, context) => {
    // Call a weather API
    return {
      temperature: 22,
      conditions: "Sunny",
      city: args.city
    };
  },
  {
    name: "get_weather",
    description: "Get the current weather for a city",
    parameters: {
      city: {
        type: "string",
        description: "The city to get weather for"
      }
    }
  }
);

// Create an agent with tools
const agent = new Agent({
  name: "WeatherAgent",
  instructions: "You are a weather assistant. Help users get weather information.",
  model: "gpt-4",
  tools: [getWeatherTool]
});
```

### Speech Tools

The framework includes built-in tools for text-to-speech and speech-to-text conversion:

```typescript
import { Agent, textToSpeechTool, speechToTextTool } from '../ai/agents';

// Create an agent with speech tools
const speechAgent = new Agent({
  name: "SpeechAssistant",
  instructions: "You are an assistant that can handle speech conversion tasks.",
  model: "gpt-4",
  tools: [
    textToSpeechTool({
      voice: "alloy" // Optional voice configuration
    }),
    speechToTextTool({
      returnSegments: true // Optional configuration to return segments
    })
  ]
});

// Run the agent with a text-to-speech request
const result = await Runner.run(
  speechAgent,
  "Please convert this text to speech",
  context
);

// The result will contain a file and filename for the generated audio
```

## Using Guardrails

Guardrails help ensure safety and quality:

```typescript
import { Runner, createContentModerationGuardrail } from '../ai/agents';

// Create a content moderation guardrail
const contentModerationGuardrail = createContentModerationGuardrail();

// Run the agent with guardrails
const result = await Runner.run(
  agent,
  userInput,
  context,
  {
    inputGuardrails: [contentModerationGuardrail]
  }
);
```

## Agent Handoffs

Handoffs allow agents to delegate to specialized agents:

```typescript
import { Agent, handoff } from '../ai/agents';

// Create specialized agents
const weatherAgent = new Agent({
  name: "WeatherAgent",
  instructions: "You are a weather specialist.",
  model: "gpt-4",
  tools: [getWeatherTool]
});

const newsAgent = new Agent({
  name: "NewsAgent",
  instructions: "You are a news specialist.",
  model: "gpt-4"
});

// Create a main agent that can hand off to specialized agents
const mainAgent = new Agent({
  name: "MainAssistant",
  instructions: "You are a helpful assistant. Hand off to specialized agents when appropriate.",
  model: "gpt-4",
  handoffs: [
    handoff(weatherAgent, {
      name: "weather_handoff",
      description: "Hand off to the weather agent for weather-related queries"
    }),
    handoff(newsAgent, {
      name: "news_handoff",
      description: "Hand off to the news agent for news-related queries"
    })
  ]
});
```

## Integration with Chat Store

The agent framework integrates with the existing chat store to persist messages and agent executions:

```typescript
// Agent executions are stored in the chat session state
const chatSession = await chatStore.get(context.chatId);
const agentExecutions = chatSession.state.agentExecutions || {};

// Access a specific agent execution
const execution = agentExecutions[executionId];
```

## Advanced Features

- **Dynamic Instructions**: Provide a function instead of a string for dynamic agent instructions.
- **Output Types**: Specify the expected output type for structured responses.
- **Hooks**: Register callbacks for various lifecycle events.

See the examples.ts file for more detailed usage examples. 