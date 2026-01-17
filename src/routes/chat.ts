<<<<<<< HEAD
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
 *    { assistantMessages: string[], profileUpdate: ProfileUpdate }
 * 
 * ============================================================
 */

import { FastifyInstance } from 'fastify';
import { chatWithBot } from '../services/llm.js';
import { buildProfileUpdateFromSignals, updateUserVector } from '../services/vectorStore.js';

const ALLOWED_TOPICS = [
  'spontaneity',
  'planning',
  'social_energy',
  'study_style',
  'weekend_style',
  'comfort_zone',
  'group_dynamic',
  'conversation_depth',
  'curiosity',
  'nature_vs_city'
];

type SessionState = {
  asked_topics: string[];
  collected_signals: string[];
  stage: 'warmup' | 'preferences' | 'group-fit' | 'wrapup';
  turn_count: number;
};

const sessionStore = new Map<string, SessionState>();
const FIXED_ITINERARY = {
  wednesday_study: {
    theme: 'Focused study pod',
    location_hint: 'Tutorial Room 79, NUS RC',
    plan: ['Arrive by 4pm', 'Study sprints + quick intros', 'Wrap at 7pm']
  },
  friday_social: {
    theme: 'Optional casual hang',
    location_hint: 'Near campus',
    plan: ['Light food or drinks', 'Low-pressure chat', 'Head out by 9pm'],
    optional: true as const
  }
};

function getSessionState(userId: string): SessionState {
  const existing = sessionStore.get(userId);
  if (existing) return existing;
  const initial: SessionState = {
    asked_topics: [],
    collected_signals: [],
    stage: 'warmup',
    turn_count: 0
  };
  sessionStore.set(userId, initial);
  return initial;
}

function updateStage(turnCount: number, done: boolean): SessionState['stage'] {
  if (done || turnCount >= 10) return 'wrapup';
  if (turnCount >= 6) return 'group-fit';
  if (turnCount >= 3) return 'preferences';
  return 'warmup';
}

function sanitizeNextTopic(nextTopic: string, state: SessionState): string {
  const normalized = nextTopic?.trim().toLowerCase();
  if (normalized && ALLOWED_TOPICS.includes(normalized) && !state.asked_topics.includes(normalized)) {
    return normalized;
  }
  return ALLOWED_TOPICS.find(topic => !state.asked_topics.includes(topic)) || '';
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBigrams(text: string): string[] {
  const normalized = normalizeText(text);
  const tokens = normalized.split(' ').filter(Boolean);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

function isRepeatQuestion(candidate: string, recentQuestions: string[]): boolean {
  const candidateBigrams = new Set(getBigrams(candidate));
  if (candidateBigrams.size === 0) return false;
  return recentQuestions.some(question => {
    const questionBigrams = new Set(getBigrams(question));
    const intersection = [...candidateBigrams].filter(bigram => questionBigrams.has(bigram));
    const overlap = intersection.length / Math.max(candidateBigrams.size, 1);
    return overlap >= 0.5;
  });
}

function getRecentAssistantQuestions(
  history: { role: 'user' | 'assistant'; content: string }[]
): string[] {
  const questions = history
    .filter(msg => msg.role === 'assistant' && msg.content.includes('?'))
    .map(msg => msg.content)
    .slice(-3);
  return questions;
}

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
      const sessionState = getSessionState(userId);
      const sessionContext = {
        asked_topics: sessionState.asked_topics,
        collected_signals: sessionState.collected_signals,
        stage: sessionState.stage,
        turn_count: sessionState.turn_count,
        allowed_topics: ALLOWED_TOPICS
      };

      const response = await chatWithBot(message, history, userId, sessionContext);
      const recentQuestions = getRecentAssistantQuestions(history);
      let finalResponse = response;

      const candidateQuestion = finalResponse.assistantMessages.find(msg => msg.includes('?')) || '';
      if (candidateQuestion && isRepeatQuestion(candidateQuestion, recentQuestions)) {
        finalResponse = await chatWithBot(
          message,
          history,
          userId,
          sessionContext,
          'You repeated yourself. Ask a different question about a different topic.'
        );
      }

      const shouldBeDone = finalResponse.confidence >= 0.75 || sessionState.turn_count >= 10;
      if (shouldBeDone && !finalResponse.itinerary) {
        finalResponse = await chatWithBot(
          message,
          history,
          userId,
          sessionContext,
          'You must set done=true and include itinerary. Stop asking questions.'
        );
      }

      if (shouldBeDone) {
        finalResponse.itinerary = FIXED_ITINERARY;
        finalResponse.done = true;
      }

      const nextTopic = sanitizeNextTopic(finalResponse.nextTopic, sessionState);
      if (nextTopic) {
        sessionState.asked_topics = [...sessionState.asked_topics, nextTopic].slice(-15);
      }

      if (finalResponse.confidence >= 0.6) {
        const newSignals = Object.keys(finalResponse.signals || {});
        const collected = new Set(sessionState.collected_signals);
        newSignals.forEach(signal => collected.add(signal));
        sessionState.collected_signals = Array.from(collected).slice(-15);
      }

      sessionState.turn_count += 1;
      sessionState.stage = updateStage(sessionState.turn_count, finalResponse.done);

      const profileUpdate = buildProfileUpdateFromSignals(
        userId,
        finalResponse.signals,
        finalResponse.confidence
      );

      // Update user's vector in the store if profile changed
      await updateUserVector(userId, profileUpdate, message);

      return {
        assistantMessages: finalResponse.assistantMessages,
        nextTopic,
        profileUpdate,
        signals: finalResponse.signals,
        confidence: finalResponse.confidence,
        done: finalResponse.done || shouldBeDone,
        itinerary: finalResponse.itinerary || null
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
      { role: 'assistant', content: "Hey, so we are gonna have a conversation and you are gonna give me like answers, whatever you're feeling in the moment, don't overthink it!" },
      { role: 'user', content: "I like reading, mostly sci-fi and tech blogs. Sometimes I go to hackathons." },
      { role: 'assistant', content: "Nice. Do you prefer working on projects solo or jamming with others?" },
      { role: 'user', content: "I like small groups, like 2-3 people max. Big crowds drain me." },
      { role: 'assistant', content: "That makes sense. When you hang out with friends, what's your ideal vibe—chill at home, explore new cafes, or something active?" },
      { role: 'user', content: "Chill vibes for sure. Coffee shop study sessions are my thing." }
    ];

    return { conversation: demoConversation, userId };
  });
}

/**
 * ============================================================
 * 📄 FILE FOOTER: backend/src/routes/chat.ts
 * ============================================================
 * PURPOSE:
 *    Fastify routes for chat and demo simulation.
 * TECH USED:
 *    - Fastify
 *    - TypeScript
 *    - LLM service + vector store
 * ============================================================
 */
=======
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
 *    { assistantMessages: string[], profileUpdate: ProfileUpdate }
 * 
 * ============================================================
 */

import { FastifyInstance } from 'fastify';
import { chatWithBot } from '../services/llm.js';
import { buildProfileUpdateFromSignals, updateUserVector } from '../services/vectorStore.js';

const ALLOWED_TOPICS = [
  'spontaneity',
  'planning',
  'social_energy',
  'study_style',
  'weekend_style',
  'comfort_zone',
  'group_dynamic',
  'conversation_depth',
  'curiosity',
  'nature_vs_city'
];

type SessionState = {
  asked_topics: string[];
  collected_signals: string[];
  stage: 'warmup' | 'preferences' | 'group-fit' | 'wrapup';
  turn_count: number;
};

const sessionStore = new Map<string, SessionState>();
const FIXED_ITINERARY = {
  wednesday_study: {
    theme: 'Focused study pod',
    location_hint: 'Tutorial Room 79, NUS RC',
    plan: ['Arrive by 4pm', 'Study sprints + quick intros', 'Wrap at 7pm']
  },
  friday_social: {
    theme: 'Optional casual hang',
    location_hint: 'Near campus',
    plan: ['Light food or drinks', 'Low-pressure chat', 'Head out by 9pm'],
    optional: true as const
  }
};

function getSessionState(userId: string): SessionState {
  const existing = sessionStore.get(userId);
  if (existing) return existing;
  const initial: SessionState = {
    asked_topics: [],
    collected_signals: [],
    stage: 'warmup',
    turn_count: 0
  };
  sessionStore.set(userId, initial);
  return initial;
}

function updateStage(turnCount: number, done: boolean): SessionState['stage'] {
  if (done || turnCount >= 10) return 'wrapup';
  if (turnCount >= 6) return 'group-fit';
  if (turnCount >= 3) return 'preferences';
  return 'warmup';
}

function sanitizeNextTopic(nextTopic: string, state: SessionState): string {
  const normalized = nextTopic?.trim().toLowerCase();
  if (normalized && ALLOWED_TOPICS.includes(normalized) && !state.asked_topics.includes(normalized)) {
    return normalized;
  }
  return ALLOWED_TOPICS.find(topic => !state.asked_topics.includes(topic)) || '';
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBigrams(text: string): string[] {
  const normalized = normalizeText(text);
  const tokens = normalized.split(' ').filter(Boolean);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

function isRepeatQuestion(candidate: string, recentQuestions: string[]): boolean {
  const candidateBigrams = new Set(getBigrams(candidate));
  if (candidateBigrams.size === 0) return false;
  return recentQuestions.some(question => {
    const questionBigrams = new Set(getBigrams(question));
    let intersectionCount = 0;
    candidateBigrams.forEach(bigram => {
      if (questionBigrams.has(bigram)) intersectionCount += 1;
    });
    const overlap = intersectionCount / Math.max(candidateBigrams.size, 1);
    return overlap >= 0.5;
  });
}

function getRecentAssistantQuestions(
  history: { role: 'user' | 'assistant'; content: string }[]
): string[] {
  const questions = history
    .filter(msg => msg.role === 'assistant' && msg.content.includes('?'))
    .map(msg => msg.content)
    .slice(-3);
  return questions;
}

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
      const sessionState = getSessionState(userId);
      const sessionContext = {
        asked_topics: sessionState.asked_topics,
        collected_signals: sessionState.collected_signals,
        stage: sessionState.stage,
        turn_count: sessionState.turn_count,
        allowed_topics: ALLOWED_TOPICS
      };

      const response = await chatWithBot(message, history, userId, sessionContext);
      const recentQuestions = getRecentAssistantQuestions(history);
      let finalResponse = response;

      const candidateQuestion = finalResponse.assistantMessages.find(msg => msg.includes('?')) || '';
      if (candidateQuestion && isRepeatQuestion(candidateQuestion, recentQuestions)) {
        finalResponse = await chatWithBot(
          message,
          history,
          userId,
          sessionContext,
          'You repeated yourself. Ask a different question about a different topic.'
        );
      }

      const shouldBeDone = finalResponse.confidence >= 0.75 || sessionState.turn_count >= 10;
      if (shouldBeDone && !finalResponse.itinerary) {
        finalResponse = await chatWithBot(
          message,
          history,
          userId,
          sessionContext,
          'You must set done=true and include itinerary. Stop asking questions.'
        );
      }

      if (shouldBeDone) {
        finalResponse.itinerary = FIXED_ITINERARY;
        finalResponse.done = true;
      }

      const nextTopic = sanitizeNextTopic(finalResponse.nextTopic, sessionState);
      if (nextTopic) {
        sessionState.asked_topics = [...sessionState.asked_topics, nextTopic].slice(-15);
      }

      if (finalResponse.confidence >= 0.6) {
        const newSignals = Object.keys(finalResponse.signals || {});
        const collected = new Set(sessionState.collected_signals);
        newSignals.forEach(signal => collected.add(signal));
        sessionState.collected_signals = Array.from(collected).slice(-15);
      }

      sessionState.turn_count += 1;
      sessionState.stage = updateStage(sessionState.turn_count, finalResponse.done);

      const profileUpdate = buildProfileUpdateFromSignals(
        userId,
        finalResponse.signals,
        finalResponse.confidence
      );

      // Update user's vector in the store if profile changed
      await updateUserVector(userId, profileUpdate);

      return {
        assistantMessages: finalResponse.assistantMessages,
        nextTopic,
        profileUpdate,
        signals: finalResponse.signals,
        confidence: finalResponse.confidence,
        done: finalResponse.done || shouldBeDone,
        itinerary: finalResponse.itinerary || null
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
      { role: 'assistant', content: "Hey, so we are gonna have a conversation and you are gonna give me like answers, whatever you're feeling in the moment, don't overthink it!" },
      { role: 'user', content: "I like reading, mostly sci-fi and tech blogs. Sometimes I go to hackathons." },
      { role: 'assistant', content: "Nice. Do you prefer working on projects solo or jamming with others?" },
      { role: 'user', content: "I like small groups, like 2-3 people max. Big crowds drain me." },
      { role: 'assistant', content: "That makes sense. When you hang out with friends, what's your ideal vibe—chill at home, explore new cafes, or something active?" },
      { role: 'user', content: "Chill vibes for sure. Coffee shop study sessions are my thing." }
    ];

    return { conversation: demoConversation, userId };
  });
}

/**
 * ============================================================
 * 📄 FILE FOOTER: backend/src/routes/chat.ts
 * ============================================================
 * PURPOSE:
 *    Fastify routes for chat and demo simulation.
 * TECH USED:
 *    - Fastify
 *    - TypeScript
 *    - LLM service + vector store
 * ============================================================
 */
>>>>>>> 9fd1765ca084fd8b73ffacd5fd6b3899918f90bd
