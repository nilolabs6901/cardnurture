import { z } from 'zod';

export const ACTIVITY_TYPES = ['call', 'meeting', 'note', 'email', 'follow-up'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const activityDate = z.coerce.date();

export const activityInputSchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  channel: z.string().trim().min(1, 'Channel is required').max(80),
  outcome: z.string().trim().min(1, 'Outcome is required').max(120),
  notes: z.string().trim().max(10000).default(''),
  occurredAt: activityDate.default(() => new Date()),
  nextActionAt: activityDate.nullable().optional().default(null),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  meeting: 'Meeting',
  note: 'Note',
  email: 'Email sent',
  'follow-up': 'Follow-up',
};

export function activityValidationError(result: {
  error: { issues: Array<{ message: string }> };
}): string {
  return result.error.issues.map((issue) => issue.message).join(', ');
}
