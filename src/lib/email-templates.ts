/**
 * Email template library for Combilift regional sales.
 *
 * Generates personality-tone-matched follow-up and nurture emails.
 * Templates are educational, lead with industry pain points, and introduce
 * Combilift solutions with supporting stats. Never overtly salesy.
 */

import type { PersonalityType, NurtureTopic } from '@/types';
import { VALUE_PILLARS, COMBILIFT_PRODUCTS } from '@/lib/combilift-knowledge';

// ---------------------------------------------------------------------------
// Types used by template functions
// ---------------------------------------------------------------------------

/** Minimal contact shape needed by the template generators. */
export interface TemplateContact {
  name: string;
  company: string | null;
  personalityType: string;
  personalitySummary: string | null;
  researchSnippets: string | null;
  industryVertical: string | null;
  emailDrafts: { id: string }[];
}

export interface EmailDraft {
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// A) PERSONALITY_DESCRIPTIONS
// ---------------------------------------------------------------------------

export const PERSONALITY_DESCRIPTIONS: Record<PersonalityType, string> = {
  Driver:
    'Results-oriented, direct, decisive. Values efficiency and bottom-line impact.',
  Analytical:
    'Data-driven, detail-oriented, methodical. Values accuracy and evidence.',
  Expressive:
    'Enthusiastic, creative, vision-oriented. Values recognition and big ideas.',
  Amiable:
    'Supportive, patient, relationship-focused. Values harmony and collaboration.',
  Balanced:
    'Balanced communicator. Adapts to various styles.',
};

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function firstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

function pickStat(pillarKey: keyof typeof VALUE_PILLARS): string {
  const stats = VALUE_PILLARS[pillarKey].stats;
  return stats[Math.floor(Math.random() * stats.length)];
}

function industryRef(vertical: string | null | undefined): string {
  if (!vertical || vertical === 'General') {
    return 'material handling operations';
  }
  return vertical.toLowerCase();
}

function companyOrTeam(company: string | null): string {
  return company ? company : 'your team';
}

// ---------------------------------------------------------------------------
// B) generateFollowUpDraft
// ---------------------------------------------------------------------------

export function generateFollowUpDraft(contact: TemplateContact): EmailDraft {
  const type = (contact.personalityType || 'Balanced') as PersonalityType;
  const first = firstName(contact.name);
  const company = companyOrTeam(contact.company);
  const vertical = industryRef(contact.industryVertical);

  switch (type) {
    case 'Driver':
      return {
        subject: `Quick follow-up \u2014 saving space and cutting fleet costs`,
        body: [
          `${first},`,
          ``,
          `Good connecting at [Where we met]. I'll keep this brief.`,
          ``,
          `[Personal note about something specific they mentioned.]`,
          ``,
          `One stat worth noting: ${pickStat('storage')} For operations in ${vertical} like ${company}, that translates directly to lower overhead.`,
          ``,
          `[Your call to action \u2014 e.g., "Worth a 15-minute call this week?"]`,
          ``,
          `Best,`,
        ].join('\n'),
      };

    case 'Analytical':
      return {
        subject: `Following up with some specifics on space optimization`,
        body: [
          `Hi ${first},`,
          ``,
          `Thank you for the conversation at [Where we met]. I appreciated your thoughtful questions about [Specific detail about them].`,
          ``,
          `**Background**`,
          `[Personal note \u2014 context on what prompted the discussion.]`,
          ``,
          `**Key Data Points**`,
          `\u2022 ${pickStat('storage')}`,
          `\u2022 ${pickStat('efficiency')}`,
          `\u2022 ${pickStat('roi')}`,
          ``,
          `**Relevance to ${company}**`,
          `Given your focus on ${vertical}, these numbers often translate into measurable gains within the first 12 months. I can walk through a more detailed analysis tailored to your specific layout and throughput requirements.`,
          ``,
          `[Your call to action \u2014 e.g., "Would a data-driven comparison be useful? Happy to put one together."]`,
          ``,
          `Regards,`,
        ].join('\n'),
      };

    case 'Expressive':
      return {
        subject: `Great connecting \u2014 exciting possibilities!`,
        body: [
          `Hi ${first}!`,
          ``,
          `What a great conversation at [Where we met]! I really enjoyed hearing about your vision for ${company} and where you see things heading. [Personal note \u2014 something they were excited about.]`,
          ``,
          `I couldn't stop thinking about the possibilities. Imagine reclaiming a huge portion of your current floor space and using it for growth instead of just storage. ${pickStat('storage')} That kind of transformation is exactly what gets me excited about the work we do with Combilift.`,
          ``,
          `For ${vertical} operations, the impact can be dramatic \u2014 more room to grow, safer workflows, and a facility that actually supports your ambitions rather than limiting them.`,
          ``,
          `[Your call to action \u2014 e.g., "I'd love to sketch out what this could look like for your facility. Coffee next week?"]`,
          ``,
          `Looking forward to continuing the conversation!`,
          ``,
          `Cheers,`,
        ].join('\n'),
      };

    case 'Amiable':
      return {
        subject: `Really enjoyed meeting you and learning about your team`,
        body: [
          `Hi ${first},`,
          ``,
          `It was genuinely great meeting you at [Where we met]. I really appreciated you taking the time to share what's going on at ${company} and how your team is handling things. [Personal note \u2014 something about their team or culture that stood out.]`,
          ``,
          `I know change can feel like a lot, especially when things are running reasonably well. But one thing that stood out to me is how much your team's day-to-day could benefit from simpler, safer equipment. ${pickStat('safety')}`,
          ``,
          `For folks in ${vertical}, it's often the small improvements that make the biggest difference for the people doing the work every day.`,
          ``,
          `No pressure at all \u2014 [Your call to action \u2014 e.g., "if it ever makes sense, I'd be happy to stop by and meet the team."]`,
          ``,
          `Warm regards,`,
        ].join('\n'),
      };

    case 'Balanced':
    default:
      return {
        subject: `Great meeting you \u2014 a few thoughts on material handling`,
        body: [
          `Hi ${first},`,
          ``,
          `Thanks for the conversation at [Where we met]. [Personal note \u2014 reference to a topic you discussed.]`,
          ``,
          `I wanted to share a quick stat that's relevant to ${company}: ${pickStat('storage')}`,
          ``,
          `In ${vertical}, we've seen this translate into meaningful savings and operational improvements. Combilift's multi-directional approach tends to simplify things \u2014 fewer machines, more space, and safer operations.`,
          ``,
          `[Your call to action \u2014 e.g., "Happy to chat more whenever it makes sense. No rush."]`,
          ``,
          `Best regards,`,
        ].join('\n'),
      };
  }
}

// ---------------------------------------------------------------------------
// B2) generateIntroMeetingDraft — "Nice to meet you" follow-up
// ---------------------------------------------------------------------------

export function generateIntroMeetingDraft(contact: TemplateContact): EmailDraft {
  const type = (contact.personalityType || 'Balanced') as PersonalityType;
  const first = firstName(contact.name);
  const company = companyOrTeam(contact.company);

  // Tone adjustments by personality
  const toneMap: Record<PersonalityType, { greeting: string; signoff: string; style: string }> = {
    Driver: {
      greeting: `${first},`,
      signoff: 'Best,',
      style: 'direct and concise',
    },
    Analytical: {
      greeting: `Hi ${first},`,
      signoff: 'Regards,',
      style: 'thorough and detail-oriented',
    },
    Expressive: {
      greeting: `Hi ${first}!`,
      signoff: 'Looking forward to connecting!\n\nCheers,',
      style: 'warm and enthusiastic',
    },
    Amiable: {
      greeting: `Hi ${first},`,
      signoff: 'Warm regards,',
      style: 'friendly and supportive',
    },
    Balanced: {
      greeting: `Hi ${first},`,
      signoff: 'Best regards,',
      style: 'professional and personable',
    },
  };

  const tone = toneMap[type];

  return {
    subject: `Great meeting you${contact.company ? ` — ${first} from ${contact.company}` : ''}`,
    body: [
      tone.greeting,
      ``,
      `It was great meeting you at [event / location]. I really enjoyed our conversation about [topic you discussed].`,
      ``,
      `[Personal note — something specific they mentioned or that stood out about them.]`,
      ``,
      `I'd love to stay in touch and continue the conversation. If there's ever anything I can help with for ${company}, don't hesitate to reach out.`,
      ``,
      `[Optional call to action — e.g., "Would you be open to grabbing coffee sometime?" or "Let's find 15 minutes to chat next week."]`,
      ``,
      tone.signoff,
      `[Your Name]`,
      `[Your Title]`,
      `[Your Phone]`,
    ].join('\n'),
  };
}

// ---------------------------------------------------------------------------
// B3) generateCombiliftModelDraft — Product-specific Combilift email
// ---------------------------------------------------------------------------

export function generateCombiliftModelDraft(
  contact: TemplateContact,
  modelKey: string,
): EmailDraft {
  const type = (contact.personalityType || 'Balanced') as PersonalityType;
  const first = firstName(contact.name);
  const company = companyOrTeam(contact.company);
  const vertical = industryRef(contact.industryVertical);

  const product = COMBILIFT_PRODUCTS[modelKey];
  if (!product) {
    // Fallback if model not found
    return generateFollowUpDraft(contact);
  }

  const personalityKey = resolvePersonalityKey(type) as PersonalityType;

  const toneMap: Record<'Driver' | 'Analytical' | 'Expressive' | 'Amiable', {
    greeting: string;
    signoff: string;
    hook: string;
    cta: string;
  }> = {
    Driver: {
      greeting: `${first},`,
      signoff: 'Best,',
      hook: `I'll keep this brief — the ${modelKey} could solve a real bottleneck for ${company}.`,
      cta: `[Your call to action — e.g., "Worth 15 minutes to walk through the numbers?"]`,
    },
    Analytical: {
      greeting: `Hi ${first},`,
      signoff: 'Regards,',
      hook: `I wanted to share some specific data on the ${modelKey} that I think you'll find relevant to ${company}'s operations.`,
      cta: `[Your call to action — e.g., "I can put together a detailed spec comparison for your current setup. Would that be useful?"]`,
    },
    Expressive: {
      greeting: `Hi ${first}!`,
      signoff: 'Looking forward to your thoughts!\n\nCheers,',
      hook: `I've been thinking about our conversation and I'm genuinely excited about what the ${modelKey} could do for ${company}.`,
      cta: `[Your call to action — e.g., "I'd love to show you a demo — it's one of those things that's even more impressive in person!"]`,
    },
    Amiable: {
      greeting: `Hi ${first},`,
      signoff: 'Warm regards,',
      hook: `I wanted to share some information about the ${modelKey} that I think could make a real difference for your team at ${company}.`,
      cta: `[Your call to action — e.g., "No pressure at all — if you'd ever like to see it in action, I'd be happy to arrange a walkthrough at your pace."]`,
    },
  };

  const tone = toneMap[personalityKey as 'Driver' | 'Analytical' | 'Expressive' | 'Amiable'];

  return {
    subject: `${modelKey} — how it fits ${contact.company || 'your operation'}`,
    body: [
      tone.greeting,
      ``,
      tone.hook,
      ``,
      `**What is the ${modelKey}?**`,
      product.description,
      ``,
      `**Key Benefit for ${vertical}:**`,
      product.keyBenefit,
      ``,
      `**Safety:**`,
      product.safetyAngle,
      ``,
      `**ROI:**`,
      product.roiAngle,
      ``,
      `[Personal note — connect the product to something specific about their operation, challenges, or goals.]`,
      ``,
      tone.cta,
      ``,
      tone.signoff,
      `[Your Name]`,
      `[Your Title]`,
      `[Your Phone]`,
    ].join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Available draft template types (for UI selectors)
// ---------------------------------------------------------------------------

export const DRAFT_TEMPLATE_TYPES = [
  { value: 'intro-meeting', label: 'Nice to Meet You', description: 'General intro follow-up after meeting someone' },
  { value: 'combilift-model', label: 'Combilift Model Info', description: 'Product-specific email about a Combilift model' },
  { value: 'follow-up', label: 'Sales Follow-Up', description: 'Personality-matched follow-up with industry stats' },
] as const;

export type DraftTemplateType = (typeof DRAFT_TEMPLATE_TYPES)[number]['value'];

export const COMBILIFT_MODEL_OPTIONS = Object.keys(COMBILIFT_PRODUCTS).map((key) => ({
  value: key,
  label: key,
  description: COMBILIFT_PRODUCTS[key].description.split('.')[0], // First sentence only
}));

// ---------------------------------------------------------------------------
// C) TOPIC_LIBRARY
// ---------------------------------------------------------------------------

/**
 * 5 topics x 4 personality types (Driver, Analytical, Expressive, Amiable)
 *   x 3 variations each = 60 template strings.
 *
 * "Balanced" contacts use the "Driver" templates for nurture emails, since
 * that personality maps to the professional middle-ground already. The
 * generateNurtureDraft function handles this mapping.
 *
 * Each template is 3-5 sentences: leads with an industry pain point,
 * introduces a Combilift solution with a stat, and ends with a soft CTA.
 */
export const TOPIC_LIBRARY: Record<string, Record<string, string[]>> = {
  // =========================================================================
  // TOPIC 1: Warehouse Safety & OSHA Compliance
  // =========================================================================
  'Warehouse Safety & OSHA Compliance': {
    Driver: [
      // Variation 1
      `Forklift incidents remain one of the top OSHA-cited violations, and the fines keep climbing \u2014 some exceeding $150,000 per event. Combilift's multi-directional design eliminates the blind-spot reversing that causes the majority of long-load accidents. Companies that switch typically see measurable drops in near-miss reports within the first quarter. If tightening up your safety numbers is on the radar, it might be worth a quick look.`,
      // Variation 2
      `OSHA data shows forklift incidents account for roughly 85 fatalities and nearly 35,000 serious injuries per year in the U.S. alone. Combilift pedestrian-operated models remove the operator from the elevated seat, cutting tip-over fatality risk significantly. The ROI on avoiding even a single recordable incident dwarfs the equipment cost. Worth evaluating if your current fleet carries that exposure.`,
      // Variation 3
      `Blind-spot collisions with long loads are one of the most underreported warehouse hazards. Combilift's ability to move forward with full-length visibility \u2014 no reversing required \u2014 directly addresses that risk. Facilities running Combilift equipment have documented up to a 70% reduction in blind-spot incidents. If your safety team is reviewing fleet risk, this could simplify the conversation.`,
    ],
    Analytical: [
      // Variation 1
      `According to OSHA, forklift-related incidents cost U.S. employers over $135 million annually in direct costs, not including productivity losses and increased insurance premiums. Combilift's multi-directional steering eliminates the need to reverse long loads through aisles, which is a primary contributor to pedestrian-strike and product-damage events. Facilities that have adopted Combilift units report reductions in near-miss incidents of up to 80%. I can share the specific safety data and compliance mapping if that would be useful for your analysis.`,
      // Variation 2
      `OSHA 1910.178 requires powered industrial truck operators to maintain clear visibility at all times, yet conventional forklifts handling loads over 6 meters routinely violate this in practice. Combilift's design allows the operator to travel with the load beside them rather than in front, maintaining full forward sightlines. Independent testing shows articulated steering provides superior stability metrics compared to conventional counterbalance trucks. If you are benchmarking compliance gaps, I can provide the relevant test data and OSHA reference points.`,
      // Variation 3
      `The Bureau of Labor Statistics reports that struck-by incidents involving forklifts are the second leading cause of warehouse fatalities. Combilift pedestrian-operated models keep the operator at ground level with clear sight lines, effectively eliminating elevated tip-over risk. One quantifiable data point: Combilift operator-presence sensing and load-moment indicators meet and exceed OSHA 1910.178 requirements without aftermarket modifications. Happy to walk through the technical specifications and compliance documentation in detail.`,
    ],
    Expressive: [
      // Variation 1
      `Picture your warehouse floor where every operator has full forward visibility, no one is blindly reversing with 20-foot loads, and your safety board hasn't had a new incident pin in months. That's the kind of transformation Combilift's multi-directional design makes possible. OSHA fines for forklift violations can exceed $150,000 per incident, but the real win is the peace of mind. I'd love to share some stories from facilities that made the switch and saw their safety culture change almost overnight.`,
      // Variation 2
      `What if your next safety audit was something you actually looked forward to? Combilift's pedestrian-detection systems have helped facilities reduce near-miss incidents by up to 80%. Imagine your team walking the floor with confidence, knowing the equipment was designed around their safety from day one. It's one of those changes where the numbers are impressive, but the real impact is how it feels on the ground. Would love to show you what other companies in your space have experienced.`,
      // Variation 3
      `There's something powerful about a facility where the equipment actively protects the people using it. Combilift builds that philosophy into every machine \u2014 multi-directional travel that eliminates blind spots, operator-presence sensing, and load-moment indicators that go beyond OSHA requirements. Forklift incidents cause approximately 85 deaths annually in the U.S., and each one is preventable. If creating a genuinely safer environment is part of your vision, I think you'd find the Combilift story inspiring.`,
    ],
    Amiable: [
      // Variation 1
      `One thing that comes up a lot in conversations with warehouse teams is the stress of working around conventional forklifts carrying long loads \u2014 the blind spots, the reversing, the constant "heads up" culture. Combilift's design lets operators move forward with clear visibility, which makes a real difference in how comfortable people feel on the floor. Facilities have reported near-miss reductions of up to 80%. If keeping your team safe and comfortable is a priority, it might be worth exploring together.`,
      // Variation 2
      `Nobody wants to get that call about a forklift incident. OSHA reports nearly 35,000 serious injuries per year from forklift operations, and behind each number is a real person and a real team affected. Combilift pedestrian-operated models were designed specifically to reduce that risk by keeping operators at ground level with clear sight lines. It's one of those investments where the human impact matters as much as the financial one. If your team would benefit, I'm happy to walk through it at whatever pace works for you.`,
      // Variation 3
      `I know safety conversations can sometimes feel heavy, but they don't have to be. Combilift's approach is actually quite straightforward: eliminate the situations that cause accidents in the first place. No more reversing with long loads, no more blocked sight lines, and built-in operator-presence sensing that goes beyond what OSHA requires. It's the kind of change that your team notices and appreciates. If it would help, I could stop by and show your crew how it works in person \u2014 no pressure, just a conversation.`,
    ],
  },

  // =========================================================================
  // TOPIC 2: Space Optimization & Storage Density
  // =========================================================================
  'Space Optimization & Storage Density': {
    Driver: [
      // Variation 1
      `Warehouse expansion costs in most markets run $5M-$20M for a new facility. Combilift's narrow-aisle capability lets you reclaim 30-40% of existing floor space by shrinking aisles from 3.5 meters down to as narrow as 1.6 meters. That's hundreds of additional pallet positions without breaking ground. If you're weighing expansion versus optimization, the math is worth a second look.`,
      // Variation 2
      `Most conventional forklift aisles eat up more square footage than the racking they serve. Aisle-Master articulated trucks operate in aisles as narrow as 1.6 meters, and they don't need guide rails \u2014 saving another $50,000-$200,000 in infrastructure. Facilities using Combilift equipment have deferred warehouse expansion by 5-7 years on average. If space is a bottleneck, the payback is fast.`,
      // Variation 3
      `Storage capacity is a hard constraint until you change the equipment. Combilift multi-directional forklifts allow storage right up to walls and into corners that conventional trucks can't reach, boosting usable space by up to 50%. One operator, one machine, accessing every position in the building. If your facility is maxed out, this is the fastest path to more capacity without more real estate.`,
    ],
    Analytical: [
      // Variation 1
      `The economics of warehouse space are straightforward: conventional forklift aisles of 3.5+ meters consume roughly 50% of total floor area as non-productive space. Aisle-Master articulated trucks reduce that to as narrow as 1.6 meters, effectively increasing pallet positions by up to 50% within the same footprint. Unlike rail-guided VNA systems, no guide-rail infrastructure is required, which eliminates $50,000-$200,000 in setup costs. I can model the specific capacity gain for your current layout if you'd like to see the numbers.`,
      // Variation 2
      `Facilities that have converted to Combilift narrow-aisle operations typically reclaim 30-40% of floor space previously dedicated to aisles. The key metric is cost-per-pallet-position: when you factor in avoided expansion ($5M-$20M for a new facility), the per-position cost drops dramatically. Combilift multi-directional capability also eliminates dead zones in corners and along walls, recovering positions that conventional racking plans write off. Happy to run a comparative analysis against your current configuration.`,
      // Variation 3
      `One often-overlooked data point: Combilift equipment allows true indoor/outdoor operation without guide rails, meaning you gain VNA-level density without VNA-level infrastructure investment. Average facility reclaims 30-40% of floor space after switching. When you factor in the 5-7 year deferral of new construction that most customers achieve, the NPV calculation is compelling. If you're running a storage density review, I can provide the modeling framework we typically use.`,
    ],
    Expressive: [
      // Variation 1
      `Imagine walking through your warehouse and seeing twice the inventory in the same space \u2014 no construction, no new lease, just a smarter approach to how you move product. Combilift narrow-aisle technology can increase pallet positions by up to 50%, and that's before you count the corners and wall space you'll suddenly be able to use. Some of our customers have put off multi-million dollar expansions for five or more years. I'd love to show you what your facility could look like with a fresh set of eyes on the layout.`,
      // Variation 2
      `What would you do with 30-40% more usable floor space? That's not a hypothetical \u2014 it's the average gain facilities see after switching to Combilift. Aisles shrink from 3.5 meters to as narrow as 1.6, and suddenly your existing building has room to grow. The best part? No rail systems, no major construction, just equipment that's built to make every square foot work harder. I think the transformation potential here is really exciting.`,
      // Variation 3
      `There's a moment in every facility walkthrough where someone points at their wide aisles and says, "We need more space." The reality is, the space is already there \u2014 it's just being used for turning radiuses. Combilift flips that equation. Facilities avoid $5M-$20M in new construction by unlocking capacity they didn't know they had. If you love the idea of getting more from what you already have, this is one of those solutions that delivers in a big way.`,
    ],
    Amiable: [
      // Variation 1
      `One of the most common frustrations I hear from warehouse teams is feeling squeezed \u2014 not enough room to work comfortably, pallets crammed in wherever they'll fit, and expansion always on the wish list but never in the budget. Combilift narrow-aisle solutions can open up 30-40% more usable space in your existing building, which means your team gets more breathing room and you get more capacity. If that sounds like it might help, I'd enjoy exploring it with you.`,
      // Variation 2
      `I know how stressful it can be when your facility is running out of room and the budget for expansion just isn't there. A lot of teams we work with have been in that exact spot. Aisle-Master trucks operate in aisles as narrow as 1.6 meters, which can boost pallet positions by up to 50% without any construction. It's a change that makes daily work easier for everyone, not just the numbers on a spreadsheet. Happy to chat about whether it could be a good fit for your team.`,
      // Variation 3
      `When a facility is tight on space, everyone feels it \u2014 from the operators navigating crowded aisles to the managers juggling storage overflow. Combilift's multi-directional design lets you store right up to walls and into corners, recovering space that conventional forklifts simply can't reach. Facilities typically see 30-40% more usable area. It's the kind of improvement that your whole team notices and appreciates. If it's ever worth a conversation, I'm here whenever the timing feels right.`,
    ],
  },

  // =========================================================================
  // TOPIC 3: Long Load & Bulk Material Handling
  // =========================================================================
  'Long Load & Bulk Material Handling': {
    Driver: [
      // Variation 1
      `Handling loads over 6 meters with conventional forklifts is slow, risky, and hard on product. Combilift's C-Series moves loads up to 25 tonnes and over 30 meters long in a single, controlled operation \u2014 forward travel, full visibility, no reversing. Timber and steel yards report a 35% reduction in product damage after making the switch. If long loads are eating into your margins, this solves it fast.`,
      // Variation 2
      `Side-loaders are the traditional answer for long loads, but they're single-purpose machines that can't do anything else. A single Combilift C-Series replaces the side-loader, the conventional forklift, and often the crane, cutting fleet costs by 40-60%. Cycle times drop by up to 30% because the machine handles the load from dock to rack in one pass. If you're running multiple machines for long-load work, the consolidation math is hard to ignore.`,
      // Variation 3
      `Product damage on long loads \u2014 steel, timber, pipe \u2014 is a margin killer that most operations accept as a cost of doing business. It doesn't have to be. Combilift's multi-directional C-Series eliminates the lateral instability that causes bending, scratching, and drops during transport. Customers report 35% less damage and 30% faster cycle times. If protecting product quality matters to the bottom line, this is worth a hard look.`,
    ],
    Analytical: [
      // Variation 1
      `Conventional forklifts handling loads beyond 6 meters face two compounding problems: reduced lateral stability and blocked operator visibility during reversing. The Combilift C-Series addresses both by traveling with the load beside the operator in the forward direction, maintaining full sightlines and a low center of gravity. Independent data from timber and steel operations shows a 35% reduction in product damage post-implementation. Cycle-time reductions of 25-30% have been documented due to elimination of multi-step repositioning. I can share the detailed performance benchmarks if that would support your evaluation.`,
      // Variation 2
      `The C-Series handles loads up to 25 tonnes and lengths exceeding 30 meters in a single continuous operation. Key performance differentiators versus conventional side-loaders: multi-directional travel eliminates turning-radius constraints, a single machine replaces 2-3 specialized units, and indoor/outdoor operation requires no infrastructure changes. From a TCO perspective, maintenance costs for one Combilift unit are typically 50% lower than maintaining the multiple machines it replaces. Happy to provide a side-by-side specification comparison for your current fleet.`,
      // Variation 3
      `One metric that often surprises operations managers: switching from conventional side-loaders to Combilift C-Series reduces long-load handling cycle times by up to 30%. The efficiency gain comes from eliminating the multi-point handling that conventional equipment requires \u2014 the load goes from receiving to storage in one continuous pass. Additionally, the multi-directional capability allows narrower aisle configurations even for long-load storage, increasing rack density. If you're modeling throughput improvements, I can provide the cycle-time data from comparable operations.`,
    ],
    Expressive: [
      // Variation 1
      `Think about the last time you watched an operator struggle to maneuver a 30-foot steel beam through a crowded yard \u2014 the three-point turns, the spotter, the near misses. Now imagine that same load gliding smoothly down a narrow aisle, the operator traveling forward with full visibility the entire time. That's what the Combilift C-Series makes possible. Timber and steel yards that switch see 35% less product damage almost immediately. If you're looking for a game-changer for your long-load operations, this is it.`,
      // Variation 2
      `There's nothing more frustrating than watching perfectly good product get damaged because the equipment wasn't designed for the job. The Combilift C-Series was purpose-built for long and bulky loads \u2014 up to 25 tonnes and over 30 meters \u2014 and it moves them with a precision that conventional forklifts simply can't match. One machine replaces your forklift, side-loader, and often your crane, simplifying everything. I'd love to paint a picture of what your operation could look like with the right tool for the job.`,
      // Variation 3
      `Here's a vision worth considering: your longest, heaviest, most awkward loads handled in a single smooth pass, dock to rack, by one machine and one operator. No staging, no repositioning, no damage. The Combilift C-Series makes that real, and customers switching from conventional methods see cycle times drop by 30%. If you're ready to reimagine how your team handles long loads, this is one of those solutions that genuinely changes the game.`,
    ],
    Amiable: [
      // Variation 1
      `I know long-load handling can be one of the most stressful parts of warehouse work \u2014 it's physically demanding, it puts operators in difficult positions, and product damage feels almost inevitable. The Combilift C-Series was designed to take that stress away. Operators travel forward with clear visibility, the load stays stable, and the whole process becomes much calmer. Teams report 35% less product damage and a noticeably better working experience. If your team deals with long loads regularly, it might be worth seeing how this could help.`,
      // Variation 2
      `When I talk to operators who handle timber, steel, or pipe every day, the common thread is fatigue \u2014 not just physical, but the mental load of constantly managing oversized product on equipment that wasn't really designed for it. Combilift's C-Series changes that dynamic. One machine handles the full process, the load stays beside the operator with full visibility, and cycle times drop by up to 30%. It's the kind of improvement your team will genuinely thank you for. Happy to discuss whenever the timing is right.`,
      // Variation 3
      `Nobody likes seeing product damage, especially when your team worked hard to get it in the door safely. Conventional forklifts handling long loads just weren't built for that job, and the scratches, bends, and drops add up. The Combilift C-Series was purpose-built for exactly this \u2014 loads up to 25 tonnes and over 30 meters, moved safely and smoothly. It's a meaningful improvement for both your product quality and your team's daily experience. If you'd like to learn more at any point, I'm here.`,
    ],
  },

  // =========================================================================
  // TOPIC 4: ROI & Total Cost of Ownership
  // =========================================================================
  'ROI & Total Cost of Ownership': {
    Driver: [
      // Variation 1
      `Fleet consolidation is the fastest lever for cutting material handling costs. One Combilift unit typically replaces 2-3 conventional machines, reducing fleet expenses by 40-60%. When you add the space savings \u2014 avoiding a $5M-$20M expansion \u2014 the typical payback period is 6-18 months. If you're looking to hit a cost-reduction target, this is a straightforward path to get there.`,
      // Variation 2
      `Here's a number that gets attention in budget meetings: maintenance costs for one Combilift unit are typically 50% lower than maintaining the 2-3 machines it replaces. Layer in reduced product damage (2-5% of annual material costs) and insurance premium reductions of 10-25% from improved safety records, and the total cost of ownership case builds itself. If your finance team needs hard numbers, I can build them.`,
      // Variation 3
      `Energy-efficient electric Combilift models reduce fuel costs by 60-80% versus diesel or LPG fleets, and the equipment lifespan runs 15-20 years with proper maintenance. Combine that with fleet reduction \u2014 one machine doing the work of three \u2014 and the annualized cost per unit of throughput drops significantly. If you're evaluating fleet investments, the payback math is worth running.`,
    ],
    Analytical: [
      // Variation 1
      `The total cost of ownership model for Combilift typically includes four major savings categories: fleet consolidation (one unit replacing 2-3 machines, saving 40-60% on fleet costs), space optimization (avoiding $5M-$20M expansion), maintenance reduction (single-unit maintenance is approximately 50% lower than multi-machine equivalent), and insurance premium decreases (10-25% reduction from improved safety records). The typical payback period on equipment investment is 6-18 months through space savings alone, before fleet and safety savings are factored in. I can build a detailed model using your specific operating parameters if that would be useful.`,
      // Variation 2
      `When modeling TCO, one frequently overlooked variable is product damage cost. Industry data shows material handling damage averages 2-5% of annual material costs. Combilift customers in timber and steel operations have documented a 35% reduction in product damage after switching. Additionally, energy-efficient electric models reduce fuel costs by 60-80% versus diesel/LPG, and the 15-20 year equipment lifespan significantly lowers the annualized capital cost. I can provide a spreadsheet model with sensitivity analysis if you'd like to run the numbers against your current fleet.`,
      // Variation 3
      `The financial case for Combilift rests on three quantifiable pillars: fleet reduction (40-60% fewer machines), space recovery (30-40% more usable floor area), and risk mitigation (10-25% insurance premium reduction). Each pillar can be independently validated against your current operating data. Typical payback periods of 6-18 months are conservative estimates that don't fully account for soft savings like reduced operator training time and simplified parts inventory (up to 60% reduction in parts complexity). If you'd like, I can structure a phased ROI analysis with clear assumptions and break-even points.`,
    ],
    Expressive: [
      // Variation 1
      `Imagine presenting a plan to your leadership team that cuts fleet costs by 40-60%, avoids a multi-million dollar facility expansion, and pays for itself in under 18 months. That's not a stretch \u2014 it's the typical outcome when facilities switch to Combilift. One machine replaces two or three, your space opens up dramatically, and your safety record improves to boot. It's the kind of story that makes you the hero of the next budget meeting. I'd love to help you build that case.`,
      // Variation 2
      `What if your biggest capital expense this year also turned out to be your best investment? Combilift customers routinely see payback in 6-18 months, and the savings just keep compounding \u2014 lower maintenance, lower insurance, lower fuel costs. Electric models cut energy expenses by 60-80%, and the equipment lasts 15-20 years. It's the rare investment where the financial story gets better every year you own it. Would love to share some success stories from companies that have made the leap.`,
      // Variation 3
      `Here's what I find exciting about the Combilift value proposition: it's not just one savings bucket, it's a cascade. Fleet consolidation saves 40-60%. Avoided expansion saves millions. Reduced product damage saves 2-5% of material costs annually. Insurance premiums drop 10-25%. And your team is safer and more productive. When you stack it all up, the ROI conversation practically has itself. I think you'd really enjoy seeing the full picture \u2014 let me know if you'd like to explore it together.`,
    ],
    Amiable: [
      // Variation 1
      `I know budget conversations can be stressful, especially when you're trying to make a case for new equipment while keeping costs down. What's reassuring about Combilift is that the numbers tend to speak for themselves \u2014 one machine replacing two or three means lower fleet costs, simpler maintenance, and less complexity for your team. Most facilities see payback within 6-18 months, which makes the conversation with leadership much easier. If it would help to have the numbers laid out, I'm happy to put something together.`,
      // Variation 2
      `A lot of the teams I work with are juggling tight budgets with growing demands, and the last thing they need is a complicated equipment decision. Combilift simplifies things: fewer machines to maintain (costs drop about 50%), less fuel to buy (electric models cut energy costs by 60-80%), and equipment that lasts 15-20 years. It's an investment that makes your team's daily work easier while making the financial picture better. I can walk through the numbers at whatever pace feels comfortable.`,
      // Variation 3
      `When I think about total cost of ownership, I think about what it means for the people involved \u2014 less time spent fixing breakdowns, less worry about safety incidents, and a facility that works better for everyone. Combilift customers report insurance premium reductions of 10-25% because the equipment is simply safer. And fleet consolidation means fewer machines for your team to learn, maintain, and manage. It's the kind of change that ripples through the whole organization in a positive way. Whenever you'd like to explore the details, I'm here.`,
    ],
  },

  // =========================================================================
  // TOPIC 5: Fleet Management & Maintenance
  // =========================================================================
  'Fleet Management & Maintenance': {
    Driver: [
      // Variation 1
      `Managing a mixed fleet of forklifts, side-loaders, and reach trucks is expensive, complex, and a maintenance headache. One Combilift unit can replace all three, cutting fleet size and simplifying everything from parts inventory to operator certification. Standardizing on Combilift reduces parts complexity by up to 60%. If fleet management is consuming more time and budget than it should, simplification is the fastest fix.`,
      // Variation 2
      `Fleet right-sizing is where the quickest wins hide. Most operations are running 2-3 more machines than they need because each unit is single-purpose. Combilift's multi-directional capability consolidates those roles into one machine per workflow. Maintenance costs drop by roughly 50% compared to the multi-machine equivalent, and you free up floor space previously occupied by parked equipment. If your fleet has grown organically and it's time to rationalize, this is where to start.`,
      // Variation 3
      `Operator training across a multi-brand fleet is a hidden cost that compounds every time you hire. Combilift simplifies that \u2014 one platform, one set of controls, one training program. Their operator training programs have been shown to reduce operator errors and product damage by up to 40%. Combined with a global network of over 400 trained service engineers for factory-direct support, your uptime stays high and your management overhead stays low. Worth evaluating if fleet complexity is dragging on productivity.`,
    ],
    Analytical: [
      // Variation 1
      `Fleet management complexity scales non-linearly with the number of machine types in operation. Each additional brand or model introduces unique parts requirements, service schedules, and operator training protocols. Standardizing on Combilift reduces parts inventory complexity by up to 60% compared to multi-brand fleets. A single Combilift unit functionally replaces a conventional forklift, side-loader, and reach truck, which simplifies scheduling, training, and spare-parts management. I can provide a fleet-complexity analysis framework if you'd like to quantify the administrative overhead of your current configuration.`,
      // Variation 2
      `From a maintenance cost perspective, the data is clear: maintaining one Combilift unit costs approximately 50% less than maintaining the 2-3 machines it replaces. Contributing factors include reduced parts inventory (60% simplification), consolidated service contracts, and a single-vendor relationship with factory-direct support from over 400 trained engineers globally. Combilift operator training programs have also been shown to reduce operator-caused damage by up to 40%, which further decreases repair frequency. If you're benchmarking fleet maintenance KPIs, I can share comparative data from similar operations.`,
      // Variation 3
      `Fleet utilization rates are a critical but often undermeasured metric. Operations running multiple single-purpose machines (forklift, side-loader, reach truck) typically show utilization rates of 40-60% per unit, because each machine sits idle when its specific task isn't needed. Consolidating to multi-directional Combilift units drives individual utilization rates above 80%, while reducing total fleet size. The downstream effects include lower capital tied up in equipment, reduced parking/charging infrastructure, and simplified compliance documentation. I can help model the utilization improvement for your specific workflow if that would add value.`,
    ],
    Expressive: [
      // Variation 1
      `What if managing your forklift fleet was as simple as managing one machine type instead of four? That's the Combilift approach \u2014 one versatile platform that replaces the forklift, the side-loader, and the reach truck. Your maintenance team deals with one set of parts (60% less parts complexity), one service relationship, and one training program. It's the kind of simplification that transforms fleet management from a headache into a strength. I'd love to show you how other operations have made the shift.`,
      // Variation 2
      `Imagine your operators mastering one machine instead of cycling through three different types with three different control layouts. Combilift's operator training programs reduce errors and product damage by up to 40%, and when everyone is on the same platform, your whole operation moves with more confidence and consistency. Plus, with over 400 factory-trained service engineers worldwide, support is never far away. It's a vision of fleet management that actually works. Would love to share some examples of what this looks like in practice.`,
      // Variation 3
      `Here's a picture that resonates with every operations leader I talk to: a clean, right-sized fleet where every machine earns its spot, operators are confident on every unit, and maintenance is predictable instead of reactive. Combilift makes that possible by consolidating 2-3 conventional machines into one multi-directional unit. Maintenance costs drop by about 50%, and your floor has more room because half the machines are gone. If that vision appeals to you, let's explore what it looks like for your operation.`,
    ],
    Amiable: [
      // Variation 1
      `I hear from a lot of maintenance teams that managing a mixed fleet of different brands and models is one of their biggest daily frustrations \u2014 different parts, different service schedules, different quirks. Standardizing on Combilift can reduce that parts complexity by up to 60%, and having one platform means your technicians become experts rather than generalists. It makes their work more manageable and more satisfying. If simplifying things for your team sounds appealing, I'd be happy to discuss how other operations have made the transition.`,
      // Variation 2
      `One of the things I appreciate about the Combilift approach is how it respects the people doing the work. Operator training programs have been shown to reduce errors and product damage by up to 40%, which means fewer stressful incidents for your team and less frustration all around. And with over 400 factory-trained service engineers globally, when you do need support, the help is knowledgeable and responsive. It's the kind of partnership that makes managing a fleet feel less like fighting fires. Let me know if you'd ever like to explore it.`,
      // Variation 3
      `Running a fleet is one of those jobs where the better things go, the less anyone notices \u2014 but when something breaks down or an operator has an issue, everyone feels it. Combilift simplifies the equation: fewer machines (one unit replacing 2-3), lower maintenance costs (about 50% reduction), and a consistent operator experience across your whole fleet. It's the kind of change that reduces the daily stress on your team and gives you more predictable operations. Whenever the timing is right, I'd enjoy talking through whether it could be a good fit for your crew.`,
    ],
  },
};

// ---------------------------------------------------------------------------
// D) generateNurtureDraft
// ---------------------------------------------------------------------------

/**
 * Generates a nurture email draft for the given contact and topic.
 * Rotates through the 3 variations per topic/personality based on the
 * contact's current emailDrafts count to avoid repeating the same template.
 *
 * If the LLM_API_KEY environment variable is set, the draft could be
 * enhanced via LLM in a future iteration. Currently returns the template
 * directly with light personalization.
 */
export function generateNurtureDraft(
  contact: TemplateContact,
  topic: string,
): EmailDraft {
  const personalityKey = resolvePersonalityKey(contact.personalityType);
  const topicTemplates = TOPIC_LIBRARY[topic];

  // Fallback if the topic is not found in the library
  if (!topicTemplates) {
    return {
      subject: `Thoughts on improving your material handling operations`,
      body: `Hi ${firstName(contact.name)},\n\nI came across some information that might be relevant to ${companyOrTeam(contact.company)}. ${pickStat('storage')}\n\nWould it be helpful to discuss how this applies to your operation?\n\nBest regards,`,
    };
  }

  const variations = topicTemplates[personalityKey];
  if (!variations || variations.length === 0) {
    return {
      subject: `Thoughts on ${topic.toLowerCase()}`,
      body: `Hi ${firstName(contact.name)},\n\nI wanted to share some insights on ${topic.toLowerCase()} that could be relevant to ${companyOrTeam(contact.company)}. ${pickStat('roi')}\n\nWould it be helpful to explore this further?\n\nBest regards,`,
    };
  }

  // Rotate through variations based on existing draft count
  const draftCount = contact.emailDrafts?.length ?? 0;
  const variationIndex = draftCount % variations.length;
  const body = variations[variationIndex];

  const subject = buildNurtureSubject(topic, personalityKey, variationIndex);

  // If LLM_API_KEY is available, we could enhance the template here.
  // For now, return the template with contact-specific greeting prepended.
  const first = firstName(contact.name);
  const personalizedBody = `Hi ${first},\n\n${body}\n\nBest regards,`;

  if (process.env.LLM_API_KEY) {
    // Future: call LLM to refine the template using contact.researchSnippets,
    // contact.personalitySummary, and contact.industryVertical for a more
    // tailored message. For now, return the template as-is.
    return { subject, body: personalizedBody };
  }

  return { subject, body: personalizedBody };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps "Balanced" to "Driver" for nurture template selection (professional
 * middle-ground) and normalizes any unexpected values.
 */
function resolvePersonalityKey(personalityType: string): string {
  if (
    personalityType === 'Driver' ||
    personalityType === 'Analytical' ||
    personalityType === 'Expressive' ||
    personalityType === 'Amiable'
  ) {
    return personalityType;
  }
  // Balanced or unknown -> Driver templates (professional middle-ground)
  return 'Driver';
}

/**
 * Builds a subject line relevant to the topic and personality.
 */
function buildNurtureSubject(
  topic: string,
  personalityKey: string,
  variationIndex: number,
): string {
  const subjects: Record<string, Record<string, string[]>> = {
    'Warehouse Safety & OSHA Compliance': {
      Driver: [
        'Reducing forklift incident risk in your facility',
        'A safety gap worth closing',
        'Cutting OSHA exposure with the right equipment',
      ],
      Analytical: [
        'Safety data: forklift incident costs and mitigation',
        'OSHA compliance benchmarks for material handling',
        'Quantifying forklift safety improvements',
      ],
      Expressive: [
        'A safer warehouse is a more confident team',
        'Reimagining safety culture from the equipment up',
        'What a zero-incident facility looks like',
      ],
      Amiable: [
        'Keeping your team safe and comfortable',
        'Making the warehouse a better place to work',
        'A gentler approach to forklift safety',
      ],
    },
    'Space Optimization & Storage Density': {
      Driver: [
        'Unlocking hidden capacity in your facility',
        'More storage without more square footage',
        'The fastest path to more pallet positions',
      ],
      Analytical: [
        'Storage density analysis: narrow-aisle economics',
        'Modeling pallet-position gains in your layout',
        'Space utilization data for your review',
      ],
      Expressive: [
        'Imagine twice the storage in the same building',
        'Your facility has more potential than you think',
        'The space transformation opportunity',
      ],
      Amiable: [
        'Making more room for your team',
        'A less crowded warehouse for everyone',
        'Creating a better working environment through space',
      ],
    },
    'Long Load & Bulk Material Handling': {
      Driver: [
        'Solving the long-load handling bottleneck',
        'Cutting damage and cycle time on long loads',
        'One machine for every long-load challenge',
      ],
      Analytical: [
        'Long-load handling: cycle time and damage data',
        'C-Series performance benchmarks for bulk materials',
        'Comparative analysis: multi-directional vs. conventional',
      ],
      Expressive: [
        'A better way to move your toughest loads',
        'What if long loads were your easiest workflow?',
        'Transforming how you handle bulk materials',
      ],
      Amiable: [
        'Making long-load work easier for your team',
        'Reducing the stress of handling oversized materials',
        'A smoother approach to your toughest loads',
      ],
    },
    'ROI & Total Cost of Ownership': {
      Driver: [
        'The payback math on fleet consolidation',
        'Cutting material handling costs 40-60%',
        'Hard numbers on forklift fleet ROI',
      ],
      Analytical: [
        'TCO model: fleet consolidation savings breakdown',
        'ROI analysis framework for equipment investment',
        'Quantifying fleet reduction and space savings',
      ],
      Expressive: [
        'An investment that pays for itself in months',
        'The savings story that writes itself',
        'Building the business case for smarter equipment',
      ],
      Amiable: [
        'Making the budget work for your team',
        'A smart investment that simplifies everything',
        'Good news for your budget and your team',
      ],
    },
    'Fleet Management & Maintenance': {
      Driver: [
        'Simplifying fleet management in one step',
        'Fleet right-sizing: fewer machines, better results',
        'Cutting fleet complexity by 60%',
      ],
      Analytical: [
        'Fleet complexity metrics and simplification data',
        'Maintenance cost analysis: consolidated vs. mixed fleet',
        'Fleet utilization benchmarks and optimization',
      ],
      Expressive: [
        'What a perfectly right-sized fleet looks like',
        'From fleet headaches to fleet confidence',
        'The fleet management transformation',
      ],
      Amiable: [
        'Making fleet management easier for your team',
        'Less maintenance stress, more predictability',
        'A fleet your whole team can feel good about',
      ],
    },
  };

  const topicSubjects = subjects[topic];
  if (!topicSubjects) {
    return `Insights on ${topic.toLowerCase()} for your operation`;
  }

  const personalitySubjects = topicSubjects[personalityKey];
  if (!personalitySubjects) {
    return `Insights on ${topic.toLowerCase()}`;
  }

  return personalitySubjects[variationIndex % personalitySubjects.length];
}
