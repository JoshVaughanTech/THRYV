import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoachCardCarousel } from '@/components/ui/coach-card-carousel';
import { ProgramFilters } from './filters';

export default async function ProgramsPage(props: {
  searchParams: Promise<{ goal?: string; level?: string; equipment?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Fetch creators for coach carousel
  const { data: creators } = await supabase
    .from('creators')
    .select('id, user_id, bio, specialties, follower_count, profiles:user_id(full_name, avatar_url)')
    .eq('approved', true)
    .order('follower_count', { ascending: false })
    .limit(10);

  // Get program counts and session counts per creator
  const coaches = await Promise.all(
    (creators || []).map(async (c: any) => {
      const [{ count: programCount }, { count: sessionCount }] = await Promise.all([
        supabase.from('programs').select('*', { count: 'exact', head: true }).eq('creator_id', c.id).eq('status', 'published'),
        supabase.from('usage_events').select('*', { count: 'exact', head: true }).eq('creator_id', c.id).eq('event_type', 'workout_completion'),
      ]);
      return {
        id: c.id,
        full_name: c.profiles?.full_name || 'Coach',
        avatar_url: c.profiles?.avatar_url || null,
        bio: c.bio,
        specialties: c.specialties || [],
        follower_count: c.follower_count || 0,
        program_count: programCount || 0,
        session_count: sessionCount || 0,
        tier: (c.follower_count || 0) >= 1000 ? 'ELITE' as const : 'PRO' as const,
      };
    })
  );

  let query = supabase
    .from('programs')
    .select('*, creators(*, profiles:user_id(full_name, avatar_url))')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (searchParams.goal) {
    query = query.eq('goal', searchParams.goal);
  }
  if (searchParams.level) {
    query = query.eq('experience_level', searchParams.level);
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`);
  }

  const { data: programs } = await query;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Discover Programs</h1>
        <p className="text-text-secondary mt-1">Find the right program for your goals</p>
      </div>

      {/* Coach Baseball Card Carousel */}
      {coaches.length > 0 && (
        <div className="mb-8">
          <CoachCardCarousel coaches={coaches} />
        </div>
      )}

      <ProgramFilters />

      {programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program: any) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <Card hover className="h-full">
                {program.cover_image_url && (
                  <div className="w-full h-40 rounded-lg bg-bg-tertiary mb-4 overflow-hidden">
                    <img
                      src={program.cover_image_url}
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!program.cover_image_url && (
                  <div className="w-full h-40 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 mb-4 flex items-center justify-center">
                    <span className="text-3xl font-bold text-text-muted">
                      {program.title.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {program.goal && <Badge variant="accent">{program.goal}</Badge>}
                  {program.experience_level && <Badge>{program.experience_level}</Badge>}
                  <Badge>{program.duration_weeks} weeks</Badge>
                </div>

                <h3 className="font-semibold text-text-primary mb-1">{program.title}</h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-3">
                  {program.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    by {program.creators?.profiles?.full_name || 'Coach'}
                  </span>
                  <span className="text-accent-primary font-medium">
                    {program.credit_cost} credit{program.credit_cost !== 1 ? 's' : ''}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <Search className="h-8 w-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No programs found</p>
          <p className="text-sm text-text-muted mt-1">Try adjusting your filters</p>
        </Card>
      )}
    </div>
  );
}
