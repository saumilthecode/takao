/**
 * ============================================================
 * 📄 FILE: app/api/graph/match/[id1]/[id2]/route.ts
 * 
 * 🎯 PURPOSE:
 *    Next.js API route for match explanation.
 *    Returns detailed match analysis between two users.
 * 
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/src/init';
import { getAllUsers } from '@/src/data/seedUsers';
import { cosineSimilarity } from '@/src/services/vectorStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id1: string; id2: string } }
) {
  await ensureInitialized();
  try {
    const { id1, id2 } = params;
    
    const users = getAllUsers();
    const user1 = users.find(u => u.id === id1);
    const user2 = users.find(u => u.id === id2);

    if (!user1 || !user2) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate overall similarity
    const similarity = cosineSimilarity(user1.vector, user2.vector);

    // Calculate contribution of each dimension
    const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const contributions = dimensions.map((dim, idx) => {
      const diff = Math.abs(user1.vector[idx] - user2.vector[idx]);
      const contribution = (1 - diff) * user1.vector[idx] * user2.vector[idx];
      return { dimension: dim, contribution: parseFloat(contribution.toFixed(3)) };
    }).sort((a, b) => b.contribution - a.contribution);

    // Find shared interests
    const sharedInterests = user1.interests.filter(i => user2.interests.includes(i));

    return NextResponse.json({
      user1: { id: user1.id, name: user1.name },
      user2: { id: user2.id, name: user2.name },
      similarity: parseFloat(similarity.toFixed(3)),
      topContributors: contributions.slice(0, 3),
      sharedInterests
    });
  } catch (error) {
    console.error('Match explanation error:', error);
    return NextResponse.json(
      { error: 'Failed to compute match explanation' },
      { status: 500 }
    );
  }
}
