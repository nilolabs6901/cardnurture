export type PersonalityType = 'Driver' | 'Analytical' | 'Expressive' | 'Amiable' | 'Balanced';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export type DraftType = 'follow-up' | 'nurture';

export type DraftStatus = 'draft' | 'sent' | 'archived';

export type ProspectStatus = 'new' | 'contacted' | 'converted' | 'dismissed';

export type ProspectRelationship = 'supplier' | 'customer' | 'logistics_partner' | 'distributor' | 'sibling_facility' | 'industry_peer';

export interface ParsedContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

export interface ParseResult {
  fields: ParsedContact;
  confidence: Record<keyof ParsedContact, ConfidenceLevel>;
  rawText: string;
}

export interface PersonalityResult {
  personalityType: PersonalityType;
  confidence: ConfidenceLevel;
  summary: string;
}

export interface ResearchResult extends PersonalityResult {
  researchSnippets: string;
}

export interface ProspectResult {
  companyName: string;
  relationship: string;
  relationshipDesc: string;
  location: string;
  industry: string;
  combiliftFit: string;
  combiliftProduct: string;
  website?: string;
  confidence: ConfidenceLevel;
}

export interface NurtureCronResult {
  generated: number;
  skipped: number;
  errors: number;
}

export interface BatchOcrItem {
  id: string;
  fileName: string;
  status: 'queued' | 'processing' | 'extracted' | 'failed';
  result?: ParseResult;
  error?: string;
}

export const PERSONALITY_TYPES: PersonalityType[] = ['Driver', 'Analytical', 'Expressive', 'Amiable', 'Balanced'];

export const NURTURE_TOPICS = [
  'Auto',
  'Warehouse Safety & OSHA Compliance',
  'Space Optimization & Storage Density',
  'Long Load & Bulk Material Handling',
  'ROI & Total Cost of Ownership',
  'Fleet Management & Maintenance',
] as const;

export type NurtureTopic = (typeof NURTURE_TOPICS)[number];
