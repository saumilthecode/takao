/**
 * ============================================================
 * 📄 FILE: backend/src/routes/chat.ts
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Handles the chat endpoint for user onboarding.
 *    Sends user message to OpenAI, extracts structured profile updates.
 * 
 * 🛠️ TECH USED:
 *    - Fastify (route registration)
 *    - OpenAI SDK (GPT-4 API calls)
 *    - Structured output (JSON profile extraction)
 * 
 * 📥 INPUT:
 *    POST /chat { userId: string, message: string, history: Message[] }
 * 
 * 📤 OUTPUT:
 *    { assistantMessage: string, profileUpdate: ProfileUpdate }
 * 
 * ============================================================
 */

import { FastifyInstance } from 'fastify';
import { chatWithBot } from '../services/llm.js';
import { updateUserVector } from '../services/vectorStore.js';

interface ChatRequest {
  userId: string;
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
}

export async function chatRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /chat
   * Send a message to the onboarding chatbot
   */
  fastify.post('/', async (request, reply) => {
    const { userId, message, history } = request.body as ChatRequest;

    if (!userId || !message) {
      return reply.status(400).send({ error: 'userId and message required' });
    }

    try {
      // Get response from LLM with structured profile extraction
      const response = await chatWithBot(message, history);

      // Update user's vector in the store if profile changed
      if (response.profileUpdate) {
        await updateUserVector(userId, response.profileUpdate);
      }

      return {
        assistantMessage: response.assistantMessage,
        profileUpdate: response.profileUpdate
      };
    } catch (error) {
      console.error('Chat error:', error);
      return reply.status(500).send({ error: 'Failed to process chat' });
    }
  });

  /**
   * POST /chat/simulate
   * Simulate a full conversation for demo purposes
   */
  fastify.post('/simulate', async (request, reply) => {
    const { userId } = request.body as { userId: string };
    
    // Return pre-scripted demo conversation
    const demoConversation = [
      { role: 'assistant', content: "Hey! I'm here to help you find your people on campus. What do you usually do when you have free time?" },
      { role: 'user', content: "I like reading, mostly sci-fi and tech blogs. Sometimes I go to hackathons." },
      { role: 'assistant', content: "Nice! A fellow techie. Do you prefer working on projects solo or jamming with others?" },
      { role: 'user', content: "I like small groups, like 2-3 people max. Big crowds drain me." },
      { role: 'assistant', content: "Totally get that. When you hang out with friends, what's your ideal vibe - chill at home, explore new cafes, or something active?" },
      { role: 'user', content: "Chill vibes for sure. Coffee shop study sessions are my thing." }
    ];

    return { conversation: demoConversation, userId };
  });
}
