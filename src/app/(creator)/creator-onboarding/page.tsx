'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CreatorOnboardingPage() {
  const [bio, setBio] = useState('');
  const [credentials, setCredentials] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create creator profile
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
        setError('Failed to submit application. Please try again.');
      }
      setLoading(false);
      return;
    }

    // Update role to creator
    await supabase.from('profiles').update({ role: 'creator' }).eq('id', user.id);

    router.push('/builder');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <div className="relative w-full max-w-lg">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg momentum-gradient flex items-center justify-center">
            <PenTool className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Become a Creator</h1>
            <p className="text-sm text-text-secondary">
              Share your expertise with the THRYV community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              placeholder="Tell athletes about your coaching background..."
              className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Credentials & Certifications
            </label>
            <textarea
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              rows={3}
              required
              placeholder="List your certifications, experience, and qualifications..."
              className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors resize-none"
            />
          </div>

          <Input
            label="Video Introduction (optional)"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-2.5 text-sm text-error">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Submit Application
          </Button>

          <p className="text-xs text-text-muted text-center">
            Your application will be reviewed by the THRYV team. You can start building programs immediately.
          </p>
        </form>
      </div>
    </div>
  );
}
