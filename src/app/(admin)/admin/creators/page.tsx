import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, UserCheck, Users } from 'lucide-react';
import { ApproveButton } from './approve-button';

export default async function AdminCreatorsPage() {
  const supabase = await createClient();

  const { data: creators, error } = await supabase
    .from('creators')
    .select('id, user_id, bio, credentials, approved, created_at, specialties, profiles:user_id(full_name, email, avatar_url)')
    .order('created_at', { ascending: false });

  const pendingCount = creators?.filter((c: any) => !c.approved).length ?? 0;
  const approvedCount = creators?.filter((c: any) => c.approved).length ?? 0;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Manage Creators</h1>
        <p className="text-text-secondary mt-1">Review and approve creator applications</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#00E5CC]/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-[#00E5CC]" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Creators</p>
            <p className="text-2xl font-bold text-text-primary">{creators?.length ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Pending Review</p>
            <p className="text-2xl font-bold text-text-primary">{pendingCount}</p>
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Approved</p>
            <p className="text-2xl font-bold text-text-primary">{approvedCount}</p>
          </div>
        </Card>
      </div>

      {/* Creators table */}
      {error && (
        <Card className="mb-4">
          <p className="text-error text-sm">Error loading creators: {error.message}</p>
        </Card>
      )}

      {creators && creators.length > 0 ? (
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-[#2a2a3a]">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Bio</th>
                  <th className="px-6 py-4 font-medium">Credentials</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator: any) => (
                  <tr
                    key={creator.id}
                    className="border-b border-[#2a2a3a]/50 hover:bg-[#15151f]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {creator.profiles?.avatar_url ? (
                          <img
                            src={creator.profiles.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#00E5CC]/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#00E5CC]">
                              {(creator.profiles?.full_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-text-primary">
                          {creator.profiles?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {creator.profiles?.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-text-secondary max-w-[200px]">
                      <p className="line-clamp-2 text-xs">{creator.bio || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-text-secondary max-w-[200px]">
                      <p className="line-clamp-2 text-xs">{creator.credentials || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {creator.approved ? (
                        <Badge variant="success">Approved</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ApproveButton
                        creatorId={creator.id}
                        creatorUserId={creator.user_id}
                        approved={creator.approved}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Card className="text-center py-16">
          <Users className="h-8 w-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No creator applications found</p>
          <p className="text-sm text-text-muted mt-1">Creator applications will appear here for review</p>
        </Card>
      )}
    </div>
  );
}
