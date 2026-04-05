import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, PenTool, Eye, EyeOff } from 'lucide-react';
import { CreateProgramButton } from './create-button';

export default async function BuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-onboarding');

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('creator_id', creator.id)
    .order('updated_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Program Builder</h1>
          <p className="text-text-secondary mt-1">Create and manage your training programs</p>
        </div>
        <CreateProgramButton creatorId={creator.id} />
      </div>

      {programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program: any) => (
            <Link key={program.id} href={`/builder/${program.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">{program.title}</h3>
                  <Badge
                    variant={
                      program.status === 'published'
                        ? 'success'
                        : program.status === 'draft'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {program.status === 'published' && <Eye className="h-3 w-3 mr-1" />}
                    {program.status === 'unpublished' && <EyeOff className="h-3 w-3 mr-1" />}
                    {program.status}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted line-clamp-2 mb-3">
                  {program.description || 'No description'}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{program.duration_weeks} weeks</span>
                  <span>{program.credit_cost} credit{program.credit_cost !== 1 ? 's' : ''}</span>
                  {program.goal && <Badge variant="accent">{program.goal}</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <PenTool className="h-8 w-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary mb-1">No programs yet</p>
          <p className="text-sm text-text-muted mb-4">
            Create your first program and start reaching athletes
          </p>
        </Card>
      )}
    </div>
  );
}
