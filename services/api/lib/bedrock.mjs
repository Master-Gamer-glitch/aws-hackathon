import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({});

export async function invokeModel(prompt, maxTokens = 2048) {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-opus-5-sonnet-20241022',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-06-01',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  const response = await bedrock.send(command);
  const text = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(text);
  return parsed.content[0].text;
}

export async function invokeBedrockAgent(agent, task) {
  // Placeholder - will use Bedrock Agents API
  // For now, return mock results for tester
  if (agent === 'tester') {
    return {
      passed: Math.random() > 0.3, // 70% pass rate for demo
      criteria: task.inputs?.[0]?.criteria || []
    };
  }

  // For real agents, use InvokeModel with agent prompts
  // This is a stub; real implementation will call actual Bedrock agents
  return {};
}

export default {
  invokeModel,
  invokeBedrockAgent
};
