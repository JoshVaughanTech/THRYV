'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, User, ArrowLeft, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const SPECIALTIES = [
  'Strength & Conditioning',
  'Hypertrophy',
  'HIIT & Cardio',
  'Powerlifting',
  'Olympic Weightlifting',
  'Functional Fitness',
  'Mobility & Recovery',
  'Sport-Specific',
  'Bodybuilding',
  'CrossFit',
];

export default function CreatorSignupPage() {
  const [step, setStep] = useState(0); // 0=account, 1=creator profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [credentials, setCredentials] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Ensure profile exists
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Account created but session not found. Try logging in.');
      setLoading(false);
      return;
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        role: 'creator',
        onboarding_completed: false,
      });
    } else {
      await supabase
        .from('profiles')
        .update({ role: 'creator', full_name: fullName })
        .eq('id', user.id);
    }

    setLoading(false);
    setStep(1);
  }

  async function handleSubmitCreatorProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Create creator record
    const { error: createError } = await supabase.from('creators').insert({
      user_id: user.id,
      bio,
      credentials,
      video_url: videoUrl || null,
      approved: false,
    });

    if (createError) {
      if (createError.code === '23505') {
        setError('You have already applied as a creator.');
      } else {
        setError('Failed to submit: ' + createError.message);
      }
      setLoading(false);
      return;
    }

    // Mark onboarding complete
    await supabase.from('profiles').update({
      onboarding_completed: true,
      goals: selectedSpecialties,
    }).eq('id', user.id);

    // Create subscription + credits
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      status: 'trial',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'user_id' });

    await supabase.from('credit_ledger').insert({
      user_id: user.id,
      amount: 3,
      event_type: 'trial_grant',
      description: 'Creator trial credits',
    });

    await supabase.from('streaks').upsert({
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
    }, { onConflict: 'user_id' });

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-7 w-7 text-accent-primary" />
          <span className="text-2xl font-bold text-text-primary">THRYV</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[1px] bg-accent-primary text-white">
            Creator
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 my-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'momentum-gradient' : 'bg-border-primary'
              }`}
            />
          ))}
        </div>

        {step === 0 ? (
          <>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Create your creator account</h1>
            <p className="text-text-secondary mb-8">Build programs, grow your audience, earn revenue.</p>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border-primary bg-bg-secondary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border-primary bg-bg-secondary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border-primary bg-bg-secondary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-2.5 text-sm text-error">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Continue
              </Button>

              <p className="text-sm text-text-muted text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-accent-primary hover:text-accent-primary-hover transition-colors">
                  Log in
                </Link>
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg momentum-gradient flex items-center justify-center">
                <PenTool className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">Your creator profile</h1>
                <p className="text-sm text-text-secondary">Tell athletes about yourself</p>
              </div>
            </div>

            <form onSubmit={handleSubmitCreatorProfile} className="space-y-5 mt-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  required
                  placeholder="Your coaching background and philosophy..."
                  className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Credentials & Certifications</label>
                <textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  rows={2}
                  required
                  placeholder="CSCS, NSCA-CPT, etc."
                  className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        selectedSpecialties.includes(s)
                          ? 'bg-accent-primary text-white'
                          : 'border border-border-primary text-text-secondary hover:bg-bg-tertiary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Video Introduction (optional)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-2.5 text-sm text-error">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Submit & Start Building
              </Button>

              <p className="text-xs text-text-muted text-center">
                Your application will be reviewed. You can start building programs immediately.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
