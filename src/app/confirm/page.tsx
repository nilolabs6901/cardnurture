'use client';

import { useState, useEffect, useRef } from 'react';
import { missingLeadFields } from '@/lib/leadFields';
import { linkedInTarget } from '@/lib/linkedin';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Search, Linkedin } from 'lucide-react';
import PersonalityCard from '@/components/PersonalityCard';
import ConfidenceField from '@/components/ConfidenceField';
import { ACTIVE_SCAN_ID, loadScan, removeScan, saveScan } from '@/lib/scan-store';
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
  // Off by default. Most cards at a show are not deals, and a registration that
  // happened because a checkbox was already ticked is worse than one that did not
  // happen at all: it emails the rep, starts a six month clock, and blocks the real
  // registration later with a duplicate.
  const [registerAsDeal, setRegisterAsDeal] = useState(false);
  const [dealNotice, setDealNotice] = useState('');
  const [dealAppReady, setDealAppReady] = useState(false);
  // Held as a string, not a number. A number-typed state forces a value at every
  // keystroke, so clearing the box to type "10" snaps it back to 0 or NaN and the
  // field fights you. The string holds "" while you retype and is validated on use.
  //
  // 3 is Kenny's most-used cadence in the tracker (62 of 158 leads).
  const [followUpDaysInput, setFollowUpDaysInput] = useState('3');

  // Where you met and what you talked about. The two things no amount of
  // research can supply, and the two the email needs most. metAt persists in the
  // browser because every card at one show comes from the same place — you type
  // it once on the first card of the day, not thirty times.
  const [metAt, setMetAt] = useState('');
  const [metNote, setMetNote] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cardnurture_met_at');
      if (saved) setMetAt(saved);
    } catch {
      // Private browsing or storage disabled; typing it each time still works.
    }
  }, []);

  useEffect(() => {
    fetch('/api/leads/push')
      .then((r) => r.json())
      .then((d) => setDealAppReady(Boolean(d.configured)))
      .catch(() => setDealAppReady(false));
  }, []);
  const [mounted, setMounted] = useState(false);
  const savingRef = useRef(false);

  // Read sessionStorage first, then recover from the durable scan store after mobile suspension.
  useEffect(() => {
    let active = true;

    async function restoreScan() {
      let parsed: ParseResult | null = null;
      try {
        const stored = sessionStorage.getItem('cardnurture_ocr_result');
        if (stored) parsed = JSON.parse(stored) as ParseResult;
      } catch {
        parsed = null;
      }

      const persisted = await loadScan();
      if (!parsed && persisted?.kind === 'single' && persisted.status === 'ready' && persisted.result) {
        parsed = persisted.result;
        try {
          sessionStorage.setItem('cardnurture_ocr_result', JSON.stringify(parsed));
        } catch {
          // The durable record remains available for the next mount.
        }
      }

      if (!active || !parsed) {
        if (active) router.push('/upload');
        return;
      }

      setFields(parsed.fields);
      setConfidence(parsed.confidence);
      setRawText(parsed.rawText);
      setMounted(true);

      if (!persisted || persisted.kind !== 'single') {
        const now = Date.now();
        await saveScan({
          id: ACTIVE_SCAN_ID,
          kind: 'single',
          status: 'ready',
          result: parsed,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    void restoreScan();
    return () => {
      active = false;
    };
  }, [router]);

  // Persist edits as the user reviews fields, not only after OCR completes.
  useEffect(() => {
    if (!mounted || savingRef.current) return;

    void loadScan().then((persisted) => {
      if (!persisted || persisted.kind !== 'single' || savingRef.current) return;
      void saveScan({
        ...persisted,
        status: 'ready',
        result: { rawText, fields, confidence },
        updatedAt: Date.now(),
      });
    });
  }, [confidence, fields, mounted, rawText]);

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

  // The tracker requires an interval of at least 1 day and rejects anything else,
  // so it is validated here rather than discovered as a 400 after the contact saved.
  const followUpDays = Number.parseInt(followUpDaysInput, 10);
  const followUpDaysValid = Number.isFinite(followUpDays) && followUpDays >= 1 && followUpDays <= 365;
  const followUpDaysError =
    followUpDaysInput.trim() === ''
      ? 'Enter a number of days.'
      : !followUpDaysValid
        ? 'Must be between 1 and 365 days.'
        : '';

  // Set once the contact row exists, so acknowledging a deal notice and pressing
  // Save again advances to the draft instead of POSTing the same card twice.
  const savedDraftRef = useRef<string | null>(null);

  async function handleSave() {
    if (registerAsDeal && !followUpDaysValid) {
      setSaveError(followUpDaysError);
      return;
    }

    if (!fields.name.trim()) {
      setSaveError('Name is required.');
      return;
    }

    setIsSaving(true);
    savingRef.current = true;
    setSaveError('');

    // Already saved on a previous press; just finish the journey.
    if (savedDraftRef.current) {
      await removeScan();
      setMounted(false);
      savingRef.current = false;
      router.push(`/drafts/${savedDraftRef.current}`);
      return;
    }

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
        metAt: metAt.trim() || null,
        metNote: metNote.trim() || null,
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
      savedDraftRef.current = data.draftId;

      // Remember the venue for the next card. The note is per-person and is not.
      try {
        if (metAt.trim()) localStorage.setItem('cardnurture_met_at', metAt.trim());
      } catch {
        // Not being able to remember it is a minor annoyance, not a failure.
      }

      // Only now, with the contact durably saved. The card is the irreplaceable
      // thing here; a deal can always be registered later from the contact record.
      //
      // Anything other than a clean registration HOLDS the page. This screen
      // redirects to the draft on success, so a notice set here would be unmounted
      // before it painted -- meaning a failed registration would look identical to
      // a successful one. At a trade show that silence is the whole cost: the deal
      // Kenny believes is protected is not, and he finds out when a colleague
      // registers it first.
      if (registerAsDeal && followUpDaysValid && fields.company.trim()) {
        let notice = '';
        try {
          const dealRes = await fetch('/api/leads/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: fields.company.trim(),
              contactName: fields.name.trim(),
              contactPhone: fields.phone.trim(),
              contactEmail: fields.email.trim(),
              followUpIntervalDays: followUpDays,
            }),
          });
          const deal = await dealRes.json();
          if (deal.status !== 'created') notice = deal.message;
        } catch {
          notice = 'Contact saved, but the lead tracker could not be reached.';
        }
        if (notice) {
          setDealNotice(notice);
          setRegisterAsDeal(false); // so pressing Save again does not retry blindly
          setIsSaving(false);
          savingRef.current = false;
          return; // contact is saved; the user acknowledges and presses Save to move on
        }
      }

      try {
        sessionStorage.removeItem('cardnurture_ocr_result');
      } catch {
        // Continue; the durable record is removed below.
      }
      await removeScan();
      setMounted(false);
      savingRef.current = false;
      router.push(`/drafts/${data.draftId}`);
    } catch (err) {
      savingRef.current = false;
      setSaveError(err instanceof Error ? err.message : 'Failed to save contact.');
      setIsSaving(false);
    }
  }

  if (!mounted) {
    return null;
  }

  const linkedIn = linkedInTarget({
    name: fields.name,
    company: fields.company,
    rawOcrText: rawText,
  });

  const leadMissing = missingLeadFields({
    companyName: fields.company,
    contactName: fields.name,
    contactPhone: fields.phone,
    contactEmail: fields.email,
  });

  return (
    <div className="animate-fade-in-up max-w-lg mx-auto px-4 pt-4 pb-action-bar">
      {/* Back button */}
      <button
        onClick={() => router.push('/upload')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 min-h-[44px] active:scale-[0.98]"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {dealNotice && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {dealNotice}
        </div>
      )}

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

      {/* The two facts research cannot supply. Typed while the conversation is
          still fresh, because the alternative is an email that reminds somebody
          of a chat that never happened. */}
      <div className="mt-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4">
        <h2 className="font-[var(--font-space-grotesk)] text-base font-bold text-[var(--text-primary)]">
          For the follow-up email
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Both optional. Left blank, the email won&apos;t claim you met anywhere or
          talked about anything.
        </p>

        <label className="block mt-3">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Where you met — remembered for the next card
          </span>
          <input
            value={metAt}
            onChange={(e) => setMetAt(e.target.value)}
            placeholder="the Combilift booth at MODEX"
            className="mt-1 w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] transition-all duration-200"
          />
        </label>

        <label className="block mt-3">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            What you talked about
          </span>
          <textarea
            value={metNote}
            onChange={(e) => setMetNote(e.target.value)}
            rows={2}
            placeholder="running six branches, struggling to get quotes back same day"
            className="mt-1 w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] transition-all duration-200 resize-none"
          />
        </label>
      </div>

      {/* Connect on LinkedIn while the person is still in front of you. Opens the
          LinkedIn app on a phone rather than the browser, since iOS treats these
          as universal links. target=_blank so the card being reviewed is not lost
          to a navigation -- coming back to a wiped form mid-booth is the failure
          this whole screen exists to avoid. */}
      {linkedIn && (
        <a
          href={linkedIn.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-xl min-h-[44px] transition-all duration-150 active:scale-[0.98]"
        >
          <Linkedin size={18} />
          {linkedIn.label}
        </a>
      )}
      {linkedIn?.kind === 'search' && (
        <p className="mt-2 text-xs text-[var(--text-secondary)] text-center">
          The card had no LinkedIn address, so this searches their name and company.
        </p>
      )}

      {/* Add to the lead tracker. A trade show yields a stack of cards and only
          some are leads worth chasing, so this is a deliberate act per card and
          never a default. The tracker refuses a lead without all four fields, so
          the control says which one is missing rather than failing on Save. */}
      {dealAppReady && (
        <div className="mt-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={registerAsDeal}
              disabled={leadMissing.length > 0}
              onChange={(e) => setRegisterAsDeal(e.target.checked)}
              className="mt-0.5 w-5 h-5 shrink-0 rounded accent-[var(--accent-orange)] disabled:opacity-40"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--text-primary)]">
                Add to lead tracker
              </span>
              <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
                {leadMissing.length > 0
                  ? `Needs a ${leadMissing.join(', ')} above first.`
                  : 'Creates a follow-up reminder under your name in the deal app.'}
              </span>
            </span>
          </label>

          {registerAsDeal && leadMissing.length === 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="followup-days" className="text-xs text-[var(--text-secondary)]">
                  Follow up every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="followup-days"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    value={followUpDaysInput}
                    onChange={(e) => setFollowUpDaysInput(e.target.value)}
                    className="w-20 text-center bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] min-h-[44px] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">days</span>
                </div>
              </div>

              {/* Kenny's four most-used cadences, kept as one-tap shortcuts. */}
              <div className="flex gap-2 mt-2 justify-end">
                {[2, 3, 7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFollowUpDaysInput(String(d))}
                    className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] transition-all duration-150 active:scale-95 ${
                      followUpDaysInput === String(d)
                        ? 'bg-[var(--accent-orange)] text-white font-semibold'
                        : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {followUpDaysError && (
                <p className="mt-2 text-xs text-[var(--status-error)] text-right">
                  {followUpDaysError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <p className="mt-4 text-sm text-[var(--status-error)] text-center">{saveError}</p>
      )}

      {/* Save Contact. Docked above the bottom nav on mobile -- at bottom-0 it
          sits under the nav (z-50) and is neither visible nor tappable. */}
      <div className="fixed action-bar-above-nav left-0 right-0 p-4 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-t border-[var(--border-subtle)] md:static md:border-t-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:mt-6 z-40">
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
            dealNotice
              ? 'Continue'
              : registerAsDeal && leadMissing.length === 0
                ? 'Save & Add Lead'
                : 'Save Contact'
          )}
        </button>
      </div>
    </div>
  );
}
