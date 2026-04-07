'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadAvatar } from '@/lib/upload';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  fullName?: string | null;
  onUploadComplete?: (url: string) => void;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AvatarUpload({
  currentAvatarUrl,
  fullName,
  onUploadComplete,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentAvatarUrl ?? null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const publicUrl = await uploadAvatar(file);

      // Update the profiles table with the new avatar_url
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);
      }

      setAvatarUrl(publicUrl);
      onUploadComplete?.(publicUrl);
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="group relative h-[72px] w-[72px] rounded-full border-2 border-[#6c5ce7] overflow-hidden
                   bg-[#15151f] transition-all duration-200 cursor-pointer
                   hover:border-[#6c5ce7]/80 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]
                   disabled:cursor-not-allowed disabled:opacity-70"
      >
        {/* Avatar image or initials */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName ?? 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-[#6c5ce7]">
            {getInitials(fullName)}
          </span>
        )}

        {/* Hover overlay with camera icon */}
        {!uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}

        {/* Loading spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/70">
            <svg
              className="h-6 w-6 animate-spin text-[#6c5ce7]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload avatar"
      />
    </div>
  );
}
