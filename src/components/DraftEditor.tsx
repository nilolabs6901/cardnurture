'use client';

import { useState, useCallback, useRef } from 'react';
import { RefreshCw, Copy, Mail, Archive, Check, ChevronDown } from 'lucide-react';
import PersonalityBadge from './PersonalityBadge';

interface DraftEditorProps {
  draft: any;
  contact: any;
  onSave: (data: any) => void;
  onRegenerate: () => void;
}

function highlightPlaceholders(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (/^\[.+\]$/.test(part)) {
      return (
        <span
          key={i}
          className="text-[var(--accent-orange)] font-medium bg-[var(--accent-orange-muted)] rounded px-1"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DraftEditor({
  draft,
  contact,
  onSave,
  onRegenerate,
}: DraftEditorProps) {
  const [subject, setSubject] = useState(draft.subject || '');
  const [body, setBody] = useState(draft.body || '');
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMailMenu, setShowMailMenu] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const autoSave = useCallback(
    (updatedSubject?: string, updatedBody?: string) => {
      onSave({
        subject: updatedSubject ?? subject,
        body: updatedBody ?? body,
      });
    },
    [onSave, subject, body]
  );

  const handleSubjectBlur = () => {
    autoSave(subject, undefined);
  };

  const handleBodyBlur = () => {
    autoSave(undefined, body);
  };

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  };

  const handleOpenOutlook = () => {
    const to = contact?.email || '';
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setShowMailMenu(false);
  };

  const handleOpenGmail = () => {
    const to = contact?.email || '';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    setShowMailMenu(false);
  };

  const handleArchive = () => {
    onSave({ subject, body, status: 'archived' });
  };

  return (
    <div className="space-y-4">
      {/* Personality Badge */}
      {draft.personalityType && (
        <div className="flex items-center gap-2">
          <PersonalityBadge type={draft.personalityType} size="sm" />
          <span className="text-xs text-[var(--text-tertiary)]">
            tailored tone
          </span>
        </div>
      )}

      {/* Subject */}
      <input
        ref={subjectRef}
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onBlur={handleSubjectBlur}
        placeholder="Email subject..."
        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 w-full text-lg font-semibold"
      />

      {/* Body Textarea */}
      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={handleBodyBlur}
        placeholder="Email body..."
        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl px-4 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 w-full min-h-[300px] leading-relaxed resize-y"
      />

      {/* Preview Toggle + Panel */}
      <div className="space-y-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>

        {showPreview && (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-fade-in-up">
            <p className="text-xs text-[var(--text-tertiary)] mb-2 font-medium uppercase tracking-wider">
              Preview
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              {subject || 'No subject'}
            </p>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {highlightPlaceholders(body)}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - sticky on mobile, inline on desktop */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-t border-[var(--border-subtle)] md:static md:p-0 md:bg-transparent md:backdrop-blur-none md:border-t-0 z-40">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] shrink-0 border border-[var(--border-subtle)]"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] shrink-0 border border-[var(--border-subtle)]"
          >
            {isCopied ? <Check size={16} className="text-[var(--status-success)]" /> : <Copy size={16} />}
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Open In (Outlook / Gmail) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMailMenu(!showMailMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <Mail size={16} />
              <span className="hidden sm:inline">Open In</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showMailMenu ? 'rotate-180' : ''}`} />
            </button>
            {showMailMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMailMenu(false)} />
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-fade-in-up">
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

          {/* Archive */}
          <button
            onClick={handleArchive}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] shrink-0 ml-auto"
          >
            <Archive size={16} />
            <span className="hidden sm:inline">Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
}
