/**
 * Pure field check, deliberately in its own module with no environment access.
 *
 * The confirm screen is a client component. Importing it from leadPush.ts would
 * pull that module -- and its DEAL_APP_URL / rep identity references -- into the
 * browser bundle. Nothing secret would leak (they are not NEXT_PUBLIC, so Next
 * replaces them with undefined), but the tracker's address has no business being
 * shipped to a phone at all.
 */
export interface LeadCardFields {
  companyName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/** The four card fields the lead endpoint refuses to create a lead without. */
export function missingLeadFields(input: LeadCardFields): string[] {
  const need: Array<[keyof LeadCardFields, string]> = [
    ['companyName', 'company'],
    ['contactName', 'name'],
    ['contactPhone', 'phone'],
    ['contactEmail', 'email'],
  ];
  return need.filter(([k]) => !String(input[k] ?? '').trim()).map(([, label]) => label);
}
