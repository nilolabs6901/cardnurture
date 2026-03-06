'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  User,
  Brain,
  Target,
  Bell,
  Mail,
  Calendar,
  FileText,
  Save,
  Loader2,
  Plus,
  Handshake,
  Package,
  Send,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { COMBILIFT_MODEL_OPTIONS, DRAFT_TEMPLATE_TYPES } from '@/lib/email-templates';
import PersonalityBadge from '@/components/PersonalityBadge';
import PersonalityCard from '@/components/PersonalityCard';
import ProspectPipeline from '@/components/ProspectPipeline';
import NurtureSettings from '@/components/NurtureSettings';
import StatusBadge from '@/components/StatusBadge';

const INDUSTRY_OPTIONS = [
  'Lumber & Building Materials',
  'Cold Storage & 3PL',
  'Precast Concrete & Construction',
  'Steel & Metals Distribution',
  'Beverage & Food Distribution',
  'Marine & Boatbuilding',
  'Aerospace Manufacturing',
  'Solar Panel Distribution',
  'Distribution & Warehousing',
  'Manufacturing',
  'Other',
];

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

function ContactDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-6 w-6 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
      </div>
      {/* Sections skeleton */}
      <SkeletonBlock className="h-64 w-full" />
      <SkeletonBlock className="h-48 w-full" />
      <SkeletonBlock className="h-48 w-full" />
    </div>
  );
}

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-between w-full p-5 text-left transition-all duration-150 active:scale-[0.98] min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-[var(--text-tertiary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {/* Desktop: always visible header */}
      <div className="hidden md:flex items-center gap-2 p-5 pb-0">
        {icon}
        <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </h3>
      </div>
      {/* Mobile: collapsible content */}
      <div
        className={`md:block ${isOpen ? 'block' : 'hidden'}`}
      >
        <div className="p-5 pt-3">{children}</div>
      </div>
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    industryVertical: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isReresearching, setIsReresearching] = useState(false);
  const [isResearchingProspects, setIsResearchingProspects] = useState(false);

  // New Draft modal state
  const [showNewDraftModal, setShowNewDraftModal] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('intro-meeting');
  const [selectedModel, setSelectedModel] = useState<string>(COMBILIFT_MODEL_OPTIONS[0]?.value || 'C-Series');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useState(0);

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

  // Fetch contact
  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load contact');
      }
      const data = await res.json();
      setContact(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        address: data.address || '',
        industryVertical: data.industryVertical || '',
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  // Save contact info
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const updated = await res.json();
      setContact((prev: any) => ({ ...prev, ...updated }));
      showToast('Contact saved');
    } catch (err: any) {
      showToast(err.message || 'Failed to save contact', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Personality override
  const handlePersonalityOverride = async (newType: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalityType: newType }),
      });
      if (res.ok) {
        const updated = await res.json();
        setContact((prev: any) => ({ ...prev, ...updated }));
        showToast(`Personality set to ${newType}`);
      }
    } catch {
      showToast('Failed to update personality', 'error');
    }
  };

  // Re-research personality
  const handleReresearch = async () => {
    setIsReresearching(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/reresearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Research failed');
      }
      const result = await res.json();
      setContact((prev: any) => ({
        ...prev,
        personalityType: result.personalityType,
        personalityConfidence: result.personalityConfidence,
        personalitySummary: result.personalitySummary,
        researchSnippets: result.researchSnippets,
        researchedAt: result.researchedAt,
      }));
      showToast('Personality re-researched');
    } catch (err: any) {
      showToast(err.message || 'Failed to re-research', 'error');
    } finally {
      setIsReresearching(false);
    }
  };

  // Research prospects
  const handleResearchProspects = async () => {
    setIsResearchingProspects(true);
    try {
      const res = await fetch('/api/prospects/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Research failed');
      }
      const newProspects = await res.json();
      setContact((prev: any) => ({
        ...prev,
        prospects: [...(prev.prospects || []), ...newProspects],
      }));
      showToast(`Found ${newProspects.length} new prospects`);
    } catch (err: any) {
      showToast(err.message || 'Failed to research prospects', 'error');
    } finally {
      setIsResearchingProspects(false);
    }
  };

  // Nurture update handler
  const handleNurtureUpdate = (updatedContact: any) => {
    setContact((prev: any) => ({ ...prev, ...updatedContact }));
    showToast('Nurture settings updated');
  };

  // Generate new draft
  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const payload: any = { templateType: selectedTemplateType };
      if (selectedTemplateType === 'combilift-model') {
        payload.combiliftModel = selectedModel;
      }

      const res = await fetch(`/api/contacts/${contactId}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate draft');
      }

      const result = await res.json();
      showToast('Draft created!');
      setShowNewDraftModal(false);

      // Navigate to the new draft editor
      router.push(`/drafts/${result.draftId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate draft', 'error');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in-up">
        <ContactDetailSkeleton />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in-up">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 active:scale-[0.98] min-h-[44px] mb-4"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center">
          <p className="text-[var(--status-error)] text-sm">
            {error || 'Contact not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-36 md:pb-6 animate-fade-in-up">
      {/* Mobile sticky Save button — positioned above BottomNav including safe area */}
      <div
        className="md:hidden fixed left-0 right-0 z-[45] bg-[var(--bg-surface)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] px-4 py-3"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50 shadow-lg"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

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

      {/* Contact Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-[var(--font-space-grotesk)] text-xl font-bold text-[var(--text-primary)] tracking-tight truncate">
            {contact.name}
          </h1>
          {contact.company && (
            <p className="text-[var(--text-secondary)] text-sm mt-0.5 truncate">
              {contact.company}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PersonalityBadge type={contact.personalityType} />
            <span className="text-xs text-[var(--text-tertiary)]">
              Added{' '}
              {format(new Date(contact.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Section 1: Contact Info */}
        <AccordionSection
          title="Contact Info"
          icon={<User size={18} className="text-[var(--text-secondary)]" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-secondary)] font-medium">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
                  placeholder="Full name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-secondary)] font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
                  placeholder="email@company.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-secondary)] font-medium">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-secondary)] font-medium">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
                  placeholder="Company name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-secondary)] font-medium">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200 w-full focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)]"
                  placeholder="City, State"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-secondary)] font-medium">
                  Industry Vertical
                </label>
                <select
                  value={formData.industryVertical}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      industryVertical: e.target.value,
                    }))
                  }
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 w-full appearance-none cursor-pointer"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="hidden md:flex items-center justify-center gap-2 w-auto px-6 py-3 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </AccordionSection>

        {/* Section 2: Personality Profile */}
        <AccordionSection
          title="Personality Profile"
          icon={<Brain size={18} className="text-[var(--text-secondary)]" />}
          defaultOpen={false}
        >
          <PersonalityCard
            personalityType={contact.personalityType}
            confidence={contact.personalityConfidence}
            summary={contact.personalitySummary}
            onOverride={handlePersonalityOverride}
            onReresearch={handleReresearch}
            isReresearching={isReresearching}
          />
        </AccordionSection>

        {/* Section 3: Prospect Pipeline */}
        <AccordionSection
          title="Prospect Pipeline"
          icon={<Target size={18} className="text-[var(--text-secondary)]" />}
          defaultOpen={false}
        >
          <ProspectPipeline
            prospects={contact.prospects || []}
            contactId={contactId}
            isResearching={isResearchingProspects}
            onResearch={handleResearchProspects}
          />
        </AccordionSection>

        {/* Section 4: Nurture Settings */}
        <AccordionSection
          title="Nurture Settings"
          icon={<Bell size={18} className="text-[var(--text-secondary)]" />}
          defaultOpen={false}
        >
          <NurtureSettings
            contactId={contactId}
            enabled={contact.nurtureEnabled}
            interval={contact.nurtureInterval}
            topic={contact.nurtureTopic}
            onUpdate={handleNurtureUpdate}
          />
        </AccordionSection>

        {/* Section 5: Draft History */}
        <AccordionSection
          title="Draft History"
          icon={
            <FileText size={18} className="text-[var(--text-secondary)]" />
          }
          defaultOpen={false}
        >
          {/* New Draft button */}
          <div className="mb-4">
            <button
              onClick={() => setShowNewDraftModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-sm font-medium rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px]"
            >
              <Plus size={16} />
              New Draft
            </button>
          </div>

          {contact.emailDrafts && contact.emailDrafts.length > 0 ? (
            <>
              {/* Mobile: mini cards */}
              <div className="md:hidden space-y-2">
                {contact.emailDrafts.map((draft: any, index: number) => (
                  <button
                    key={draft.id}
                    onClick={() => router.push(`/drafts/${draft.id}`)}
                    className={`w-full text-left bg-[var(--bg-elevated)] rounded-xl p-3 border border-[var(--border-subtle)] hover:border-[var(--accent-orange)] transition-all duration-150 active:scale-[0.98] animate-fade-in-up stagger-${Math.min(
                      index + 1,
                      8
                    )}`}
                    style={{ animationFillMode: 'both' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {draft.type === 'follow-up' ? (
                        <Mail
                          size={14}
                          className="text-[var(--status-info)] shrink-0"
                        />
                      ) : (
                        <Calendar
                          size={14}
                          className="text-[var(--accent-orange)] shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">
                        {draft.subject}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={draft.status} type="draft" />
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {format(new Date(draft.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: compact table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <th className="text-left pb-2 font-medium text-[var(--text-tertiary)] text-xs">
                        Type
                      </th>
                      <th className="text-left pb-2 font-medium text-[var(--text-tertiary)] text-xs">
                        Subject
                      </th>
                      <th className="text-left pb-2 font-medium text-[var(--text-tertiary)] text-xs">
                        Status
                      </th>
                      <th className="text-right pb-2 font-medium text-[var(--text-tertiary)] text-xs">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contact.emailDrafts.map((draft: any) => (
                      <tr
                        key={draft.id}
                        onClick={() => router.push(`/drafts/${draft.id}`)}
                        className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors duration-100"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            {draft.type === 'follow-up' ? (
                              <Mail
                                size={14}
                                className="text-[var(--status-info)]"
                              />
                            ) : (
                              <Calendar
                                size={14}
                                className="text-[var(--accent-orange)]"
                              />
                            )}
                            <span className="text-xs text-[var(--text-secondary)] capitalize">
                              {draft.type.replace('-', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-primary)] truncate max-w-[300px]">
                          {draft.subject}
                        </td>
                        <td className="py-2.5 pr-3">
                          <StatusBadge status={draft.status} type="draft" />
                        </td>
                        <td className="py-2.5 text-right text-[var(--text-tertiary)] text-xs whitespace-nowrap">
                          {format(
                            new Date(draft.createdAt),
                            'MMM d, yyyy'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                <FileText
                  size={20}
                  className="text-[var(--text-tertiary)]"
                />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                No drafts yet
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Click "New Draft" above to create one
              </p>
            </div>
          )}
        </AccordionSection>
      </div>

      {/* New Draft Modal */}
      {showNewDraftModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isGeneratingDraft && setShowNewDraftModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl w-full max-w-md mx-4 animate-fade-in-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Create New Draft
              </h3>
              <button
                onClick={() => !isGeneratingDraft && setShowNewDraftModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Template Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Email Type
                </label>
                <div className="space-y-2">
                  {DRAFT_TEMPLATE_TYPES.map((template) => (
                    <button
                      key={template.value}
                      onClick={() => setSelectedTemplateType(template.value)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 active:scale-[0.98] ${
                        selectedTemplateType === template.value
                          ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/10'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--text-tertiary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            selectedTemplateType === template.value
                              ? 'bg-[var(--accent-orange)] text-white'
                              : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)]'
                          }`}
                        >
                          {template.value === 'intro-meeting' && <Handshake size={18} />}
                          {template.value === 'combilift-model' && <Package size={18} />}
                          {template.value === 'follow-up' && <Send size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {template.label}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {template.description}
                          </p>
                        </div>
                        {/* Radio indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            selectedTemplateType === template.value
                              ? 'border-[var(--accent-orange)]'
                              : 'border-[var(--border-subtle)]'
                          }`}
                        >
                          {selectedTemplateType === template.value && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-orange)]" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Combilift Model Selector — only shown when combilift-model is selected */}
              {selectedTemplateType === 'combilift-model' && (
                <div className="space-y-2 animate-fade-in-up">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Select Combilift Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {COMBILIFT_MODEL_OPTIONS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                  {/* Model description */}
                  <p className="text-xs text-[var(--text-tertiary)] px-1">
                    {COMBILIFT_MODEL_OPTIONS.find((m) => m.value === selectedModel)?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-5 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => !isGeneratingDraft && setShowNewDraftModal(false)}
                disabled={isGeneratingDraft}
                className="flex-1 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateDraft}
                disabled={isGeneratingDraft}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] rounded-xl transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50"
              >
                {isGeneratingDraft ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
