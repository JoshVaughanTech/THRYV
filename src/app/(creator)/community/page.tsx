import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus, Heart, MessageCircle, Users } from 'lucide-react';

export default async function CreatorCommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/creator-onboarding');

  // Get creator's programs for filter pills
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title')
    .eq('creator_id', creator.id)
    .order('title', { ascending: true });

  const programIds = programs?.map((p: any) => p.id) || [];

  // Get all posts from the creator's programs with author profiles joined
  const { data: posts } = programIds.length > 0
    ? await supabase
        .from('posts')
        .select('*, profiles:user_id(id, full_name, avatar_url, role), programs:program_id(id, title, creator_id)')
        .in('program_id', programIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] };

  // Count comments for each post
  const postIds = posts?.map((p: any) => p.id) || [];
  const { data: commentCounts } = postIds.length > 0
    ? await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
    : { data: [] };

  const commentCountMap: Record<string, number> = {};
  for (const c of commentCounts || []) {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
  }

  // Stats: posts this week and comments this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalPostCount },
    { count: postsThisWeek },
    { count: totalCommentCount },
    { count: commentsThisWeek },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('program_id', programIds.length > 0 ? programIds : [crypto.randomUUID()]),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('program_id', programIds.length > 0 ? programIds : [crypto.randomUUID()])
      .gte('created_at', oneWeekAgo),
    supabase
      .from('comments')
      .select('*, posts!inner(program_id)', { count: 'exact', head: true })
      .in('posts.program_id', programIds.length > 0 ? programIds : [crypto.randomUUID()]),
    supabase
      .from('comments')
      .select('*, posts!inner(program_id)', { count: 'exact', head: true })
      .in('posts.program_id', programIds.length > 0 ? programIds : [crypto.randomUUID()])
      .gte('created_at', oneWeekAgo),
  ]);

  // Engagement rate: posts + comments this week / total active users in programs
  const { data: activeUsers } = programIds.length > 0
    ? await supabase
        .from('program_activations')
        .select('user_id')
        .in('program_id', programIds)
        .eq('is_active', true)
    : { data: [] };

  const uniqueActiveCount = new Set(activeUsers?.map((a: any) => a.user_id) || []).size;
  const weeklyActivity = (postsThisWeek || 0) + (commentsThisWeek || 0);
  const engagementRate = uniqueActiveCount > 0
    ? Math.min(100, Math.round((weeklyActivity / uniqueActiveCount) * 100))
    : 0;

  // Determine if post author is the creator
  function isCreatorPost(post: any) {
    return post.programs?.creator_id && post.user_id === user!.id;
  }

  function getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Community</h1>
          <p className="text-[#888888] mt-1">
            Manage and engage with your program communities.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#B4F000] px-4 py-2.5 text-sm font-bold text-[#0A0A0A] hover:bg-[#C5F53A] transition-colors">
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium bg-[#B4F000] text-[#0A0A0A] transition-colors">
          All programs
        </button>
        {(programs || []).map((program: any) => (
          <button
            key={program.id}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border border-[#2A2A2A] text-[#888888] hover:border-[#444444] hover:text-white transition-colors"
          >
            {program.title}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[#555555] uppercase tracking-[1px] font-medium">
              Total posts
            </p>
          </div>
          <p className="text-3xl font-bold text-white">
            {(totalPostCount ?? 0).toLocaleString()}
          </p>
          <p className="text-xs mt-1">
            <span className="text-[#B4F000] font-medium">
              +{postsThisWeek ?? 0}
            </span>
            <span className="text-[#555555] ml-1">this week</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[#555555] uppercase tracking-[1px] font-medium">
              Comments
            </p>
          </div>
          <p className="text-3xl font-bold text-white">
            {(totalCommentCount ?? 0).toLocaleString()}
          </p>
          <p className="text-xs mt-1">
            <span className="text-[#B4F000] font-medium">
              +{commentsThisWeek ?? 0}
            </span>
            <span className="text-[#555555] ml-1">this week</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[#555555] uppercase tracking-[1px] font-medium">
              Engagement rate
            </p>
          </div>
          <p className="text-3xl font-bold text-white">{engagementRate}%</p>
          <p className="text-xs mt-1">
            <span className="text-[#B4F000] font-medium">
              {weeklyActivity} interactions
            </span>
            <span className="text-[#555555] ml-1">this week</span>
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {(!posts || posts.length === 0) && (
          <div className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-12 text-center">
            <Users className="h-10 w-10 text-[#555555] mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No posts yet</p>
            <p className="text-[#555555] text-sm">
              Create your first community post to start engaging with your members.
            </p>
          </div>
        )}

        {(posts || []).map((post: any) => {
          const authorName = post.profiles?.full_name || 'Unknown';
          const programTitle = post.programs?.title || 'Unknown Program';
          const isCreator = isCreatorPost(post);
          const commentCount = commentCountMap[post.id] || 0;

          return (
            <div
              key={post.id}
              className="rounded-2xl border border-[#1E1E1E] bg-[#141414] p-6"
            >
              {/* Post Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCreator
                      ? 'border-2 border-[#B4F000] bg-[#1A2A0A] text-[#B4F000]'
                      : 'bg-[#1E1E1E] text-[#888888]'
                  }`}
                >
                  {getInitials(authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {authorName}
                    </span>
                    {isCreator && (
                      <span className="inline-flex items-center rounded-full bg-[#1A2A0A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#B4F000]">
                        Creator
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#555555]">
                    {programTitle} &middot; {timeAgo(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-sm text-[#CCCCCC] leading-relaxed mb-4">
                {post.content}
              </p>

              {/* Post Actions */}
              <div className="border-t border-[#1E1E1E] pt-3 flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-[#555555] hover:text-[#B4F000] transition-colors text-sm">
                  <Heart className="h-4 w-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-1.5 text-[#555555] hover:text-[#7799DD] transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  <span>{commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'Reply' : 'Replies'}` : 'Reply'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
