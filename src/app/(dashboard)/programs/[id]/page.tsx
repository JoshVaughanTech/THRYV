import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivateButton } from './activate-button';
import { CommunityFeed } from './community-feed';
import {
  Clock,
  Dumbbell,
  Target,
  Award,
  User,
  Calendar,
} from 'lucide-react';

export default async function ProgramDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: program } = await supabase
    .from('programs')
    .select('*, creators(*, profiles:user_id(full_name, avatar_url, bio:credentials))')
    .eq('id', id)
    .single();

  if (!program) notFound();

  // Get weeks and workouts
  const { data: weeks } = await supabase
    .from('program_weeks')
    .select('*, workouts(*)')
    .eq('program_id', id)
    .order('week_number');

  // Check if user already activated
  const { data: existingActivation } = await supabase
    .from('program_activations')
    .select('*')
    .eq('user_id', user.id)
    .eq('program_id', id)
    .single();

  // Get credit balance
  const { data: creditBalance } = await supabase.rpc('get_credit_balance', {
    p_user_id: user.id,
  });

  const creator = program.creators as any;

  return (
    <div className="max-w-4xl">
      {/* Program Header */}
      <div className="mb-8">
        {program.cover_image_url ? (
          <div className="w-full h-56 rounded-xl bg-bg-tertiary mb-6 overflow-hidden">
            <img
              src={program.cover_image_url}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-56 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 mb-6 flex items-center justify-center">
            <span className="text-5xl font-bold text-text-muted">{program.title.charAt(0)}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {program.goal && <Badge variant="accent">{program.goal}</Badge>}
          {program.discipline && <Badge>{program.discipline}</Badge>}
          {program.experience_level && <Badge>{program.experience_level}</Badge>}
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2">{program.title}</h1>
        <p className="text-text-secondary leading-relaxed">{program.description}</p>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center py-4">
          <Calendar className="h-5 w-5 text-accent-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-text-primary">{program.duration_weeks}</p>
          <p className="text-xs text-text-muted">Weeks</p>
        </Card>
        <Card className="text-center py-4">
          <Target className="h-5 w-5 text-accent-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-text-primary">{program.goal || '—'}</p>
          <p className="text-xs text-text-muted">Goal</p>
        </Card>
        <Card className="text-center py-4">
          <Award className="h-5 w-5 text-accent-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-text-primary">{program.experience_level || '—'}</p>
          <p className="text-xs text-text-muted">Level</p>
        </Card>
        <Card className="text-center py-4">
          <Dumbbell className="h-5 w-5 text-accent-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-text-primary">{program.equipment?.length || 0}</p>
          <p className="text-xs text-text-muted">Equipment</p>
        </Card>
      </div>

      {/* Creator Card */}
      <Card className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-6 w-6 text-accent-primary" />
        </div>
        <div>
          <p className="font-semibold text-text-primary">
            {creator?.profiles?.full_name || 'Coach'}
          </p>
          <p className="text-sm text-text-muted line-clamp-1">
            {creator?.profiles?.bio || creator?.bio || 'Certified coach'}
          </p>
        </div>
      </Card>

      {/* Activate / Status */}
      <div className="mb-8">
        <ActivateButton
          programId={program.id}
          creditCost={program.credit_cost}
          creditBalance={creditBalance ?? 0}
          isActivated={!!existingActivation}
        />
      </div>

      {/* Weekly Structure */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Weekly Structure</h2>
        {weeks && weeks.length > 0 ? (
          <div className="space-y-4">
            {weeks.map((week: any) => (
              <Card key={week.id}>
                <h3 className="font-medium text-text-primary mb-3">
                  Week {week.week_number}{week.title ? ` — ${week.title}` : ''}
                </h3>
                {week.workouts && week.workouts.length > 0 ? (
                  <div className="space-y-2">
                    {week.workouts
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((workout: any) => (
                        <div
                          key={workout.id}
                          className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-2.5"
                        >
                          <span className="text-sm text-text-secondary">{workout.title}</span>
                          {workout.estimated_duration && (
                            <span className="flex items-center gap-1 text-xs text-text-muted">
                              <Clock className="h-3 w-3" />
                              {workout.estimated_duration} min
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No workouts listed</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-text-muted text-center py-4">
              Program structure will be visible once published
            </p>
          </Card>
        )}
      </div>

      {/* Community Feed */}
      {existingActivation && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Community</h2>
          <CommunityFeed programId={program.id} />
        </div>
      )}
    </div>
  );
}
