'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreHorizontal, Flag, SkipForward, Save, CheckCircle, Loader2 } from 'lucide-react';
import PersonalityCard from '@/components/PersonalityCard';
import ConfidenceField from '@/components/ConfidenceField';
import type { ParseResult, ParsedContact, ConfidenceLevel, PersonalityType, ResearchResult } from '@/types';

/* ─── Types ─── */

interface ReviewCard {
  fields: ParsedContact;
  confidence: Record<keyof ParsedContact, ConfidenceLevel>;
  rawText: string;
  personalityType: PersonalityType;
  personalityConfidence: ConfidenceLevel;
  personalitySummary: string | null;
  researchSnippets: string;
  personalityLoading: boolean;
  disposition: 'pending' | 'saved' | 'skipped' | 'flagged';
}

/* ─── ContactForm (inline for review) ─── */

interface ContactFormProps {
  fields: ParsedContact;
  confidence: Record<keyof ParsedContact, ConfidenceLevel>;
  onChange: (fields: ParsedContact) => void;
}

function ContactForm({ fields, confidence, onChange }: ContactFormProps) {
  function handleFieldChange(key: keyof ParsedContact, value: string) {
    onChange({ ...fields, [key]: value });
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4">
      <h2 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)]">
        Contact Details
      </h2>
      <ConfidenceField
        label="Name"
        value={fields.name}
        confidence={confidence.name}
        onChange={(val) => handleFieldChange('name', val)}
      />
      <ConfidenceField
        label="Email"
        value={fields.email}
        confidence={confidence.email}
        onChange={(val) => handleFieldChange('email', val)}
      />
      <ConfidenceField
        label="Phone"
        value={fields.phone}
        confidence={confidence.phone}
        onChange={(val) => handleFieldChange('phone', val)}
      />
      <ConfidenceField
        label="Company"
        value={fields.company}
        confidence={confidence.company}
        onChange={(val) => handleFieldChange('company', val)}
      />
      <ConfidenceField
        label="Address"
        value={fields.address}
        confidence={confidence.address}
        onChange={(val) => handleFieldChange('address', val)}
      />
    </div>
  );
}

/* ─── Confirmation Dialog ─── */

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-6 max-w-sm w-full animate-fade-in-up">
        <p className="text-sm text-[var(--text-primary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] text-sm font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Summary Screen ─── */

interface SummaryScreenProps {
  saved: number;
  skipped: number;
  flagged: number;
}

function SummaryScreen({ saved, skipped, flagged }: SummaryScreenProps) {
  const router = useRouter();

  return (
    <div className="animate-fade-in-up max-w-lg mx-auto px-4 pt-8 pb-8 text-center">
      <CheckCircle size={48} className="text-[var(--status-success)] mx-auto mb-4" />
      <h2 className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)] mb-6">
        Review Complete
      </h2>

      {/* Stats */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="text-center">
          <p className="font-[var(--font-space-grotesk)] text-3xl font-bold text-[var(--status-success)]">
            {saved}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Saved</p>
        </div>
        <div className="text-center">
          <p className="font-[var(--font-space-grotesk)] text-3xl font-bold text-[var(--text-tertiary)]">
            {skipped}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Skipped</p>
        </div>
        <div className="text-center">
          <p className="font-[var(--font-space-grotesk)] text-3xl font-bold text-[var(--status-warning)]">
            {flagged}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Flagged</p>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <button
          onClick={() => router.push('/contacts')}
          className="w-full bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98]"
        >
          View saved contacts
        </button>
        {flagged > 0 && (
          <button
            onClick={() => router.push('/contacts?filter=needs-review')}
            className="w-full border border-[var(--status-warning)] text-[var(--status-warning)] hover:bg-yellow-500/10 font-medium rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98]"
          >
            Review flagged ({flagged})
          </button>
        )}
        <button
          onClick={() => router.push('/upload?scanned=1')}
          className="w-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] font-medium rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98]"
        >
          Upload more
        </button>
      </div>
    </div>
  );
}

/* ─── Review Page ─── */

export default function ReviewPage() {
  const router = useRouter();

  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [showSkipAll, setShowSkipAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const researchCacheRef = useRef<Map<string, ResearchResult>>(new Map());

  // Read sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('cardnurture_batch_results');
    if (!stored) {
      router.push('/upload');
      return;
    }

    try {
      const results: ParseResult[] = JSON.parse(stored);
      if (!Array.isArray(results) || results.length === 0) {
        router.push('/upload');
        return;
      }

      const reviewCards: ReviewCard[] = results.map((r) => ({
        fields: r.fields,
        confidence: r.confidence,
        rawText: r.rawText,
        personalityType: 'Balanced' as PersonalityType,
        personalityConfidence: 'none' as ConfidenceLevel,
        personalitySummary: null,
        researchSnippets: '',
        personalityLoading: false,
        disposition: 'pending' as const,
      }));

      setCards(reviewCards);
      setMounted(true);
    } catch {
      router.push('/upload');
    }
  }, [router]);

  // Fetch personality research for current + next 2 cards
  const fetchResearch = useCallback(
    async (index: number) => {
      const indicesToFetch = [index, index + 1, index + 2].filter(
        (i) => i < cards.length && cards[i].disposition === 'pending'
      );

      for (const i of indicesToFetch) {
        const card = cards[i];
        if (!card.fields.name || !card.fields.company) continue;

        const cacheKey = `${card.fields.name}|${card.fields.company}`;
        if (researchCacheRef.current.has(cacheKey)) {
          const cached = researchCacheRef.current.get(cacheKey)!;
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    personalityType: cached.personalityType as PersonalityType,
                    personalityConfidence: cached.confidence,
                    personalitySummary: cached.summary,
                    researchSnippets: cached.researchSnippets || '',
                    personalityLoading: false,
                  }
                : c
            )
          );
          continue;
        }

        // Mark as loading only for current index
        if (i === index) {
          setCards((prev) =>
            prev.map((c, idx) => (idx === i ? { ...c, personalityLoading: true } : c))
          );
        }

        try {
          const res = await fetch('/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: card.fields.name, company: card.fields.company }),
          });

          const data: ResearchResult = await res.json();
          researchCacheRef.current.set(cacheKey, data);

          setCards((prev) =>
            prev.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    personalityType: data.personalityType as PersonalityType,
                    personalityConfidence: data.confidence,
                    personalitySummary: data.summary,
                    researchSnippets: data.researchSnippets || '',
                    personalityLoading: false,
                  }
                : c
            )
          );
        } catch {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === i ? { ...c, personalityLoading: false } : c
            )
          );
        }
      }
    },
    [cards]
  );

  // Trigger research when currentIndex changes
  useEffect(() => {
    if (!mounted || cards.length === 0) return;
    fetchResearch(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showSummary || isSaving || isBulkSaving) return;

      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // Only trigger if not focused on an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        handleSaveAndNext();
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handleSkip();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, cards, showSummary, isSaving, isBulkSaving]);

  function updateCurrentCard(updates: Partial<ReviewCard>) {
    setCards((prev) =>
      prev.map((c, idx) => (idx === currentIndex ? { ...c, ...updates } : c))
    );
  }

  function advanceToNext() {
    // Find next pending card
    let nextIdx = currentIndex + 1;
    while (nextIdx < cards.length && cards[nextIdx].disposition !== 'pending') {
      nextIdx++;
    }

    if (nextIdx >= cards.length) {
      setShowSummary(true);
    } else {
      setCurrentIndex(nextIdx);
    }
  }

  async function saveCard(card: ReviewCard, needsReview: boolean = false): Promise<boolean> {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: card.fields.name.trim(),
          email: card.fields.email.trim(),
          phone: card.fields.phone.trim(),
          company: card.fields.company.trim(),
          address: card.fields.address.trim(),
          rawOcrText: card.rawText,
          personalityType: card.personalityType,
          personalityConfidence: card.personalityConfidence,
          personalitySummary: card.personalitySummary,
          researchSnippets: card.researchSnippets,
          researchedAt: new Date().toISOString(),
          needsReview,
        }),
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleSaveAndNext() {
    const card = cards[currentIndex];
    if (!card || card.disposition !== 'pending') return;
    if (!card.fields.name.trim()) return;

    setIsSaving(true);
    const success = await saveCard(card);

    if (success) {
      updateCurrentCard({ disposition: 'saved' });
      // Need to use setTimeout to let state update propagate
      setTimeout(() => {
        setIsSaving(false);
        advanceToNext();
      }, 0);
    } else {
      setIsSaving(false);
    }
  }

  function handleSkip() {
    updateCurrentCard({ disposition: 'skipped' });
    setTimeout(() => advanceToNext(), 0);
  }

  async function handleFlag() {
    const card = cards[currentIndex];
    if (!card || card.disposition !== 'pending') return;

    setIsSaving(true);
    const success = await saveCard(card, true);

    if (success) {
      updateCurrentCard({ disposition: 'flagged' });
      setTimeout(() => {
        setIsSaving(false);
        advanceToNext();
      }, 0);
    } else {
      setIsSaving(false);
    }
    setShowMore(false);
  }

  async function handleSaveAllRemaining() {
    setShowConfirmAll(false);
    setIsBulkSaving(true);

    const updatedCards = [...cards];
    for (let i = 0; i < updatedCards.length; i++) {
      if (updatedCards[i].disposition === 'pending' && updatedCards[i].fields.name.trim()) {
        const success = await saveCard(updatedCards[i]);
        updatedCards[i] = {
          ...updatedCards[i],
          disposition: success ? 'saved' : 'pending',
        };
        setCards([...updatedCards]);
      }
    }

    setIsBulkSaving(false);
    setShowSummary(true);
  }

  function handleSkipAllRemaining() {
    setShowSkipAll(false);
    setCards((prev) =>
      prev.map((c) => (c.disposition === 'pending' ? { ...c, disposition: 'skipped' } : c))
    );
    setShowSummary(true);
  }

  // Counts
  const savedCount = cards.filter((c) => c.disposition === 'saved').length;
  const skippedCount = cards.filter((c) => c.disposition === 'skipped').length;
  const flaggedCount = cards.filter((c) => c.disposition === 'flagged').length;
  const remainingCount = cards.filter((c) => c.disposition === 'pending').length;

  if (!mounted) return null;

  if (showSummary) {
    return <SummaryScreen saved={savedCount} skipped={skippedCount} flagged={flaggedCount} />;
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) {
    return <SummaryScreen saved={savedCount} skipped={skippedCount} flagged={flaggedCount} />;
  }

  const progress = cards.length > 0
    ? ((cards.length - remainingCount) / cards.length) * 100
    : 0;

  return (
    <>
      {/* Confirm dialogs */}
      {showConfirmAll && (
        <ConfirmDialog
          message={`Save all ${remainingCount} remaining card${remainingCount !== 1 ? 's' : ''}? They will be saved with their current details.`}
          onConfirm={handleSaveAllRemaining}
          onCancel={() => setShowConfirmAll(false)}
        />
      )}
      {showSkipAll && (
        <ConfirmDialog
          message={`Skip all ${remainingCount} remaining card${remainingCount !== 1 ? 's' : ''}? They will not be saved.`}
          onConfirm={handleSkipAllRemaining}
          onCancel={() => setShowSkipAll(false)}
        />
      )}

      {/* Bulk saving overlay */}
      {isBulkSaving && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <Loader2 size={32} className="text-[var(--accent-orange)] animate-spin" />
            <p className="text-sm text-[var(--text-primary)]">
              Saving remaining cards... ({savedCount}/{cards.length})
            </p>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pb-32 md:pb-8">
        {/* Progress bar */}
        <div className="sticky top-0 z-20 bg-[var(--bg-primary)] pt-2 pb-3">
          <div className="w-full h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[var(--accent-orange)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] active:scale-[0.98]"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <span className="text-xs text-[var(--text-secondary)]">
              Card {cards.length - remainingCount + 1} of {cards.length}
            </span>
          </div>
        </div>

        {/* Card content */}
        <div className="animate-fade-in-up space-y-4" key={currentIndex}>
          {/* Contact Form */}
          <ContactForm
            fields={currentCard.fields}
            confidence={currentCard.confidence}
            onChange={(fields) => updateCurrentCard({ fields })}
          />

          {/* Personality Card */}
          <PersonalityCard
            personalityType={currentCard.personalityType}
            confidence={currentCard.personalityConfidence}
            summary={currentCard.personalitySummary}
            isLoading={currentCard.personalityLoading}
            onOverride={(type) => updateCurrentCard({ personalityType: type as PersonalityType })}
          />
        </div>

        {/* Bottom action bar -- fixed on mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)]/90 backdrop-blur-sm border-t border-[var(--border-subtle)] p-4 pb-safe md:static md:border-t-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:mt-6 z-30">
          <div className="flex gap-3 max-w-lg mx-auto">
            {/* Skip */}
            <button
              onClick={handleSkip}
              disabled={isSaving}
              className="w-[40%] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] font-medium rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              Skip
            </button>

            {/* Save & Next */}
            <button
              onClick={handleSaveAndNext}
              disabled={isSaving || !currentCard.fields.name.trim()}
              className="w-[60%] bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Next'
              )}
            </button>
          </div>

          {/* More options */}
          <div className="max-w-lg mx-auto mt-2 flex justify-center relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors min-h-[44px] px-3 active:scale-[0.98]"
            >
              <MoreHorizontal size={16} />
              More
            </button>

            {/* Dropdown */}
            {showMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                <div className="absolute bottom-full mb-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-xl overflow-hidden z-50 animate-slide-up min-w-[220px]">
                  <button
                    onClick={handleFlag}
                    disabled={isSaving}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px]"
                  >
                    <Flag size={16} className="text-[var(--status-warning)]" />
                    Flag for Later
                  </button>
                  <button
                    onClick={() => {
                      setShowMore(false);
                      setShowConfirmAll(true);
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px] border-t border-[var(--border-subtle)]"
                  >
                    <Save size={16} className="text-[var(--status-success)]" />
                    Save All Remaining ({remainingCount})
                  </button>
                  <button
                    onClick={() => {
                      setShowMore(false);
                      setShowSkipAll(true);
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px] border-t border-[var(--border-subtle)]"
                  >
                    <SkipForward size={16} className="text-[var(--text-tertiary)]" />
                    Skip All Remaining
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
