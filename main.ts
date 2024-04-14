import OpenAI from 'openai';
import { config } from './config.js';
import { ChatCompletion } from 'openai/resources';

const API_KEY = 'API_KEY';

interface Message {
  role: string;
  content: string;
  tool_call_id?: string | null;
  name?: string | null;
}

interface Completion {
  Content: string | null;
  Error?: string | undefined;
  TokenUsage: number | undefined;
  ToolCalls?: any; // Add this line to include tool calls
}

interface ConnectorResponse {
  Completions: Completion[];
  ModelType: string;
}

interface ErrorCompletion {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error: string;
  model: string;
  usage: undefined;
}

const mapToResponse = (
  outputs: Array<ChatCompletion | ErrorCompletion>,
  model: string,
): ConnectorResponse => {
  return {
    Completions: outputs.map((output) => {
      if ('error' in output) {
        return {
          Content: null,
          TokenUsage: undefined,
          Error: output.error,
        };
      } else {
        return {
          Content: output.choices[0]?.message?.content,
          TokenUsage: output.usage?.total_tokens,
        };
      }
    }),
    ModelType: outputs[0].model || model,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapErrorToCompletion = (error: any, model: string): ErrorCompletion => {
  const errorMessage = error.message || JSON.stringify(error);
  return {
    choices: [],
    error: errorMessage,
    model,
    usage: undefined,
  };
};

// Test function to query data from the database
async function testDatabaseQuery(query: string) {
  try {
    // Generate fake data for 5 customers
    console.log('Executing database query:', query);
    const fakeCustomers = [];
    for (let i = 0; i < 5; i++) {
      const customer = {
        id: i + 1,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        address: `Address ${i + 1}`,
      };
      fakeCustomers.push(customer);
    }
    return fakeCustomers;
  } catch (error) {
    console.error('Database query failed:', error);
    throw error; // Rethrow the error after logging
  }
}

async function main(
  model: string,
  prompts: string[],
  properties: Record<string, unknown>,
  settings: Record<string, unknown>,
) {
  const openai = new OpenAI({
    apiKey: settings?.[API_KEY] as string,
  });

  const total = prompts.length;
  const { prompt, ...restProperties } = properties;
  const systemPrompt = (prompt ||
    config.properties.find((prop) => prop.id === 'prompt')?.value) as string;
  const messageHistory: Message[] = [{ role: 'system', content: systemPrompt }];
  const outputs: Array<ChatCompletion | ErrorCompletion> = [];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'testDatabaseQuery',
        description: 'Execute a database query',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The SQL query to execute',
            },
          },
          required: ['query'],
        },
      },
    },
  ];

  try {
    for (let index = 0; index < total; index++) {
      try {
        messageHistory.push({ role: 'user', content: prompts[index] });
        const chatCompletion = await openai.chat.completions.create({
          messages: messageHistory as unknown as [],
          model,
          tools: tools.map(tool => ({ type: "function", function: tool.function })),
          tool_choice: "auto",
          ...restProperties,
        });
        outputs.push(chatCompletion);

        // Check if the assistant's response contains a tool call
        const toolCalls = chatCompletion.choices[0].message.tool_calls;
        if (toolCalls) {
          for (const toolCall of toolCalls) {
            if (toolCall.function.name === 'testDatabaseQuery') {
              const functionArgs = JSON.parse(toolCall.function.arguments);
              const functionResponse = await testDatabaseQuery(functionArgs.query);
              messageHistory.push({
                tool_call_id: toolCall.id,
                role: 'function',
                name: 'testDatabaseQuery',
                content: JSON.stringify(functionResponse),
              });
            }
          }
          const secondResponse = await openai.chat.completions.create({
            model: model,
            messages: messageHistory as unknown as [],
            ...restProperties,
          });
          const secondAssistantResponse = secondResponse.choices[0].message.content || 'No response.';
          messageHistory.push({ role: 'assistant', content: secondAssistantResponse });
        } else {
          const assistantResponse =
            chatCompletion.choices[0].message.content || 'No response.';
          messageHistory.push({ role: 'assistant', content: assistantResponse });
        }

      } catch (error) {
        console.error('Error in main loop:', error);
        const completionWithError = mapErrorToCompletion(error, model);
        outputs.push(completionWithError);
      }
    }
    console.log(messageHistory)
    console.log("Outputs:")
    console.log(outputs)
    return mapToResponse(outputs, model);
  } catch (error) {
    console.error('Error in main function:', error);
    return { Error: error, ModelType: model };
  }
}

export { main, config };