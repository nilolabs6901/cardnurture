'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Clock3,
  Handshake,
  Loader2,
  Mail,
  Phone,
  Plus,
  StickyNote,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/activity';

type ActivityRecord = {
  id: string;
  type: ActivityType | string;
  channel: string;
  outcome: string;
  notes: string;
  occurredAt: string;
  nextActionAt: string | null;
  createdAt: string;
};

type ActivityAction = Exclude<ActivityType, 'follow-up'> | 'follow-up';

type ActivityForm = {
  outcome: string;
  notes: string;
  occurredAt: string;
  nextActionAt: string;
};

const ACTIONS: Array<{
  type: ActivityAction;
  label: string;
  description: string;
  icon: typeof Phone;
  channel: string;
  defaultOutcome: string;
}> = [
  {
    type: 'call',
    label: 'Log call',
    description: 'Record a phone conversation',
    icon: Phone,
    channel: 'phone',
    defaultOutcome: 'completed',
  },
  {
    type: 'meeting',
    label: 'Log meeting',
    description: 'Record an in-person or video meeting',
    icon: Handshake,
    channel: 'meeting',
    defaultOutcome: 'completed',
  },
  {
    type: 'note',
    label: 'Add note',
    description: 'Keep a private contact note',
    icon: StickyNote,
    channel: 'note',
    defaultOutcome: 'recorded',
  },
  {
    type: 'email',
    label: 'Mark email sent',
    description: 'Record an email sent outside CardNurture',
    icon: Mail,
    channel: 'email',
    defaultOutcome: 'sent',
  },
  {
    type: 'follow-up',
    label: 'Set next follow-up',
    description: 'Schedule the next action for this contact',
    icon: CalendarClock,
    channel: 'calendar',
    defaultOutcome: 'scheduled',
  },
];

function localDateTimeValue(date: Date): string {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

function defaultForm(action: (typeof ACTIONS)[number]): ActivityForm {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    outcome: action.defaultOutcome,
    notes: '',
    occurredAt: localDateTimeValue(now),
    nextActionAt: action.type === 'follow-up' ? localDateTimeValue(nextWeek) : '',
  };
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : format(date, 'MMM d, yyyy h:mm a');
}

function activityLabel(type: string): string {
  return type in ACTIVITY_LABELS
    ? ACTIVITY_LABELS[type as ActivityType]
    : type.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ActivityTimeline({ contactId }: { contactId: string }) {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<ActivityAction | null>(null);
  const [form, setForm] = useState<ActivityForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/activities`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load activity');
      setActivities(data);
      setError(null);
    } catch (fetchError: any) {
      setError(fetchError.message || 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const nextAction = useMemo(() => {
    const now = Date.now();
    return activities
      .filter((activity) => activity.nextActionAt && new Date(activity.nextActionAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.nextActionAt as string).getTime() -
          new Date(b.nextActionAt as string).getTime(),
      )[0];
  }, [activities]);

  const openForm = (type: ActivityAction) => {
    const action = ACTIONS.find((candidate) => candidate.type === type);
    if (!action) return;
    setActiveAction(type);
    setForm(defaultForm(action));
    setError(null);
  };

  const closeForm = () => {
    if (isSaving) return;
    setActiveAction(null);
    setForm(null);
  };

  const submitActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeAction || !form) return;

    if (activeAction === 'note' && !form.notes.trim()) {
      setError('Add a note before saving.');
      return;
    }
    if (activeAction === 'follow-up' && !form.nextActionAt) {
      setError('Choose a next action date.');
      return;
    }

    const action = ACTIONS.find((candidate) => candidate.type === activeAction);
    if (!action) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeAction,
          channel: action.channel,
          outcome: form.outcome,
          notes: form.notes,
          occurredAt: new Date(form.occurredAt).toISOString(),
          nextActionAt: form.nextActionAt
            ? new Date(form.nextActionAt).toISOString()
            : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save activity');
      setActivities((current) => [data, ...current]);
      closeForm();
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save activity');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.type}
              type="button"
              onClick={() => openForm(action.type)}
              aria-label={action.label}
              title={action.description}
              className="flex flex-col items-center justify-center gap-1.5 p-3 min-h-[76px] text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent-orange)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 active:scale-[0.98]"
            >
              <Icon size={17} className="text-[var(--accent-orange)]" />
              <span className="text-xs font-medium text-[var(--text-primary)]">{action.label}</span>
            </button>
          );
        })}
      </div>

      {nextAction && nextAction.nextActionAt && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-orange)]/20 bg-[var(--accent-orange)]/10 p-3">
          <CalendarClock size={18} className="shrink-0 text-[var(--accent-orange)]" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-orange)]">next action</p>
            <p className="text-sm text-[var(--text-primary)]">
              {formatActivityDate(nextAction.nextActionAt)}
            </p>
          </div>
        </div>
      )}

      {activeAction && form && (
        <form
          onSubmit={submitActivity}
          className="rounded-xl border border-[var(--accent-orange)]/30 bg-[var(--bg-elevated)] p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                {ACTIONS.find((action) => action.type === activeAction)?.label}
              </h4>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                This activity will be added to the contact timeline.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close activity form"
            >
              <X size={17} className="text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Outcome</span>
              <input
                value={form.outcome}
                onChange={(event) => setForm({ ...form, outcome: event.target.value })}
                required
                maxLength={120}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-orange)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Occurred at</span>
              <input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(event) => setForm({ ...form, occurredAt: event.target.value })}
                required
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-orange)]"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Notes{activeAction === 'note' ? ' *' : ''}
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={3}
              maxLength={10000}
              placeholder="What happened?"
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-y focus:border-[var(--accent-orange)]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">next action date</span>
            <input
              type="datetime-local"
              value={form.nextActionAt}
              onChange={(event) => setForm({ ...form, nextActionAt: event.target.value })}
              required={activeAction === 'follow-up'}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-orange)]"
            />
          </label>

          {error && <p className="text-xs text-[var(--status-error)]">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSaving}
              className="px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-sm font-medium min-h-[44px] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save activity
            </button>
          </div>
        </form>
      )}

      {error && !activeAction && <p className="text-sm text-[var(--status-error)]">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-[var(--text-tertiary)]">
          <Loader2 size={17} className="mr-2 animate-spin" /> Loading activity...
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-2">
            <Clock3 size={19} className="text-[var(--text-tertiary)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">No activity yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Use a control above to start the timeline.</p>
        </div>
      ) : (
        <div className="relative space-y-3">
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[var(--border-subtle)]" />
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex gap-3">
              <div className="relative z-10 mt-1 w-8 h-8 shrink-0 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Plus size={14} className="text-[var(--accent-orange)]" />
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{activityLabel(activity.type)}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{formatActivityDate(activity.occurredAt)}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize">
                  {activity.channel} · {activity.outcome}
                </p>
                {activity.notes && <p className="text-sm text-[var(--text-secondary)] mt-2 whitespace-pre-wrap">{activity.notes}</p>}
                {activity.nextActionAt && (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--accent-orange)] mt-2">
                    <CalendarClock size={13} /> next action {formatActivityDate(activity.nextActionAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
