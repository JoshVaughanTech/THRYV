import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProgramEditor } from './program-editor';

export default async function ProgramEditorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-signup');

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .eq('creator_id', creator.id)
    .single();

  if (!program) notFound();

  const { data: weeks } = await supabase
    .from('program_weeks')
    .select('*, workouts(*, exercises(*))')
    .eq('program_id', id)
    .order('week_number');

  return (
    <ProgramEditor
      program={program}
      weeks={weeks || []}
    />
  );
}
