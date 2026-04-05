'use client';

import { useState, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CommunityFeedProps {
  programId: string;
}

export function CommunityFeed({ programId }: CommunityFeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPosts();
  }, [programId]);

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setPosts(data);
  }

  async function handlePost() {
    if (!newPost.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('posts').insert({
      program_id: programId,
      user_id: user.id,
      content: newPost.trim(),
    });

    // Log engagement
    const { data: program } = await supabase
      .from('programs')
      .select('creator_id')
      .eq('id', programId)
      .single();

    if (program) {
      await supabase.from('usage_events').insert({
        user_id: user.id,
        program_id: programId,
        creator_id: program.creator_id,
        event_type: 'community_engagement',
        value: 1,
      });
    }

    setNewPost('');
    setLoading(false);
    loadPosts();
  }

  return (
    <div>
      {/* New post */}
      <Card className="mb-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share something with the community..."
          rows={3}
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none"
        />
        <div className="flex justify-end mt-3">
          <Button
            size="sm"
            onClick={handlePost}
            loading={loading}
            disabled={!newPost.trim()}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Post
          </Button>
        </div>
      </Card>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-xs font-medium text-accent-primary">
                  {post.profiles?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {post.profiles?.full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{post.content}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <MessageCircle className="h-6 w-6 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No posts yet. Be the first!</p>
        </Card>
      )}
    </div>
  );
}
