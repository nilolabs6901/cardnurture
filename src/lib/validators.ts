import { z } from 'zod';

export const contactCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  personalityType: z
    .enum(['Driver', 'Analytical', 'Expressive', 'Amiable', 'Balanced'])
    .optional(),
  personalitySummary: z.string().optional().or(z.literal('')),
  personalityConfidence: z
    .enum(['high', 'medium', 'low', 'none'])
    .optional(),
  researchSnippets: z.string().optional().or(z.literal('')),
  industryVertical: z.string().optional().or(z.literal('')),
  rawOcrText: z.string().optional().or(z.literal('')),
  needsReview: z.boolean().optional(),
  batchId: z.string().optional().or(z.literal('')),
});

export const contactUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  personalityType: z
    .enum(['Driver', 'Analytical', 'Expressive', 'Amiable', 'Balanced'])
    .optional(),
  personalitySummary: z.string().optional().or(z.literal('')),
  personalityConfidence: z
    .enum(['high', 'medium', 'low', 'none'])
    .optional(),
  researchSnippets: z.string().optional().or(z.literal('')),
  industryVertical: z.string().optional().or(z.literal('')),
  rawOcrText: z.string().optional().or(z.literal('')),
  needsReview: z.boolean().optional(),
  batchId: z.string().optional().or(z.literal('')),
  nurtureEnabled: z.boolean().optional(),
  nurtureInterval: z.number().int().min(1).max(365).optional(),
  nurtureTopic: z.string().optional(),
});

export const draftUpdateSchema = z.object({
  subject: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(['draft', 'sent', 'archived']).optional(),
  topic: z.string().optional(),
});

export const nurtureSettingsSchema = z.object({
  nurtureEnabled: z.boolean(),
  nurtureInterval: z.number().int().min(1).max(365),
  nurtureTopic: z.enum([
    'Auto',
    'Warehouse Safety & OSHA Compliance',
    'Space Optimization & Storage Density',
    'Long Load & Bulk Material Handling',
    'ROI & Total Cost of Ownership',
    'Fleet Management & Maintenance',
  ]),
});

export const prospectUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'dismissed']),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
export type NurtureSettingsInput = z.infer<typeof nurtureSettingsSchema>;
export type ProspectUpdateInput = z.infer<typeof prospectUpdateSchema>;
