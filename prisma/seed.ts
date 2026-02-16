import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = hashSync('cardnurture123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@cardnurture.app' },
    update: {},
    create: {
      email: 'admin@cardnurture.app',
      passwordHash: hashedPassword,
      name: 'Admin',
    },
  });
  console.log(`Created/found user: ${user.email}`);

  // ---------- Contact 1: Mike Torres (Driver - Lumber) ----------
  const mikeTorres = await prisma.contact.create({
    data: {
      userId: user.id,
      name: 'Mike Torres',
      company: 'Sunshine Lumber Distribution',
      email: 'mtorres@sunshinelumber.com',
      phone: '(904) 555-0142',
      address: '4521 Industrial Blvd, Jacksonville, FL 32216',
      personalityType: 'Driver',
      personalityConfidence: 'medium',
      personalitySummary:
        'Based on public information, Mike Torres appears to be a Driver communicator. His role as Operations Manager and focus on operational efficiency, throughput metrics, and cost reduction suggest a results-oriented, direct leadership style.',
      industryVertical: 'Lumber & Building Materials',
      nurtureEnabled: true,
      nurtureTopic: 'Long Load & Bulk Material Handling',
    },
  });
  console.log('Created contact: Mike Torres');

  await prisma.emailDraft.create({
    data: {
      contactId: mikeTorres.id,
      type: 'follow-up',
      status: 'draft',
      subject: 'Quick follow-up — optimizing your lumber yard layout',
      body: `Hi Mike,

[Personal note]

Great connecting at [Where we met]. [Specific detail about them]

I wanted to follow up quickly — companies like Sunshine Lumber have reclaimed up to 50% more yard space by switching to multidirectional forklifts for long-load handling. One machine replaces the need for conventional forklifts plus sideloaders in your lumber aisles.

[Your call to action]

Best,
[Your name]`,
    },
  });

  await prisma.emailDraft.create({
    data: {
      contactId: mikeTorres.id,
      type: 'nurture',
      status: 'draft',
      subject: 'Handling long lumber loads without the headaches',
      body: `Mike,

Long-load handling is one of the biggest throughput bottlenecks in lumber distribution. Traditional forklifts require wide aisles and 3-point turns that eat up time and space.

Multidirectional forklifts like the Combilift C-Series handle loads up to 25 tonnes and operate in aisles as narrow as 2.5 meters — cutting cycle times by 30-50% for timber and panel movements.

Worth a quick look at the numbers for your Jacksonville operation? Happy to run a layout analysis.

Best regards`,
      topic: 'Long Load & Bulk Material Handling',
    },
  });
  console.log('Created email drafts for Mike Torres');

  await prisma.prospect.createMany({
    data: [
      {
        contactId: mikeTorres.id,
        companyName: 'Florida Truss & Components',
        relationship: 'customer',
        relationshipDesc: 'Purchases lumber and engineered wood products from Sunshine Lumber',
        location: 'Orlando, FL',
        industry: 'Construction Materials Manufacturing',
        combiliftFit:
          'Handles long truss components in outdoor yard — Combilift C-Series ideal for multidirectional transport of 40ft+ trusses',
        confidence: 'medium',
        status: 'new',
      },
      {
        contactId: mikeTorres.id,
        companyName: 'Coastal Cabinet Works',
        relationship: 'customer',
        relationshipDesc: 'Custom cabinet manufacturer sourcing hardwood from Sunshine Lumber',
        location: 'St. Augustine, FL',
        industry: 'Furniture & Cabinet Manufacturing',
        combiliftFit:
          'Indoor warehouse with long panel stock and sheet goods — Combi-WR walk-behind for tight manufacturing cells',
        confidence: 'medium',
        status: 'new',
      },
      {
        contactId: mikeTorres.id,
        companyName: 'Southeast Building Supply',
        relationship: 'industry_peer',
        relationshipDesc: 'Regional building materials distributor with overlapping Florida territory',
        location: 'Gainesville, FL',
        industry: 'Building Materials Distribution',
        combiliftFit:
          'Multi-SKU building materials yard handling lumber, drywall, and roofing — C-Series for outdoor yard efficiency',
        confidence: 'low',
        status: 'new',
      },
    ],
  });
  console.log('Created prospects for Mike Torres');

  // ---------- Contact 2: Sarah Chen (Analytical - Cold Storage) ----------
  const sarahChen = await prisma.contact.create({
    data: {
      userId: user.id,
      name: 'Sarah Chen',
      company: 'Arctic Flow Cold Storage',
      email: 'schen@arcticflow.com',
      phone: '(813) 555-0298',
      address: '8900 Commerce Park Dr, Tampa, FL 33610',
      personalityType: 'Analytical',
      personalityConfidence: 'high',
      personalitySummary:
        'Sarah Chen demonstrates strong Analytical communication traits. Her background in supply chain engineering, data-driven decision making, and systematic approach to warehouse optimization indicate a detail-oriented, evidence-based communicator.',
      industryVertical: 'Cold Storage & 3PL',
      nurtureEnabled: true,
      nurtureTopic: 'Space Optimization & Storage Density',
    },
  });
  console.log('Created contact: Sarah Chen');

  await prisma.emailDraft.create({
    data: {
      contactId: sarahChen.id,
      type: 'follow-up',
      status: 'draft',
      subject: 'Following up with specifics on cold storage optimization',
      body: `Hi Sarah,

[Personal note]

It was a pleasure meeting you at [Where we met]. [Specific detail about them]

I wanted to share some data points that are particularly relevant to Arctic Flow's cold storage operations:

\u2022 Narrow-aisle articulated forklifts can increase pallet positions by 40-60% in existing cold storage facilities
\u2022 This translates to avoiding $2-5M+ in building expansion costs
\u2022 The Aisle-Master operates in aisles as narrow as 1.6m while maintaining 2.5t capacity

I'd welcome the opportunity to walk through a capacity analysis for your Tampa facility \u2014 the ROI math tends to be compelling for high-density cold storage environments.

[Your call to action]

Best regards,
[Your name]`,
    },
  });

  await prisma.emailDraft.create({
    data: {
      contactId: sarahChen.id,
      type: 'nurture',
      status: 'draft',
      subject: 'Cold storage density metrics: a data-driven approach',
      body: `Sarah,

I came across some recent benchmarking data on cold storage utilization that I thought you'd find relevant.

The average cold storage facility operates at 65-70% of theoretical capacity \u2014 primarily due to aisle width constraints from conventional forklift fleets. The Combilift Aisle-Master enables 1.6m aisle operation, which our engineering team has documented to increase usable pallet positions by 40-60%.

For a facility like Arctic Flow's Tampa operation, that delta typically represents significant avoided capital expenditure on expansion. I can prepare a detailed capacity model with your specific rack dimensions if that would be useful.

Regards`,
      topic: 'Space Optimization & Storage Density',
    },
  });
  console.log('Created email drafts for Sarah Chen');

  await prisma.prospect.createMany({
    data: [
      {
        contactId: sarahChen.id,
        companyName: 'Fresh Routes Logistics',
        relationship: 'logistics_partner',
        relationshipDesc: 'Regional cold chain transportation partner for Arctic Flow',
        location: 'Lakeland, FL',
        industry: 'Cold Chain Logistics & Distribution',
        combiliftFit:
          'High-volume cross-dock facility handling palletized frozen goods — Aisle-Master for narrow-aisle cold storage optimization',
        confidence: 'high',
        status: 'new',
      },
      {
        contactId: sarahChen.id,
        companyName: 'Tampa Bay Beverage Distributors',
        relationship: 'customer',
        relationshipDesc: 'Major beverage distributor using Arctic Flow for overflow cold storage',
        location: 'Tampa, FL',
        industry: 'Beverage Distribution',
        combiliftFit:
          'High-throughput beverage warehouse — Aisle-Master to maximize pallet positions and reduce aisle width requirements',
        confidence: 'medium',
        status: 'new',
      },
    ],
  });
  console.log('Created prospects for Sarah Chen');

  // ---------- Contact 3: James Rivera (Amiable - Precast) ----------
  const jamesRivera = await prisma.contact.create({
    data: {
      userId: user.id,
      name: 'James Rivera',
      company: 'Gulf Coast Precast',
      email: 'jrivera@gulfcoastprecast.com',
      phone: '(305) 555-0176',
      address: '12200 NW 25th St, Miami, FL 33182',
      personalityType: 'Amiable',
      personalityConfidence: 'medium',
      personalitySummary:
        'James Rivera shows Amiable communication characteristics. His emphasis on team safety, collaborative approach to plant operations, and community involvement suggest a supportive, relationship-focused leadership style.',
      industryVertical: 'Precast Concrete & Construction',
      nurtureEnabled: true,
      nurtureTopic: 'Warehouse Safety & OSHA Compliance',
    },
  });
  console.log('Created contact: James Rivera');

  await prisma.emailDraft.create({
    data: {
      contactId: jamesRivera.id,
      type: 'follow-up',
      status: 'draft',
      subject: 'Really enjoyed meeting you and learning about your team',
      body: `Hi James,

[Personal note]

It was really great getting to know you at [Where we met]. [Specific detail about them]

I was especially impressed by your team's commitment to safety at Gulf Coast Precast. It's clear you've built a culture where people look out for each other \u2014 that says a lot about your leadership.

One thing I thought might interest you: many precast operations have found that switching to purpose-built straddle carriers for moving heavy panels eliminates the need for multi-crane tandem lifts, which is one of the highest-risk activities on a precast yard. The safety improvement has been meaningful for teams like yours.

I'd love to continue our conversation whenever works for you \u2014 no rush at all.

[Your call to action]

Warm regards,
[Your name]`,
    },
  });

  await prisma.emailDraft.create({
    data: {
      contactId: jamesRivera.id,
      type: 'nurture',
      status: 'draft',
      subject: 'Keeping your team safe: precast yard best practices',
      body: `James,

I hope you and the team are doing well. I wanted to share something that several plant managers in the precast industry have found valuable for their safety programs.

OSHA reports that forklift-related incidents account for roughly 85 deaths and 34,900 serious injuries annually in the US. In precast operations specifically, the highest-risk moments involve multi-crane tandem lifts and ground-level rigging for heavy panels.

The Combilift Straddle Carrier was designed to address exactly this \u2014 one operator can safely lift and transport loads up to 80 tonnes without the complexity of coordinating multiple crane operators. Several precast teams have seen meaningful reductions in near-miss events after making the switch.

Would it be helpful if I shared some of those safety case studies with your team?

All the best`,
      topic: 'Warehouse Safety & OSHA Compliance',
    },
  });
  console.log('Created email drafts for James Rivera');

  await prisma.prospect.createMany({
    data: [
      {
        contactId: jamesRivera.id,
        companyName: 'Sunbelt Steel Fabricators',
        relationship: 'supplier',
        relationshipDesc: 'Supplies rebar and steel reinforcement to Gulf Coast Precast',
        location: 'Hialeah, FL',
        industry: 'Steel Fabrication & Distribution',
        combiliftFit:
          'Long steel bars and rebar bundles in outdoor storage yard — C-Series for safe, efficient handling of 20ft+ steel loads',
        confidence: 'high',
        status: 'new',
      },
      {
        contactId: jamesRivera.id,
        companyName: 'Atlantic Modular Systems',
        relationship: 'industry_peer',
        relationshipDesc: 'Modular construction company using precast components',
        location: 'Fort Lauderdale, FL',
        industry: 'Modular Construction',
        combiliftFit:
          'Heavy modular building components requiring careful positioning — Straddle Carrier for loads up to 80t without overhead crane infrastructure',
        confidence: 'medium',
        status: 'new',
      },
      {
        contactId: jamesRivera.id,
        companyName: 'Dade County Concrete Supply',
        relationship: 'supplier',
        relationshipDesc: 'Ready-mix concrete supplier to Gulf Coast Precast',
        location: 'Miami, FL',
        industry: 'Concrete Production',
        combiliftFit:
          'Precast yard with heavy form components and finished panels — Straddle Carrier eliminates multi-crane tandem lift hazards',
        confidence: 'low',
        status: 'new',
      },
    ],
  });
  console.log('Created prospects for James Rivera');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
