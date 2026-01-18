/**
 * ============================================================
 * 📄 FILE: frontend/components/NextStep.tsx
 * ============================================================
 *
 * 🎯 PURPOSE:
 *    "Your Next Step" screen with calm, actionable guidance.
 *
 * 🛠️ TECH USED:
 *    - React
 *    - shadcn/ui components
 *
 * ============================================================
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import type { ProfileUpdate } from '@/lib/api';

const DEFAULT_INTERESTS = ['AI', 'Casual sports', 'Cafés', 'Study sessions'];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatInterestList(interests: string[]): string {
  if (interests.length === 0) return '';
  if (interests.length === 1) return interests[0];
  if (interests.length === 2) return `${interests[0]} and ${interests[1]}`;
  return `${interests.slice(0, -1).join(', ')}, and ${interests[interests.length - 1]}`;
}

interface NextStepProps {
  profile?: ProfileUpdate | null;
}

export default function NextStep({ profile }: NextStepProps) {
  const traits = profile?.traits;
  const interestList = useMemo(() => {
    const entries = Object.entries(profile?.interests || {})
      .sort(([, a], [, b]) => b - a)
      .map(([interest]) => interest);
    const top = entries.length ? entries.slice(0, 4) : DEFAULT_INTERESTS;
    return top;
  }, [profile?.interests]);

  const interactionPosition = useMemo(() => {
    if (!traits) return 20;
    const spontaneity = clamp(traits.extraversion * 0.6 + traits.openness * 0.4, 0, 1);
    return Math.round((1 - spontaneity) * 70 + 10);
  }, [traits]);

  const groupPosition = useMemo(() => {
    if (!traits) return 45;
    const groupScore = clamp(traits.extraversion * 0.5 + traits.agreeableness * 0.5, 0, 1);
    return Math.round(groupScore * 70 + 15);
  }, [traits]);

  const interactionText = useMemo(() => {
    if (!traits) return 'More reflective than spontaneous.';
    const score = traits.extraversion * 0.6 + traits.openness * 0.4;
    if (score < 0.4) return 'More reflective than spontaneous.';
    if (score < 0.6) return 'Balanced between reflective and spontaneous.';
    return 'More spontaneous than reflective.';
  }, [traits]);

  const groupText = useMemo(() => {
    if (!traits) return 'Prefers small groups in low‑pressure settings.';
    const score = traits.extraversion * 0.5 + traits.agreeableness * 0.5;
    if (score < 0.35) return 'Prefers solo or one‑on‑one settings.';
    if (score < 0.65) return 'Prefers small groups in low‑pressure settings.';
    return 'Comfortable in larger groups when the vibe is relaxed.';
  }, [traits]);

  const interestSentence = useMemo(() => {
    const list = formatInterestList(interestList);
    return list
      ? `Often gravitates toward ${list}.`
      : 'Often gravitates toward a few recurring interests.';
  }, [interestList]);

  const systemContext = useMemo(() => {
    const confidence = profile?.confidence ?? 0;
    if (confidence < 0.3) return 'We’re just getting to know how you engage socially.';
    if (confidence < 0.55) return 'We have a general sense of how you engage socially.';
    if (confidence < 0.8) return 'We have a stable picture of how you engage socially.';
    return 'We have a strong understanding of how you engage socially.';
  }, [profile?.confidence]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 step-enter">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/stickman.png" alt="Info" width={16} height={16} className="h-4 w-4" />
          Here&apos;s how the system currently sees you — this updates as you talk.
        </div>
      </div>

      {/* Section 1 — Snapshot (Input) */}
      <Card className="transition-shadow hover:shadow-md step-enter-delay">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-bold">Your Social Snapshot</CardTitle>
          <p className="text-sm text-muted-foreground">Current system readout.</p>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div className="space-y-2 rounded-xl border border-border/50 p-3">
            <p className="text-xs font-semibold">Interaction style</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Reflective</span>
              <span className="flex-1 border-t border-border" />
              <span>Spontaneous</span>
            </div>
            <div className="relative h-3">
              <span
                className="absolute -top-1 text-xs indicator-float"
                style={{ left: `${interactionPosition}%` }}
              >
                ▲
              </span>
            </div>
            <p>{interactionText}</p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/50 p-3">
            <p className="text-xs font-semibold">Group preference</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Solo</span>
              <span className="flex-1 border-t border-border" />
              <span>Small groups</span>
              <span className="flex-1 border-t border-border" />
              <span>Large groups</span>
            </div>
            <div className="relative h-3">
              <span
                className="absolute -top-1 text-xs indicator-float"
                style={{ left: `${groupPosition}%` }}
              >
                ▲
              </span>
            </div>
            <p>{groupText}</p>
          </div>

          <div className="space-y-2 rounded-xl border border-border/50 p-3">
            <p className="text-xs font-semibold">Top interests</p>
            <p>{interestSentence}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {interestList.map(interest => (
                <Badge
                  key={interest}
                  variant="secondary"
                  title="Often shows up in conversations."
                  className="transition-transform hover:-translate-y-[1px]"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border/50 p-3">
            <p className="text-xs font-semibold">System context</p>
            <p>{systemContext}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-wide">
        <ArrowDown className="h-3 w-3" />
        How this shapes your group.
      </div>

      {/* Section 3 — Plan (Outcome) */}
      <Card className="transition-shadow hover:shadow-md step-enter-delay-2">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-bold">System-Generated Plan</CardTitle>
          <p className="text-sm text-muted-foreground">Designed for this group.</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-base font-semibold">Low‑pressure coffee + interest sync</p>
            <p className="text-muted-foreground">
              Chosen because your group prefers relaxed, small-setting interactions.
            </p>
          </div>
          <ol className="list-decimal pl-4 space-y-2">
            <li>Say hello in the circle chat.</li>
            <li>Pick one shared interest to start with.</li>
            <li>Meet for a short, no‑pressure hang.</li>
          </ol>
          <div className="rounded-lg border border-border px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your role</p>
            <p>You’ll kick off the first group message.</p>
          </div>
          <Button variant="outline" size="sm">
            Need help?
          </Button>
        </CardContent>
      </Card>

      {/* Section 4 — Group cohesion signals */}
      <Card className="transition-shadow hover:shadow-md step-enter-delay-2">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Group cohesion signals</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Aligned energy levels.</p>
          <p>Overlapping interests.</p>
          <p>Balanced conversation dynamics.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ============================================================
 * 📄 FILE FOOTER: frontend/components/NextStep.tsx
 * ============================================================
 * PURPOSE:
 *    Calm, actionable “Your Next Step” screen.
 * TECH USED:
 *    - React
 *    - shadcn/ui
 * ============================================================
 */
