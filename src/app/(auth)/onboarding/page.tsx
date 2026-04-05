'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ChevronRight, ChevronLeft, Target, Dumbbell, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const GOALS = [
  'Build Muscle',
  'Lose Fat',
  'Improve Strength',
  'Athletic Performance',
  'General Fitness',
  'Flexibility & Mobility',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

const EQUIPMENT = [
  'Full Gym',
  'Home Gym',
  'Dumbbells Only',
  'Bodyweight Only',
  'Kettlebells',
  'Resistance Bands',
];

const TIME_OPTIONS = [
  '15–30 min',
  '30–45 min',
  '45–60 min',
  '60–90 min',
  '90+ min',
];

const STEPS = [
  { title: 'What are your goals?', icon: Target, key: 'goals' as const },
  { title: 'Experience level?', icon: Award, key: 'level' as const },
  { title: 'What equipment do you have?', icon: Dumbbell, key: 'equipment' as const },
  { title: 'How much time per session?', icon: Clock, key: 'time' as const },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  function canProceed() {
    switch (step) {
      case 0: return goals.length > 0;
      case 1: return level !== '';
      case 2: return equipment.length > 0;
      case 3: return time !== '';
      default: return false;
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError('');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated: ' + (authError?.message || 'no session'));
      setLoading(false);
      return;
    }

    // Ensure profile exists (trigger may not have fired if DB was set up after signup)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
      });
      if (insertError) {
        setError('Profile create failed: ' + insertError.message);
        setLoading(false);
        return;
      }
    }

    const { error: profileError } = await supabase.from('profiles').update({
      goals,
      experience_level: level,
      equipment,
      time_availability: time,
      onboarding_completed: true,
    }).eq('id', user.id);

    if (profileError) {
      setError('Profile update failed: ' + profileError.message);
      setLoading(false);
      return;
    }

    // Create trial subscription
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      status: 'trial',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'user_id' });

    // Grant trial credits
    await supabase.from('credit_ledger').insert({
      user_id: user.id,
      amount: 2,
      event_type: 'trial_grant',
      description: 'Free trial credits',
    });

    // Initialize streak
    await supabase.from('streaks').upsert({
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
    }, { onConflict: 'user_id' });

    router.push('/home');
    router.refresh();
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="flex items-center gap-2 mb-12">
          <Zap className="h-7 w-7 text-accent-primary" />
          <span className="text-2xl font-bold text-text-primary">THRYV</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'momentum-gradient' : 'bg-border-primary'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <currentStep.icon className="h-5 w-5 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{currentStep.title}</h1>
        </div>

        {/* Step content */}
        <div className="space-y-3 mb-10">
          {step === 0 &&
            GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                  goals.includes(goal)
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                {goal}
              </button>
            ))}

          {step === 1 &&
            LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                  level === l
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                {l}
              </button>
            ))}

          {step === 2 &&
            EQUIPMENT.map((item) => (
              <button
                key={item}
                onClick={() => toggleEquipment(item)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                  equipment.includes(item)
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                {item}
              </button>
            ))}

          {step === 3 &&
            TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                  time === t
                    ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                    : 'border-border-primary bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
        </div>

        {error && (
          <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-2 mb-4">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 gap-1.5"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              loading={loading}
              className="flex-1 gap-1.5"
            >
              Start Training
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
