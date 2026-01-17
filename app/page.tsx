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

import { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Globe, Settings, Sparkles } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import SocialGraph from '@/components/SocialGraph';
import TunerDashboard from '@/components/TunerDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);

  const handleProfileUpdate = () => {
    // Trigger graph refresh when chat updates profile
    setGraphRefreshKey(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
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
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="chat" className="flex items-center gap-2">
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
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface onProfileUpdate={handleProfileUpdate} />
          </TabsContent>

          <TabsContent value="space" className="mt-6">
            <SocialGraph key={graphRefreshKey} />
          </TabsContent>

          <TabsContent value="tuner" className="mt-6">
            <TunerDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t border-border px-6 py-6 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto" />
      </footer>
    </main>
  );
}

/**
 * ============================================================
 * 📄 FILE FOOTER: frontend/app/page.tsx
 * ============================================================
 * PURPOSE:
 *    Main entry UI with chat, graph, and tuner tabs.
 * TECH USED:
 *    - Next.js App Router
 *    - React
 *    - shadcn/ui tabs
 * ============================================================
 */
