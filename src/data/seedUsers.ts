/**
 * ============================================================
 * 📄 FILE: backend/src/data/seedUsers.ts
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Generates fake users for the demo.
 *    Each user has Big-5 personality traits + interests.
 *    The 5D vector is what powers all matching/clustering.
 * 
 * 🛠️ TECH USED:
 *    - Pure TypeScript (no external libs needed)
 *    - Random generation with controlled distributions
 * 
 * 📤 EXPORTS:
 *    - initializeUsers() → generates users on startup
 *    - getAllUsers() → returns all generated users
 *    - getUserById() → finds user by ID
 * 
 * ============================================================
 */

export interface User {
  id: string;
  name: string;
  age: number;
  uni: string;
  vector: number[];  // 5D: [O, C, E, A, N] Big-5 traits
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  interests: string[];
  confidence: number;  // How much data we have on this user
}

// In-memory user storage
let users: User[] = [];

// Sample data for generation
const FIRST_NAMES = [
  'Alyssa', 'Marcus', 'Priya', 'Chen', 'Sofia', 'James', 'Fatima', 'Lucas',
  'Yuki', 'Omar', 'Emma', 'Raj', 'Zara', 'Daniel', 'Mei', 'Alexander',
  'Nina', 'Ethan', 'Ava', 'Kai', 'Isabella', 'Noah', 'Chloe', 'Liam',
  'Aria', 'Samuel', 'Luna', 'Benjamin', 'Olivia', 'Leo', 'Mia', 'Jack',
  'Amara', 'Ryan', 'Lily', 'Aaron', 'Grace', 'Dylan', 'Hannah', 'Cole'
];

const LAST_NAMES = [
  'Tan', 'Lim', 'Ng', 'Wong', 'Lee', 'Goh', 'Ong', 'Teo', 'Chua', 'Chong',
  'Koh', 'Yeo', 'Ho', 'Loh', 'Neo', 'Seah', 'Toh', 'Quek', 'Low', 'Ang',
  'Chew', 'Kwan', 'Lau', 'Phua', 'Sim', 'Foo', 'Heng', 'Peh', 'Yap', 'Soh'
];

const UNIVERSITIES = [
  'NUS', 'NTU', 'SMU', 'SUTD', 'SIT', 'SUSS', 'LASALLE', 'NAFA'
];

const INTERESTS = [
  'machine learning', 'web dev', 'mobile apps', 'game dev', 'cybersecurity',
  'blockchain', 'robotics', 'data science', 'cloud computing', 'devops',
  'reading', 'hiking', 'photography', 'cooking', 'music', 'gaming',
  'fitness', 'travel', 'art', 'writing', 'podcasts', 'movies',
  'startups', 'investing', 'philosophy', 'psychology', 'languages',
  'volunteering', 'hackathons', 'open source', 'research', 'teaching',
  'hawker food', 'cafe hopping', 'makan adventures', 'board games',
  'badminton', 'basketball', 'futsal', 'running', 'cycling',
  'mahjong', 'karaoke', 'k-pop', 'anime', 'photowalks',
  'design', 'product management', 'fintech', 'sustainability'
];

/**
 * Generate a random number between min and max.
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Rough normal-ish distribution using Box-Muller.
 */
function randomNormal(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Pick random items from an array
 */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate a single fake user
 */
function generateUser(index: number): User {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  
  // Generate Big-5 traits (normalized 0-1) with mild correlations + noise
  const openness = clamp(randomNormal(0.58, 0.18), 0.05, 0.98);
  const conscientiousness = clamp(randomNormal(0.55, 0.17), 0.05, 0.97);
  const extraversion = clamp(randomNormal(0.48, 0.22), 0.02, 0.98);
  const agreeableness = clamp(randomNormal(0.6, 0.16), 0.08, 0.98);
  const neuroticismBase = 0.55 - conscientiousness * 0.25 + (0.5 - extraversion) * 0.15;
  const neuroticism = clamp(randomNormal(neuroticismBase, 0.18), 0.02, 0.95);

  const traits = {
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism
  };

  // Vector is just the traits as array
  const vector = [
    traits.openness,
    traits.conscientiousness,
    traits.extraversion,
    traits.agreeableness,
    traits.neuroticism
  ];

  const age = Math.floor(clamp(randomNormal(21.2, 1.8), 18, 26));
  const confidence = clamp(randomNormal(0.72, 0.15), 0.3, 0.98);

  // Interests: smaller, noisier set for realism, with occasional sparse profiles
  const interestCount = Math.random() < 0.15
    ? Math.floor(randomBetween(1, 3))
    : Math.floor(randomBetween(3, 7));

  let interests = pickRandom(INTERESTS, interestCount);

  // Add a small chance of "messy" or niche interest combos
  if (Math.random() < 0.2) {
    interests = pickRandom(INTERESTS, Math.floor(randomBetween(2, 5)));
  }

  return {
    id: `user_${index.toString().padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    age,
    uni: UNIVERSITIES[Math.floor(Math.random() * UNIVERSITIES.length)],
    vector,
    traits,
    interests,
    confidence
  };
}

/**
 * Initialize users array with fake data
 */
export async function initializeUsers(): Promise<void> {
  const count = parseInt(process.env.SEED_USER_COUNT || '100');
  users = [];
  
  for (let i = 0; i < count; i++) {
    users.push(generateUser(i));
  }

  console.log(`✅ Generated ${users.length} fake users`);
}

/**
 * Get all users
 */
export function getAllUsers(): User[] {
  return users;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

/**
 * Add or update a user
 */
export function upsertUser(user: User): void {
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
}
