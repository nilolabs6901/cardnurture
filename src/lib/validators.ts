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

export const SALES_STAGES = ['Lead', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost'] as const;

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
  salesStage: z.enum(SALES_STAGES).optional(),
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

export const contactBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one contact ID required'),
});

export const contactBulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one contact ID required'),
  nurtureEnabled: z.boolean().optional(),
  nurtureInterval: z.number().int().min(1).max(365).optional(),
  nurtureTopic: z.string().optional(),
});

export const prospectCreateSchema = z.object({
  contactId: z.string().min(1, 'Contact ID required'),
  companyName: z.string().min(1, 'Company name required'),
  relationship: z.string().min(1, 'Relationship required'),
  relationshipDesc: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
});

export const prospectBulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['new', 'contacted', 'converted', 'dismissed']).optional(),
});

export const prospectBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
export type NurtureSettingsInput = z.infer<typeof nurtureSettingsSchema>;
export type ProspectUpdateInput = z.infer<typeof prospectUpdateSchema>;
export type ContactBulkDeleteInput = z.infer<typeof contactBulkDeleteSchema>;
export type ContactBulkUpdateInput = z.infer<typeof contactBulkUpdateSchema>;
export type ProspectCreateInput = z.infer<typeof prospectCreateSchema>;
export type ProspectBulkUpdateInput = z.infer<typeof prospectBulkUpdateSchema>;
