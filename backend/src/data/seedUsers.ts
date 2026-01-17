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
  'Tan', 'Patel', 'Kim', 'Garcia', 'Chen', 'Müller', 'Johnson', 'Lee',
  'Williams', 'Brown', 'Jones', 'Davis', 'Wilson', 'Martinez', 'Anderson',
  'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin'
];

const UNIVERSITIES = [
  'NUS', 'NTU', 'SMU', 'SUTD', 'SIT', 
  'Stanford', 'MIT', 'Berkeley', 'CMU', 'Harvard',
  'Imperial', 'Oxford', 'Cambridge', 'ETH Zurich', 'TUM'
];

const INTERESTS = [
  'machine learning', 'web dev', 'mobile apps', 'game dev', 'cybersecurity',
  'blockchain', 'robotics', 'data science', 'cloud computing', 'devops',
  'reading', 'hiking', 'photography', 'cooking', 'music', 'gaming',
  'fitness', 'travel', 'art', 'writing', 'podcasts', 'movies',
  'startups', 'investing', 'philosophy', 'psychology', 'languages',
  'volunteering', 'hackathons', 'open source', 'research', 'teaching'
];

/**
 * Generate a random number between min and max with optional skew
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
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
  
  // Generate Big-5 traits (normalized 0-1)
  const traits = {
    openness: randomBetween(0.2, 0.95),
    conscientiousness: randomBetween(0.2, 0.95),
    extraversion: randomBetween(0.1, 0.9),
    agreeableness: randomBetween(0.3, 0.95),
    neuroticism: randomBetween(0.1, 0.8)
  };

  // Vector is just the traits as array
  const vector = [
    traits.openness,
    traits.conscientiousness,
    traits.extraversion,
    traits.agreeableness,
    traits.neuroticism
  ];

  return {
    id: `user_${index.toString().padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    age: Math.floor(randomBetween(18, 26)),
    uni: UNIVERSITIES[Math.floor(Math.random() * UNIVERSITIES.length)],
    vector,
    traits,
    interests: pickRandom(INTERESTS, Math.floor(randomBetween(3, 8))),
    confidence: randomBetween(0.5, 1.0)
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
