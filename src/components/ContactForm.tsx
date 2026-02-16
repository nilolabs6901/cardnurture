'use client';

import ConfidenceField from './ConfidenceField';

interface ContactFormProps {
  fields: Record<string, string>;
  confidence: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function ContactForm({
  fields,
  confidence,
  onChange,
}: ContactFormProps) {
  return (
    <div className="space-y-4">
      {/* Name - full width */}
      <ConfidenceField
        label="Name"
        value={fields.name || ''}
        confidence={confidence.name || 'high'}
        onChange={(val) => onChange('name', val)}
      />

      {/* Email + Phone - side by side on md: */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfidenceField
          label="Email"
          value={fields.email || ''}
          confidence={confidence.email || 'high'}
          onChange={(val) => onChange('email', val)}
        />
        <ConfidenceField
          label="Phone"
          value={fields.phone || ''}
          confidence={confidence.phone || 'high'}
          onChange={(val) => onChange('phone', val)}
        />
      </div>

      {/* Company - full width */}
      <ConfidenceField
        label="Company"
        value={fields.company || ''}
        confidence={confidence.company || 'high'}
        onChange={(val) => onChange('company', val)}
      />

      {/* Address - full width */}
      <ConfidenceField
        label="Address"
        value={fields.address || ''}
        confidence={confidence.address || 'high'}
        onChange={(val) => onChange('address', val)}
      />
    </div>
  );
}
