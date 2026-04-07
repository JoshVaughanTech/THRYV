import { redirect } from 'next/navigation';
import {
  Dumbbell,
  Flame,
  TrendingUp,
  Zap,
  Coins,
  UserPlus,
  MessageCircle,
  Heart,
  Bell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MarkReadButton } from './mark-read-button';
import type { Notification, NotificationType } from '@/types/database';

const iconMap: Record<NotificationType, typeof Dumbbell> = {
  workout_complete: Dumbbell,
  streak_milestone: Flame,
  level_up: TrendingUp,
  program_activated: Zap,
  credit_received: Coins,
  new_follower: UserPlus,
  community_reply: MessageCircle,
  community_like: Heart,
};

const iconColorMap: Record<NotificationType, string> = {
  workout_complete: 'text-[#6c5ce7]',
  streak_milestone: 'text-orange-500',
  level_up: 'text-[#6c5ce7]',
  program_activated: 'text-yellow-500',
  credit_received: 'text-yellow-500',
  new_follower: 'text-blue-400',
  community_reply: 'text-green-400',
  community_like: 'text-pink-500',
};

const iconBgMap: Record<NotificationType, string> = {
  workout_complete: 'bg-[#6c5ce7]/10',
  streak_milestone: 'bg-orange-500/10',
  level_up: 'bg-[#6c5ce7]/10',
  program_activated: 'bg-yellow-500/10',
  credit_received: 'bg-yellow-500/10',
  new_follower: 'bg-blue-400/10',
  community_reply: 'bg-green-400/10',
  community_like: 'bg-pink-500/10',
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const hasUnread = notifications?.some((n: Notification) => !n.read) ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        {hasUnread && <MarkReadButton userId={user.id} />}
      </header>

      {/* Notification List */}
      <div className="px-5 pb-24 space-y-2">
        {!notifications || notifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#15151f] border border-[#2a2a3a] mb-4">
              <Bell className="h-7 w-7 text-[#6b6b80]" />
            </div>
            <p className="text-sm font-medium text-[#6b6b80]">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-[#4a4a5a]">
              We&apos;ll let you know when something happens
            </p>
          </div>
        ) : (
          notifications.map((notification: Notification) => {
            const Icon = iconMap[notification.type] ?? Bell;
            const iconColor = iconColorMap[notification.type] ?? 'text-[#6c5ce7]';
            const iconBg = iconBgMap[notification.type] ?? 'bg-[#6c5ce7]/10';

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  notification.read
                    ? 'border-[#2a2a3a] bg-[#15151f]'
                    : 'border-[#6c5ce7]/20 bg-[#15151f]'
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        notification.read ? 'text-[#a0a0b8]' : 'text-white'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-[#6b6b80]">
                        {timeAgo(notification.created_at)}
                      </span>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-[#6c5ce7]" />
                      )}
                    </div>
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${
                      notification.read ? 'text-[#6b6b80]' : 'text-[#a0a0b8]'
                    }`}
                  >
                    {notification.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
