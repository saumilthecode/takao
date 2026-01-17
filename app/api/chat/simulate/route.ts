/**
 * ============================================================
 * 📄 FILE: app/api/chat/simulate/route.ts
 * 
 * 🎯 PURPOSE:
 *    Simulates a demo conversation for testing purposes.
 * 
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    // Return pre-scripted demo conversation
    const demoConversation = [
      { role: 'assistant' as const, content: "Hey, I'm here to help you find your people on campus. What do you usually do when you have free time?" },
      { role: 'user' as const, content: "I like reading, mostly sci-fi and tech blogs. Sometimes I go to hackathons." },
      { role: 'assistant' as const, content: "Nice. Do you prefer working on projects solo or jamming with others?" },
      { role: 'user' as const, content: "I like small groups, like 2-3 people max. Big crowds drain me." },
      { role: 'assistant' as const, content: "That makes sense. When you hang out with friends, what's your ideal vibe - chill at home, explore new cafes, or something active?" },
      { role: 'user' as const, content: "Chill vibes for sure. Coffee shop study sessions are my thing." }
    ];

    return NextResponse.json({ conversation: demoConversation, userId });
  } catch (error) {
    console.error('Simulate chat error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate chat' },
      { status: 500 }
    );
  }
}
