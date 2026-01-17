/**
 * ============================================================
 * 📄 FILE: app/api/chat/route.ts
 * 
 * 🎯 PURPOSE:
 *    Next.js API route for chat endpoint.
 *    Handles chat messages and returns LLM responses.
 * 
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/src/init';
import { chatWithBot } from '@/src/services/llm';
import { updateUserVector } from '@/src/services/vectorStore';

export async function POST(request: NextRequest) {
  await ensureInitialized();
  try {
    const body = await request.json();
    const { userId, message, history } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message required' },
        { status: 400 }
      );
    }

    // Get response from LLM with structured profile extraction (with RAG)
    const response = await chatWithBot(message, history || [], userId);

    // Update user's vector in the store if profile changed
    if (response.profileUpdate) {
      await updateUserVector(userId, response.profileUpdate);
    }

    return NextResponse.json({
      assistantMessage: response.assistantMessage,
      profileUpdate: response.profileUpdate
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
