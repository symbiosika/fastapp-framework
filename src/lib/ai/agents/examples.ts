import { Agent, Runner, functionTool, webSearchTool, createContentModerationGuardrail, handoff, executeAgentWorkflow } from './index';
import { ChatSessionContext } from '../chat/chat-store';

/**
 * Example of creating a simple agent
 */
export function createSimpleAgent() {
  // Create a simple agent that responds to user queries
  const agent = new Agent({
    name: "SimpleAgent",
    instructions: "You are a helpful assistant. Answer user questions concisely and accurately.",
    model: "gpt-4",
    modelSettings: {
      temperature: 0.7,
      maxTokens: 1000
    }
  });

  return agent;
}

/**
 * Example of creating an agent with tools
 */
export function createAgentWithTools() {
  // Create a function tool for getting the weather
  const getWeatherTool = functionTool(
    async (args: { city: string }, context: ChatSessionContext) => {
      // This would normally call a weather API
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
    instructions: "You are a weather assistant. Help users get weather information for different cities.",
    model: "gpt-4",
    tools: [getWeatherTool, webSearchTool()]
  });

  return agent;
}

/**
 * Example of creating agents with handoffs
 */
export function createAgentsWithHandoffs() {
  // Create a specialized weather agent
  const weatherAgent = createAgentWithTools();
  
  // Create a general assistant that can hand off to the weather agent
  const mainAgent = new Agent({
    name: "MainAssistant",
    instructions: "You are a helpful assistant. If users ask about weather, hand off to the weather agent.",
    model: "gpt-4",
    handoffs: [handoff(weatherAgent, {
      name: "weather_handoff",
      description: "Hand off to the weather agent for weather-related queries"
    })]
  });

  return { mainAgent, weatherAgent };
}

/**
 * Example of running an agent
 */
export async function runAgentExample() {
  // Create a simple agent
  const agent = createSimpleAgent();
  
  // Create a context for the agent
  const context: ChatSessionContext = {
    chatId: "example-chat-123",
    userId: "user-123",
    organisationId: "org-123"
  };
  
  // Add a content moderation guardrail
  const contentModerationGuardrail = createContentModerationGuardrail();
  
  // Run the agent
  const result = await Runner.run(
    agent,
    "What is the capital of France?",
    context,
    {
      inputGuardrails: [contentModerationGuardrail]
    }
  );
  
  console.log("Agent output:", result.output);
  
  return result;
}

/**
 * Example of creating a multi-agent workflow
 */
export async function createMultiAgentWorkflow() {
  // Create a specialized translation agent
  const translationAgent = new Agent({
    name: "TranslationAgent",
    instructions: "You are a translation assistant. Translate text between languages accurately.",
    model: "gpt-4",
    tools: [
      functionTool(
        async (args: { text: string; targetLanguage: string }, context: ChatSessionContext) => {
          // This would normally call a translation API
          return {
            originalText: args.text,
            translatedText: `[Translated: ${args.text} to ${args.targetLanguage}]`,
            targetLanguage: args.targetLanguage
          };
        },
        {
          name: "translate_text",
          description: "Translate text to the target language",
          parameters: {
            text: {
              type: "string",
              description: "The text to translate"
            },
            targetLanguage: {
              type: "string",
              description: "The target language for translation"
            }
          }
        }
      )
    ]
  });
  
  // Create a specialized summarization agent
  const summarizationAgent = new Agent({
    name: "SummarizationAgent",
    instructions: "You are a summarization assistant. Create concise summaries of text.",
    model: "gpt-4",
    tools: [
      functionTool(
        async (args: { text: string; maxLength?: number }, context: ChatSessionContext) => {
          // This would normally use an AI model to summarize
          return {
            originalText: args.text,
            summary: `[Summary of: ${args.text.substring(0, 20)}...]`,
            length: args.maxLength || "short"
          };
        },
        {
          name: "summarize_text",
          description: "Summarize text to a concise version",
          parameters: {
            text: {
              type: "string",
              description: "The text to summarize"
            },
            maxLength: {
              type: "number",
              description: "Maximum length of the summary"
            }
          }
        }
      )
    ]
  });
  
  // Create a specialized formatting agent
  const formattingAgent = new Agent({
    name: "FormattingAgent",
    instructions: "You are a formatting assistant. Format text in a structured way.",
    model: "gpt-4",
    tools: [
      functionTool(
        async (args: { text: string; format: string }, context: ChatSessionContext) => {
          // This would normally format the text according to the specified format
          return {
            originalText: args.text,
            formattedText: `[${args.format.toUpperCase()} FORMAT: ${args.text}]`,
            format: args.format
          };
        },
        {
          name: "format_text",
          description: "Format text according to the specified format",
          parameters: {
            text: {
              type: "string",
              description: "The text to format"
            },
            format: {
              type: "string",
              description: "The format to apply (e.g., 'markdown', 'html', 'json')"
            }
          }
        }
      )
    ]
  });
  
  // Create a context for the workflow
  const context: ChatSessionContext = {
    chatId: "workflow-example-123",
    userId: "user-123",
    organisationId: "org-123"
  };
  
  // Execute the workflow
  const result = await executeAgentWorkflow(
    [translationAgent, summarizationAgent, formattingAgent],
    "This is a long text that needs to be translated to French, summarized, and formatted as markdown.",
    context,
    {
      workflowName: "translate-summarize-format",
      passThroughOutput: true,
      onAgentStart: (agent, input) => {
        console.log(`Starting agent: ${agent.name} with input: ${typeof input === 'string' ? input.substring(0, 30) + '...' : 'complex input'}`);
      },
      onAgentEnd: (agent, result) => {
        console.log(`Agent ${agent.name} completed with output: ${JSON.stringify(result.output).substring(0, 50)}...`);
      }
    }
  );
  
  console.log("Workflow completed with final result:", result.output);
  
  return result;
} 