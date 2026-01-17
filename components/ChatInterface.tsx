/**
 * ============================================================
 * 📄 FILE: frontend/components/ChatInterface.tsx
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Chat UI for onboarding conversations.
 *    User talks to bot, bot extracts conversational signals.
 *    Shows real-time profile updates (vector visualization).
 * 
 * 🛠️ TECH USED:
 *    - React state management
 *    - shadcn/ui components (Card, Input, Button, ScrollArea)
 *    - API client for backend communication
 *    - Lucide icons
 * 
 * 📊 FEATURES:
 *    - Message history display
 *    - Typing indicator
 *    - Real-time trait visualization (bar chart)
 *    - Demo simulation button
 * 
 * ============================================================
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Play, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { sendChatMessage, simulateChat, ChatMessage, ProfileUpdate } from '@/lib/api';

// Generate a random user ID for this session
const SESSION_USER_ID = `user_demo_${Date.now()}`;

interface ChatInterfaceProps {
  onProfileUpdate?: () => void;
}

export default function ChatInterface({ onProfileUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hey, I'm here to help you find your people on campus. What do you usually do when you have free time?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileUpdate | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingTimeouts = useRef<number[]>([]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeouts.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    pendingTimeouts.current = [];
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => clearPendingTimeouts();
  }, [clearPendingTimeouts]);

  const scheduleAssistantMessages = useCallback((assistantMessages: string[]) => {
    let delay = 0;
    assistantMessages.forEach(message => {
      const step = 400 + Math.random() * 400;
      delay += step;
      const timeoutId = window.setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      }, delay);
      pendingTimeouts.current.push(timeoutId);
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(SESSION_USER_ID, userMessage, messages);
      const fallbackMessage = (response as { assistantMessage?: string }).assistantMessage;
      const assistantMessages = response.assistantMessages?.length
        ? response.assistantMessages
        : [fallbackMessage || "Tell me more about that."];
      scheduleAssistantMessages(assistantMessages);
      
      // Update profile with smooth transition
      if (response.profileUpdate) {
        setProfile(prev => {
          if (!prev) return response.profileUpdate;
          // Blend old and new for smooth updates
          return {
            traits: {
              openness: response.profileUpdate.traits.openness,
              conscientiousness: response.profileUpdate.traits.conscientiousness,
              extraversion: response.profileUpdate.traits.extraversion,
              agreeableness: response.profileUpdate.traits.agreeableness,
              neuroticism: response.profileUpdate.traits.neuroticism,
            },
            interests: { ...prev.interests, ...response.profileUpdate.interests },
            confidence: Math.max(prev.confidence, response.profileUpdate.confidence)
          };
        });
        
        // Notify parent that profile was updated (triggers graph refresh)
        if (response.profileUpdate.confidence > 0.1) {
          onProfileUpdate?.();
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Hmm, I'm having trouble processing that right now. Could you try rephrasing?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, onProfileUpdate, scheduleAssistantMessages]);

  const handleSimulate = useCallback(async () => {
    setIsLoading(true);
    clearPendingTimeouts();
    setMessages([{
      role: 'assistant',
      content: "Hey, I'm here to help you find your people on campus. What do you usually do when you have free time?"
    }]);
    setProfile(null);
    try {
      const { conversation } = await simulateChat(SESSION_USER_ID);
      setMessages(conversation);
      // Simulate profile update from demo
      setProfile({
        traits: {
          openness: 0.7,
          conscientiousness: 0.6,
          extraversion: 0.3,
          agreeableness: 0.8,
          neuroticism: 0.4
        },
        interests: { 'reading': 0.8, 'tech': 0.9, 'hackathons': 0.7, 'coffee': 0.6 },
        confidence: 0.75
      });
      onProfileUpdate?.();
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onProfileUpdate]);

  const handleReset = useCallback(() => {
    clearPendingTimeouts();
    setMessages([{
      role: 'assistant',
      content: "Hey, I'm here to help you find your people on campus. What do you usually do when you have free time?"
    }]);
    setProfile(null);
    setInput('');
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Window */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Onboarding Chat
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isLoading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleSimulate} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              Demo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-4 pr-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-secondary rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Panel (Vector Visualization) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Your Signal Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time signal insights
          </p>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-5">
              {/* Traits as bars */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Trait Signals
                </p>
                {Object.entries(profile.traits).map(([trait, value]) => (
                  <div key={trait}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="capitalize font-medium">{trait}</span>
                      <span className="text-muted-foreground font-mono">{(value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Interests */}
              {Object.keys(profile.interests).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Detected Interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(profile.interests)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([interest, weight]) => (
                        <Badge 
                          key={interest} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Signal Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${profile.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-primary font-semibold">
                      {(profile.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Start chatting to build your signal profile</p>
              <p className="text-xs mt-2 opacity-75">We extract conversational signals from your responses</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ============================================================
 * 📄 FILE FOOTER: frontend/components/ChatInterface.tsx
 * ============================================================
 * PURPOSE:
 *    Onboarding chat UI with delayed multi-bubble responses.
 * TECH USED:
 *    - React
 *    - shadcn/ui
 * ============================================================
 */
