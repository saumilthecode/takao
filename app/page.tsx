/**
 * ============================================================
 * 📄 FILE: frontend/app/page.tsx
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Main page with tabs for Chat, Space (3D graph), and Tuner.
 *    Entry point for the demo.
 * 
 * 🛠️ TECH USED:
 *    - Next.js 14 App Router (client component)
 *    - Radix UI Tabs
 *    - Lucide icons
 * 
 * ============================================================
 */

'use client';

import { useState, useId, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Globe, Settings, Compass } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import SocialGraph from '@/components/SocialGraph';
import TunerDashboard from '@/components/TunerDashboard';
import NextStep from '@/components/NextStep';
import type { ProfileUpdate } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);
  const [profile, setProfile] = useState<ProfileUpdate | null>(null);
  const reactId = useId();
  const sessionUserId = useMemo(
    () => `user_demo_${reactId.replace(/[:]/g, '')}`,
    [reactId]
  );

  const handleProfileUpdate = (nextProfile: ProfileUpdate | null) => {
    setProfile(nextProfile);
    setGraphRefreshKey(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Image src="/stickman.png" alt="Takoa" width={24} height={24} className="h-6 w-6" />
            <h1 className="text-xl font-bold">Takoa</h1>
            <span className="text-muted-foreground text-sm ml-2">Find Your People</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/about"
              className="font-semibold underline decoration-2 underline-offset-4 transition-colors hover:text-foreground"
            >
              About
            </Link>
            <span className="rounded-md bg-black px-2 py-1 text-xs font-semibold text-primary-foreground opacity-100">
              Demo Mode
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="chat" className="flex items-center gap-2 shadow-md">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="space" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Space
            </TabsTrigger>
            <TabsTrigger value="tuner" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tuner
            </TabsTrigger>
            <TabsTrigger value="next" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Next Step
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface userId={sessionUserId} onProfileUpdate={handleProfileUpdate} />
          </TabsContent>

          <TabsContent value="next" className="mt-6">
            <NextStep profile={profile} />
          </TabsContent>

          <TabsContent value="space" className="mt-6">
            <SocialGraph key={graphRefreshKey} focusUserId={sessionUserId} />
          </TabsContent>

          <TabsContent value="tuner" className="mt-6">
            <TunerDashboard />
          </TabsContent>
        </Tabs>
      </div>

    </main>
  );
}
