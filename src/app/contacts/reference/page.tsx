'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const personalityDotColors: Record<string, string> = {
  Driver: 'bg-[var(--personality-driver)]',
  Analytical: 'bg-[var(--personality-analytical)]',
  Expressive: 'bg-[var(--personality-expressive)]',
  Amiable: 'bg-[var(--personality-amiable)]',
  Balanced: 'bg-[var(--personality-balanced)]',
};

export default function ContactReferencePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch('/api/contacts');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load contacts');
        }
        const data = await res.json();
        setContacts(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const activeNurtureCount = contacts.filter((c) => c.nurtureEnabled).length;
  const totalProspects = contacts.reduce(
    (sum, c) => sum + (c._count?.prospects || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Minimal nav */}
      <div className="no-print flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <span className="font-bold text-base tracking-tight text-gray-900">
            Card
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mx-0.5 align-middle" />
            Nurture
          </span>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={() => window.open('/api/contacts/export?format=csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold text-gray-900 tracking-tight">
            CardNurture Contact Reference
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), 'MMMM d, yyyy')}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {contacts.length} contacts
            </span>
            <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {activeNurtureCount} active nurture
            </span>
            <span className="inline-flex items-center bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {totalProspects} prospects
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Name
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Company
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Phone
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Email
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Industry
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Personality
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Nurture
                </th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Last Contact
                </th>
                <th className="text-center py-2.5 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap">
                  Prospects
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const dotColor =
                  personalityDotColors[contact.personalityType] ||
                  personalityDotColors.Balanced;

                const lastDraftDate =
                  contact.emailDrafts && contact.emailDrafts.length > 0
                    ? contact.emailDrafts[0].createdAt
                    : null;

                // Use _count for prospects when emailDrafts are not included
                const prospectCount = contact._count?.prospects ?? (contact.prospects?.length || 0);

                return (
                  <tr
                    key={contact.id}
                    className="border-b border-gray-100 even:bg-gray-50 hover:bg-gray-100 transition-colors duration-75"
                  >
                    <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">
                      {contact.name}
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {contact.company || '\u2014'}
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {contact.phone || '\u2014'}
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap max-w-[200px] truncate">
                      {contact.email || '\u2014'}
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap text-xs">
                      {contact.industryVertical || '\u2014'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`}
                        />
                        <span className="text-gray-700 text-xs">
                          {contact.personalityType}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {contact.nurtureEnabled ? (
                        <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                          Off
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
                      {lastDraftDate
                        ? format(new Date(lastDraftDate), 'MMM d, yyyy')
                        : '\u2014'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="font-[var(--font-space-grotesk)] font-semibold text-gray-900 text-xs">
                        {prospectCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contacts.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              No contacts found. Scan a business card to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
