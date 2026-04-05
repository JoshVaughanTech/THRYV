'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function CreateProgramButton({ creatorId }: { creatorId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate() {
    setLoading(true);

    const { data, error } = await supabase
      .from('programs')
      .insert({
        creator_id: creatorId,
        title: 'Untitled Program',
        duration_weeks: 4,
        credit_cost: 1,
        status: 'draft',
      })
      .select()
      .single();

    if (data) {
      // Create default 4 weeks
      const weeks = Array.from({ length: 4 }, (_, i) => ({
        program_id: data.id,
        week_number: i + 1,
        title: `Week ${i + 1}`,
      }));

      await supabase.from('program_weeks').insert(weeks);
      router.push(`/builder/${data.id}`);
    }

    setLoading(false);
  }

  return (
    <Button onClick={handleCreate} loading={loading} className="gap-1.5">
      <Plus className="h-4 w-4" />
      New Program
    </Button>
  );
}
