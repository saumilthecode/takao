/**
 * ============================================================
 * 📄 FILE: backend/src/services/llm.ts
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Handles all OpenAI API interactions for the chatbot.
 *    Uses structured output to extract personality traits from chat.
 *    The LLM is just a "friendly UI" - it doesn't decide matches.
 * 
 * 🛠️ TECH USED:
 *    - OpenAI SDK v4 (official Node.js client)
 *    - GPT-4 with JSON mode for structured extraction
 *    - System prompt engineering for consistent output
 * 
 * 📤 EXPORTS:
 *    - chatWithBot() → sends message, returns response + profile update
 * 
 * ⚠️ REQUIRES:
 *    - openaikey or OPENAI_API_KEY in .env file
 * 
 * ============================================================
 */

import OpenAI from 'openai';
import { getKNearestNeighbors } from './vectorStore';
import { getUserById, getAllUsers } from '../data/seedUsers';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.openaikey || process.env.OPENAI_API_KEY || ''
});

// Type definitions
export interface ProfileUpdate {
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  interests: Record<string, number>;
  confidence: number;
}

export interface ChatResponse {
  assistantMessage: string;
  profileUpdate: ProfileUpdate;
}

// Base system prompt for the onboarding chatbot
const BASE_SYSTEM_PROMPT = `You are an onboarding buddy for a friend-making app for university students (age 18–26).
Your job is to have a friendly 5–10 minute conversation that helps the user express preferences and personality.
You must NOT decide who the user should be matched with.
You must only:
(1) respond conversationally, and
(2) extract a structured profile update from the user's messages.

Important rules:
- No romance or dating framing.
- Do not mention embeddings, vectors, clustering, or any internal algorithms.
- Ask short, natural questions (1–2 at a time).
- Avoid sensitive personal data (exact address, finances, medical, etc).
- Keep it like a friendly peer chat.

After every message, output a JSON object ONLY (no extra text) in this exact schema:

{
  "assistantMessage": string,
  "profileUpdate": {
    "traits": {
      "openness": number, 
      "conscientiousness": number,
      "extraversion": number,
      "agreeableness": number,
      "neuroticism": number
    },
    "interests": { "<tag>": number },
    "confidence": number
  }
}

Constraints:
- trait values must be in [0,1]
- interest weights must be in [0,1]
- confidence must be in [0,1]
- If unsure, keep profileUpdate small and confidence low.
- Each turn should adjust values slightly, not jump wildly.

Goal:
Help the user naturally reveal what they enjoy doing, how they like to meet people, and what kind of group dynamic they prefer.`;

/**
 * Retrieve similar users for RAG context
 */
async function getSimilarUsersContext(userId: string, k: number = 3): Promise<string> {
  try {
    const user = getUserById(userId);
    if (!user) {
      // New user, return examples from all users
      const allUsers = getAllUsers();
      const examples = allUsers.slice(0, k).map(u => ({
        name: u.name,
        age: u.age,
        uni: u.uni,
        interests: u.interests.slice(0, 5).join(', ')
      }));
      
      return `Here are examples of user profiles in the community:
${examples.map((ex, i) => `${i + 1}. ${ex.name} (${ex.age}, ${ex.uni}) - Interests: ${ex.interests}`).join('\n')}`;
    }

    // Retrieve similar users
    try {
      const neighbors = await getKNearestNeighbors(userId, k);
      const similarUsers = neighbors
        .map(n => getUserById(n.id))
        .filter((u): u is NonNullable<typeof u> => u !== undefined)
        .slice(0, k)
        .map(u => ({
          name: u.name,
          age: u.age,
          uni: u.uni,
          interests: u.interests.slice(0, 5).join(', '),
          similarity: neighbors.find(n => n.id === u.id)?.similarity || 0
        }));

      if (similarUsers.length === 0) {
        // Fallback to examples
        const allUsers = getAllUsers();
        const examples = allUsers.slice(0, k).map(u => ({
          name: u.name,
          age: u.age,
          uni: u.uni,
          interests: u.interests.slice(0, 5).join(', ')
        }));
        
        return `Here are examples of user profiles in the community:
${examples.map((ex, i) => `${i + 1}. ${ex.name} (${ex.age}, ${ex.uni}) - Interests: ${ex.interests}`).join('\n')}`;
      }

      return `Here are similar users in the community that share interests/traits:
${similarUsers.map((u, i) => `${i + 1}. ${u.name} (${u.age}, ${u.uni}) - Interests: ${u.interests}`).join('\n')}

Use these as context to understand what kinds of people exist in the community, but don't mention specific names to the user.`;
    } catch (neighborError) {
      // User might not be in vector index yet, fallback to examples
      const allUsers = getAllUsers();
      const examples = allUsers.slice(0, k).map(u => ({
        name: u.name,
        age: u.age,
        uni: u.uni,
        interests: u.interests.slice(0, 5).join(', ')
      }));
      
      return `Here are examples of user profiles in the community:
${examples.map((ex, i) => `${i + 1}. ${ex.name} (${ex.age}, ${ex.uni}) - Interests: ${ex.interests}`).join('\n')}`;
    }
  } catch (error) {
    console.error('Error retrieving similar users:', error);
    // Final fallback: return empty string if everything fails
    return '';
  }
}

/**
 * Send a message to the chatbot and get structured response (with RAG)
 */
export async function chatWithBot(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userId?: string
): Promise<ChatResponse> {
  
  // Retrieve similar users for RAG context
  let ragContext = '';
  if (userId) {
    ragContext = await getSimilarUsersContext(userId, 3);
  }

  // Build system prompt with RAG context
  const systemPrompt = ragContext 
    ? `${BASE_SYSTEM_PROMPT}\n\n## Community Context (for your reference only)\n${ragContext}\n\nRemember: Don't mention specific user names, but use this context to understand what interests and personalities exist in the community.`
    : BASE_SYSTEM_PROMPT;

  // Build messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content
    })),
    { role: 'user', content: userMessage }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const parsed = JSON.parse(content) as ChatResponse;
    
    // Validate and clamp values
    if (parsed.profileUpdate?.traits) {
      const traits = parsed.profileUpdate.traits;
      traits.openness = clamp(traits.openness, 0, 1);
      traits.conscientiousness = clamp(traits.conscientiousness, 0, 1);
      traits.extraversion = clamp(traits.extraversion, 0, 1);
      traits.agreeableness = clamp(traits.agreeableness, 0, 1);
      traits.neuroticism = clamp(traits.neuroticism, 0, 1);
    }

    if (parsed.profileUpdate) {
      parsed.profileUpdate.confidence = clamp(parsed.profileUpdate.confidence, 0, 1);
    }

    return parsed;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return fallback response
    return {
      assistantMessage: "I'd love to hear more about that! What else do you enjoy doing?",
      profileUpdate: {
        traits: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 },
        interests: {},
        confidence: 0.1
      }
    };
  }
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
