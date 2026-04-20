import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  BarChart3,
  DollarSign,
  Dumbbell,
  TrendingUp,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalCreators },
    { count: totalPrograms },
    { count: trialSubs },
    { count: activeSubs },
    { count: cancelledSubs },
    { count: totalSessions },
    { count: totalActivations },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('creators').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('workout_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('program_activations').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary mt-1">Platform overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/creators"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2a2a3a] bg-[#15151f] hover:border-[#00E5CC]/50 px-4 py-2 text-sm font-medium text-text-primary transition-all"
          >
            <Users className="h-4 w-4" />
            Manage Creators
          </Link>
          <Link
            href="/admin/management"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent-primary hover:bg-accent-primary-hover px-4 py-2 text-sm font-bold text-white transition-all"
          >
            Management Tools
          </Link>
        </div>
      </div>

      {/* Users & Creators */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-accent-primary" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Users</p>
            <p className="text-2xl font-bold text-text-primary">{totalUsers ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-accent-secondary" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Creators</p>
            <p className="text-2xl font-bold text-text-primary">{totalCreators ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Published Programs</p>
            <p className="text-2xl font-bold text-text-primary">{totalPrograms ?? 0}</p>
          </div>
        </Card>
      </div>

      {/* Subscriptions */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Subscriptions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">Trial</p>
            <Badge variant="warning">{trialSubs ?? 0}</Badge>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">Active</p>
            <Badge variant="success">{activeSubs ?? 0}</Badge>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">Cancelled</p>
            <Badge variant="error">{cancelledSubs ?? 0}</Badge>
          </div>
        </Card>
      </div>

      {/* Usage */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Usage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Workout Sessions</p>
            <p className="text-2xl font-bold text-text-primary">{totalSessions ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg momentum-gradient flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Program Activations</p>
            <p className="text-2xl font-bold text-text-primary">{totalActivations ?? 0}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
