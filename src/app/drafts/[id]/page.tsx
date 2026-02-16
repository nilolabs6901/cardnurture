'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  ExternalLink,
  Send,
  Archive,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import PersonalityBadge from '@/components/PersonalityBadge';
import StatusBadge from '@/components/StatusBadge';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`bg-[var(--bg-elevated)] rounded-xl animate-pulse ${className}`}
    />
  );
}

function DraftSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-5 w-48" />
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-64 w-full rounded-2xl" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-11 w-28" />
        <SkeletonBlock className="h-11 w-28" />
      </div>
    </div>
  );
}

function highlightPlaceholders(text: string): string {
  return text.replace(
    /\[([^\]]+)\]/g,
    '<span class="bg-orange-500/20 text-orange-400 px-1 rounded font-medium">[$1]</span>'
  );
}

export default function DraftEditorPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showMailMenu, setShowMailMenu] = useState(false);

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  // Fetch draft
  useEffect(() => {
    async function fetchDraft() {
      try {
        const res = await fetch(`/api/drafts/${draftId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load draft');
        }
        const data = await res.json();
        setDraft(data);
        setSubject(data.subject || '');
        setBody(data.body || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load draft');
      } finally {
        setLoading(false);
      }
    }
    fetchDraft();
  }, [draftId]);

  // Auto-save on blur
  const handleAutoSave = useCallback(
    async (field: 'subject' | 'body', value: string) => {
      if (!draft) return;

      // Skip if unchanged
      if (field === 'subject' && value === draft.subject) return;
      if (field === 'body' && value === draft.body) return;

      try {
        const res = await fetch(`/api/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        if (res.ok) {
          const updated = await res.json();
          setDraft((prev: any) => ({ ...prev, ...updated }));
          showToast('Saved');
        }
      } catch {
        showToast('Failed to save', 'error');
      }
    },
    [draft, draftId, showToast]
  );

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      const text = subject + '\n\n' + body;
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [subject, body, showToast]);

  // Open in mail client
  const handleOpenOutlook = useCallback(() => {
    const to = draft?.contact?.email || '';
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(outlookUrl, '_blank');
    setShowMailMenu(false);
  }, [draft, subject, body]);

  const handleOpenGmail = useCallback(() => {
    const to = draft?.contact?.email || '';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    setShowMailMenu(false);
  }, [draft, subject, body]);

  // Send
  const handleSend = useCallback(async () => {
    if (!draft?.contact?.email) {
      showToast('No email address for this contact', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      setDraft((prev: any) => ({ ...prev, status: 'sent' }));
      showToast('Email sent');
    } catch (err: any) {
      showToast(err.message || 'Failed to send email', 'error');
    } finally {
      setIsSending(false);
    }
  }, [draft, draftId, showToast]);

  // Archive
  const handleArchive = useCallback(async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (res.ok) {
        setDraft((prev: any) => ({ ...prev, status: 'archived' }));
        showToast('Draft archived');
      }
    } catch {
      showToast('Failed to archive', 'error');
    } finally {
      setIsArchiving(false);
    }
  }, [draftId, showToast]);

  // Regenerate
  const handleRegenerate = useCallback(() => {
    const confirmed = window.confirm(
      'Regeneration requires re-saving the contact. Would you like to go to the contact page to trigger a new draft?'
    );
    if (confirmed && draft?.contact?.id) {
      router.push(`/contacts/${draft.contact.id}`);
    }
  }, [draft, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in-up">
        <DraftSkeleton />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in-up">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-[0.98] min-h-[44px] mb-4"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center">
          <p className="text-[var(--status-error)] text-sm">
            {error || 'Draft not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 md:pb-6 animate-fade-in-up">
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slide-down px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-[var(--status-success)] text-white'
                : 'bg-[var(--status-error)] text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-[0.98] min-h-[44px] mb-4"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Contact info + personality */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {draft.contact?.personalityType && (
          <PersonalityBadge type={draft.contact.personalityType} />
        )}
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>{draft.contact?.name || 'Unknown contact'}</span>
          {draft.contact?.company && (
            <>
              <span className="text-[var(--text-tertiary)]">&middot;</span>
              <span className="text-[var(--text-tertiary)]">
                {draft.contact.company}
              </span>
            </>
          )}
        </div>
        <StatusBadge status={draft.status} type="draft" />
      </div>

      {/* Subject input */}
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onBlur={() => handleAutoSave('subject', subject)}
        placeholder="Email subject..."
        className="w-full bg-[var(--bg-elevated)] rounded-xl px-4 py-3 text-lg font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] transition-all duration-200 mb-4"
      />

      {/* Body: mobile = textarea only, desktop = side-by-side */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Editor */}
        <div className="flex-1 md:w-[60%]">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={() => handleAutoSave('body', body)}
            placeholder="Write your email..."
            className="w-full min-h-[300px] bg-[var(--bg-elevated)] rounded-2xl p-4 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border border-[var(--border-subtle)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] transition-all duration-200 resize-y leading-relaxed text-sm"
          />
        </div>

        {/* Live preview - desktop only */}
        <div className="hidden md:block md:w-[40%]">
          <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 min-h-[300px]">
            <div className="border-b border-gray-200 pb-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">Subject</p>
              <p className="font-semibold text-gray-900 text-base">
                {subject || 'No subject'}
              </p>
              {draft.contact?.email && (
                <p className="text-xs text-gray-400 mt-1">
                  To: {draft.contact.email}
                </p>
              )}
            </div>
            <div
              className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: highlightPlaceholders(body || 'No content yet...'),
              }}
            />
          </div>
        </div>
      </div>

      {/* Desktop action buttons */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
        >
          <RefreshCw size={16} />
          Regenerate
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
        >
          <Copy size={16} />
          Copy
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMailMenu(!showMailMenu)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px]"
          >
            <ExternalLink size={16} />
            Open In
            <ChevronDown size={14} className={`transition-transform duration-200 ${showMailMenu ? 'rotate-180' : ''}`} />
          </button>
          {showMailMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMailMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-fade-in-up">
                <button
                  onClick={handleOpenOutlook}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left min-h-[44px]"
                >
                  <span className="text-base">📧</span>
                  Outlook
                </button>
                <button
                  onClick={handleOpenGmail}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left min-h-[44px] border-t border-[var(--border-subtle)]"
                >
                  <span className="text-base">✉️</span>
                  Gmail
                </button>
              </div>
            </>
          )}
        </div>

        {draft.contact?.email && draft.status !== 'sent' && (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {isSending ? 'Sending...' : 'Send'}
          </button>
        )}

        {draft.status !== 'archived' && (
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50 ml-auto"
          >
            {isArchiving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Archive size={16} />
            )}
            Archive
          </button>
        )}
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] px-4 py-3 pb-safe">
        <div className="flex items-center justify-around gap-1">
          <button
            onClick={handleRegenerate}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px]"
          >
            <RefreshCw size={20} />
            <span className="text-[10px] font-medium">Regen</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px]"
          >
            <Copy size={20} />
            <span className="text-[10px] font-medium">Copy</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMailMenu(!showMailMenu)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <ExternalLink size={20} />
              <span className="text-[10px] font-medium">Open In</span>
            </button>
            {showMailMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMailMenu(false)} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-fade-in-up">
                  <button
                    onClick={handleOpenOutlook}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left min-h-[44px]"
                  >
                    <span className="text-base">📧</span>
                    Outlook
                  </button>
                  <button
                    onClick={handleOpenGmail}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left min-h-[44px] border-t border-[var(--border-subtle)]"
                  >
                    <span className="text-base">✉️</span>
                    Gmail
                  </button>
                </div>
              </>
            )}
          </div>

          {draft.contact?.email && draft.status !== 'sent' && (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[var(--accent-orange)] hover:bg-[var(--accent-orange-muted)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              <span className="text-[10px] font-medium">
                {isSending ? 'Sending' : 'Send'}
              </span>
            </button>
          )}

          {draft.status !== 'archived' && (
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] disabled:opacity-50"
            >
              {isArchiving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Archive size={20} />
              )}
              <span className="text-[10px] font-medium">Archive</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
