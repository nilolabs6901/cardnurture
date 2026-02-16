'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import PersonalityCard from '@/components/PersonalityCard';
import ConfidenceField from '@/components/ConfidenceField';
import type { ParseResult, ParsedContact, ConfidenceLevel, PersonalityType, ResearchResult } from '@/types';

/* ─── ContactForm Component ─── */

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

/* ─── Confirm Page ─── */

export default function ConfirmPage() {
  const router = useRouter();

  const [fields, setFields] = useState<ParsedContact>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  });
  const [confidence, setConfidence] = useState<Record<keyof ParsedContact, ConfidenceLevel>>({
    name: 'none',
    email: 'none',
    phone: 'none',
    company: 'none',
    address: 'none',
  });
  const [rawText, setRawText] = useState('');

  const [personalityType, setPersonalityType] = useState<PersonalityType>('Balanced');
  const [personalityConfidence, setPersonalityConfidence] = useState<ConfidenceLevel>('none');
  const [personalitySummary, setPersonalitySummary] = useState<string | null>(null);
  const [researchSnippets, setResearchSnippets] = useState('');
  const [personalityLoading, setPersonalityLoading] = useState(false);
  const [isReresearching, setIsReresearching] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Read sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('cardnurture_ocr_result');
    if (!stored) {
      router.push('/upload');
      return;
    }

    try {
      const parsed: ParseResult = JSON.parse(stored);
      setFields(parsed.fields);
      setConfidence(parsed.confidence);
      setRawText(parsed.rawText);
      setMounted(true);
    } catch {
      router.push('/upload');
    }
  }, [router]);

  // Personality research — user-triggered (not automatic)
  // This lets the user verify/correct the parsed fields before researching
  const [hasResearched, setHasResearched] = useState(false);

  async function handleResearchPersonality() {
    if (!fields.name) return;
    setPersonalityLoading(true);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          company: fields.company || '',
          rawText,
        }),
      });

      const data: ResearchResult = await res.json();
      setPersonalityType(data.personalityType as PersonalityType);
      setPersonalityConfidence(data.confidence);
      setPersonalitySummary(data.summary);
      setResearchSnippets(data.researchSnippets || '');
      setHasResearched(true);
    } catch {
      setPersonalityType('Balanced');
      setPersonalityConfidence('none');
      setPersonalitySummary('Research could not be completed.');
    } finally {
      setPersonalityLoading(false);
    }
  }

  async function handleReresearch() {
    if (!fields.name) return;
    setIsReresearching(true);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          company: fields.company || '',
          rawText,
        }),
      });

      const data: ResearchResult = await res.json();
      setPersonalityType(data.personalityType as PersonalityType);
      setPersonalityConfidence(data.confidence);
      setPersonalitySummary(data.summary);
      setResearchSnippets(data.researchSnippets || '');
    } catch {
      // keep existing values
    } finally {
      setIsReresearching(false);
    }
  }

  function handlePersonalityOverride(type: string) {
    setPersonalityType(type as PersonalityType);
  }

  async function handleSave() {
    if (!fields.name.trim()) {
      setSaveError('Name is required.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          company: fields.company.trim(),
          address: fields.address.trim(),
          rawOcrText: rawText,
          personalityType,
          personalityConfidence,
          personalitySummary,
          researchSnippets,
          researchedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to save contact' }));
        throw new Error(data.error || 'Failed to save contact');
      }

      const data = await res.json();
      sessionStorage.removeItem('cardnurture_ocr_result');
      router.push(`/drafts/${data.draftId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save contact.');
      setIsSaving(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="animate-fade-in-up max-w-lg mx-auto px-4 pt-4 pb-28 md:pb-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/upload')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 min-h-[44px] active:scale-[0.98]"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Contact Form */}
      <div className="space-y-4">
        <ContactForm
          fields={fields}
          confidence={confidence}
          onChange={setFields}
        />

        {/* Personality Profile */}
        {hasResearched || personalityLoading ? (
          <PersonalityCard
            personalityType={personalityType}
            confidence={personalityConfidence}
            summary={personalitySummary}
            isLoading={personalityLoading}
            onOverride={handlePersonalityOverride}
            onReresearch={handleReresearch}
            isReresearching={isReresearching}
          />
        ) : (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5">
            <h2 className="font-[var(--font-space-grotesk)] text-lg font-bold text-[var(--text-primary)] mb-2">
              Personality Profile
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Verify the contact details above, then click below to analyze their personality type using their name, title, and company info.
            </p>
            <button
              onClick={handleResearchPersonality}
              disabled={!fields.name.trim()}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl min-h-[44px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={18} />
              Research Personality
            </button>
          </div>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <p className="mt-4 text-sm text-[var(--status-error)] text-center">{saveError}</p>
      )}

      {/* Save Contact -- fixed bottom on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-primary)]/90 backdrop-blur-sm border-t border-[var(--border-subtle)] pb-safe md:static md:border-t-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:mt-6 z-30">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Contact'
          )}
        </button>
      </div>
    </div>
  );
}
