'use client';

import { useState } from 'react';
import { NURTURE_TOPICS } from '@/types';

interface NurtureSettingsProps {
  contactId: string;
  enabled: boolean;
  interval: number;
  topic: string;
  onUpdate: (data: any) => void;
}

export default function NurtureSettings({
  contactId,
  enabled: initialEnabled,
  interval,
  topic: initialTopic,
  onUpdate,
}: NurtureSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [topic, setTopic] = useState(initialTopic);
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async (updates: { nurtureEnabled?: boolean; nurtureTopic?: string }) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data);
      }
    } catch {
      // Revert on error
      if (updates.nurtureEnabled !== undefined) {
        setEnabled(!updates.nurtureEnabled);
      }
      if (updates.nurtureTopic !== undefined) {
        setTopic(initialTopic);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    saveSettings({ nurtureEnabled: newValue });
  };

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    saveSettings({ nurtureTopic: newTopic });
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Nurture Emails
          </span>
          <p className="text-xs text-[var(--text-tertiary)]">
            Every {interval} days
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={isSaving}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50 ${
            enabled ? 'bg-[var(--accent-orange)]' : 'bg-[var(--bg-elevated)]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Topic Dropdown */}
      {enabled && (
        <div className="space-y-1.5 animate-fade-in-up">
          <label className="block text-xs text-[var(--text-tertiary)]">
            Nurture Topic
          </label>
          <select
            value={topic}
            onChange={(e) => handleTopicChange(e.target.value)}
            disabled={isSaving}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all duration-200 w-full appearance-none cursor-pointer disabled:opacity-50"
          >
            {NURTURE_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
