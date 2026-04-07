'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, AlertTriangle, X } from 'lucide-react';

// ─── Change Email Form ───────────────────────────────────────────────
function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!newEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }

    if (newEmail === currentEmail) {
      setMessage({
        type: 'error',
        text: 'New email must be different from your current email.',
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Confirmation email sent. Please check both your old and new email to confirm the change.',
      });
      setNewEmail('');
    }
  }

  return (
    <section className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a3a]">
        <Mail className="h-5 w-5 text-[#6c5ce7]" />
        <h2 className="text-base font-semibold text-white">Change Email</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#666] mb-1.5">
            Current Email
          </label>
          <div className="rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3.5 py-2.5 text-sm text-[#666]">
            {currentEmail}
          </div>
        </div>

        <div>
          <label
            htmlFor="new-email"
            className="block text-xs font-medium text-[#666] mb-1.5"
          >
            New Email
          </label>
          <input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3.5 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#6c5ce7] transition-colors"
          />
        </div>

        {message && (
          <div
            className={`rounded-lg px-3.5 py-2.5 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-[#ff5252]/10 border border-[#ff5252]/20 text-[#ff5252]'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#6c5ce7] hover:bg-[#7c6ff7] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {loading ? 'Saving...' : 'Update Email'}
        </button>
      </form>
    </section>
  );
}

// ─── Change Password Form ────────────────────────────────────────────
function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Password updated successfully.',
      });
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <section className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a3a]">
        <Lock className="h-5 w-5 text-[#6c5ce7]" />
        <h2 className="text-base font-semibold text-white">Change Password</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label
            htmlFor="new-password"
            className="block text-xs font-medium text-[#666] mb-1.5"
          >
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3.5 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#6c5ce7] transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs font-medium text-[#666] mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3.5 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#6c5ce7] transition-colors"
          />
        </div>

        {message && (
          <div
            className={`rounded-lg px-3.5 py-2.5 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-[#ff5252]/10 border border-[#ff5252]/20 text-[#ff5252]'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#6c5ce7] hover:bg-[#7c6ff7] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {loading ? 'Saving...' : 'Update Password'}
        </button>
      </form>
    </section>
  );
}

// ─── Delete Account Section ──────────────────────────────────────────
function DeleteAccountSection() {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleDelete() {
    if (confirmText !== 'DELETE') return;

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'You have been signed out. Please contact support@thryv.fit to complete account deletion.',
      });
      setShowModal(false);
      setConfirmText('');
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-[#ff5252]/20 bg-[#15151f] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#ff5252]/20">
          <AlertTriangle className="h-5 w-5 text-[#ff5252]" />
          <h2 className="text-base font-semibold text-[#ff5252]">
            Danger Zone
          </h2>
        </div>

        <div className="p-5">
          <p className="text-sm text-[#a0a0b8] mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone. Your workout history, streaks, momentum, and all
            other data will be permanently removed.
          </p>

          {message && (
            <div
              className={`rounded-lg px-3.5 py-2.5 text-sm mb-4 ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-[#ff5252]/10 border border-[#ff5252]/20 text-[#ff5252]'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-lg border border-[#ff5252]/30 bg-[#ff5252]/10 hover:bg-[#ff5252]/20 px-4 py-2.5 text-sm font-semibold text-[#ff5252] transition-colors"
          >
            Delete my account
          </button>
        </div>
      </section>

      {/* ── Confirmation Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              setConfirmText('');
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-[#2a2a3a] bg-[#15151f] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setConfirmText('');
              }}
              className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ff5252]/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#ff5252]" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Delete Account
              </h3>
            </div>

            <p className="text-sm text-[#a0a0b8] mb-4">
              This will permanently delete your account and all data. This action
              is irreversible.
            </p>

            <p className="text-sm text-[#a0a0b8] mb-2">
              Type{' '}
              <span className="font-mono font-semibold text-[#ff5252]">
                DELETE
              </span>{' '}
              to confirm:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3.5 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#ff5252] transition-colors mb-4"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setConfirmText('');
                }}
                className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] hover:bg-[#1a1a2a] px-4 py-2.5 text-sm font-medium text-[#a0a0b8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || loading}
                className="flex-1 rounded-lg bg-[#ff5252] hover:bg-[#ff6b6b] disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────
export function AccountForms({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  return (
    <div className="space-y-6">
      <ChangeEmailForm currentEmail={userEmail} />
      <ChangePasswordForm />
      <DeleteAccountSection />
    </div>
  );
}
