import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  TrendingUp,
  Coins,
  Calendar,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: subscription },
    { data: activations },
    { data: streak },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('program_activations').select('*, programs(*)').eq('user_id', user.id).eq('is_active', true),
    supabase.from('streaks').select('*').eq('user_id', user.id).single(),
  ]);

  // Get credit balance
  const { data: creditBalance } = await supabase.rpc('get_credit_balance', {
    p_user_id: user.id,
  });

  // Get total momentum
  const { data: momentum } = await supabase.rpc('get_momentum_total', {
    p_user_id: user.id,
  });

  const momentumLevel = Math.floor((momentum || 0) / 100) + 1;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-text-secondary mt-1">Here&apos;s your training overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg momentum-gradient flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-[#0A0A0A]" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Momentum</p>
            <p className="text-xl font-bold text-text-primary">{momentum || 0}</p>
            <p className="text-xs text-accent-primary">Level {momentumLevel}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <Flame className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Current Streak</p>
            <p className="text-xl font-bold text-text-primary">{streak?.current_streak || 0} days</p>
            <p className="text-xs text-text-muted">Best: {streak?.longest_streak || 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center flex-shrink-0">
            <Coins className="h-5 w-5 text-accent-secondary" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Credits</p>
            <p className="text-xl font-bold text-text-primary">{creditBalance ?? 0}</p>
            <p className="text-xs text-text-muted">Available</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Subscription</p>
            <p className="text-xl font-bold text-text-primary capitalize">
              {subscription?.status || 'None'}
            </p>
            {subscription?.status === 'trial' && subscription.trial_end && (
              <p className="text-xs text-warning">
                Ends {new Date(subscription.trial_end).toLocaleDateString()}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Active Programs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Active Programs</h2>
          <Link
            href="/programs"
            className="inline-flex items-center gap-1 text-sm text-accent-primary hover:text-accent-primary-hover transition-colors"
          >
            Browse Programs
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {activations && activations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activations.map((activation: any) => (
              <Card key={activation.id} hover>
                <Link href={`/my-programs`} className="block">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">
                      {activation.programs?.title || 'Program'}
                    </h3>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-sm text-text-muted">
                    Week {activation.current_week} of {activation.programs?.duration_weeks || '?'}
                  </p>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Zap className="h-8 w-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary mb-1">No active programs yet</p>
            <p className="text-sm text-text-muted mb-4">
              Browse our library and activate your first program
            </p>
            <Link
              href="/programs"
              className="inline-flex items-center gap-1.5 text-sm text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              Discover Programs
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
