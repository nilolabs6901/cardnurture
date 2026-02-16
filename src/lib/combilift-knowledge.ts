export interface CombiliftProduct {
  description: string;
  idealFor: string[];
  keyBenefit: string;
  safetyAngle: string;
  roiAngle: string;
}

export const COMBILIFT_PRODUCTS: Record<string, CombiliftProduct> = {
  'C-Series': {
    description:
      'Multi-directional forklift capable of handling long and bulky loads in confined spaces. Operates in forward, sideways, and diagonal directions.',
    idealFor: [
      'lumber',
      'timber',
      'steel',
      'pipes',
      'tubing',
      'PVC',
      'bar stock',
      'extrusions',
      'precast concrete',
      'building materials',
      'manufacturing',
      'construction',
      'warehouse',
      'distribution',
    ],
    keyBenefit:
      'Safely transport long loads through narrow aisles, reducing aisle widths by up to 50% and dramatically increasing storage capacity.',
    safetyAngle:
      'Eliminates the need for side-loading with conventional forklifts, reducing tip-over risk and product damage when handling long loads.',
    roiAngle:
      'Replaces multiple machines (forklift, sideloader, crane) with one unit. Reclaim up to 50% of wasted floor space for additional storage or production.',
  },
  'Aisle-Master': {
    description:
      'Articulated very narrow aisle (VNA) forklift that operates in aisles as narrow as 1.6 meters. Ideal for maximizing pallet storage in tight warehouse environments.',
    idealFor: [
      'warehouse',
      'distribution',
      'cold storage',
      'freezer',
      'food',
      'beverage',
      'pharmaceutical',
      'retail',
      '3PL',
      'logistics',
      'e-commerce',
      'fulfillment',
    ],
    keyBenefit:
      'Operates in aisles as narrow as 1.6m while maintaining the ability to work both indoors and outdoors, unlike rail-guided VNA trucks.',
    safetyAngle:
      'Articulated steering provides superior visibility and stability. No guide rails needed, eliminating rail-related accidents and infrastructure costs.',
    roiAngle:
      'Increase pallet positions by up to 50% in existing facilities. Avoid costly warehouse expansion or new facility investment.',
  },
  'Straddle-Carrier': {
    description:
      'Mobile gantry system for moving containers, precast concrete, and oversized loads. Can lift and transport loads that conventional forklifts cannot handle.',
    idealFor: [
      'port',
      'terminal',
      'container',
      'shipping',
      'precast',
      'concrete',
      'modular construction',
      'heavy manufacturing',
      'wind energy',
      'infrastructure',
      'marine',
    ],
    keyBenefit:
      'Move oversized and heavy loads (up to 80+ tonnes) without fixed crane infrastructure. Fully mobile and repositionable.',
    safetyAngle:
      'Eliminates overhead crane dependency and reduces ground-level personnel interaction with suspended loads. Remote operation capability.',
    roiAngle:
      'Replaces expensive fixed crane installations. Mobile deployment across multiple job sites maximizes equipment utilization.',
  },
  'Combi-WR': {
    description:
      'Multi-directional pedestrian or stand-on reach truck for indoor warehouse applications. Combines reach truck precision with multi-directional capability.',
    idealFor: [
      'warehouse',
      'manufacturing',
      'retail',
      'wholesale',
      'small footprint',
      'indoor',
      'narrow aisle',
      'racking',
      'storage',
    ],
    keyBenefit:
      'Pedestrian-operated multi-directional reach truck that handles both pallets and long loads in very narrow aisles.',
    safetyAngle:
      'Pedestrian operation keeps the operator at ground level with clear sight lines. Low center of gravity enhances load stability.',
    roiAngle:
      'Lower acquisition cost than ride-on counterparts. Reduced energy consumption and maintenance costs for indoor applications.',
  },
  'Combi-CS': {
    description:
      'Counterbalance stacker combining the benefits of a counterbalance forklift with a pedestrian stacker. Compact, versatile, and ideal for lighter-duty applications.',
    idealFor: [
      'light manufacturing',
      'retail',
      'wholesale',
      'workshop',
      'maintenance',
      'facility management',
      'small warehouse',
      'loading dock',
    ],
    keyBenefit:
      'Compact counterbalance design requires no legs or straddle arms, allowing it to work flush against walls and in tight dock areas.',
    safetyAngle:
      'Pedestrian operation with intuitive controls and excellent visibility. Low step-on platform for easy and safe mounting.',
    roiAngle:
      'Affordable entry-level solution that replaces manual handling. Reduces workplace injury costs and improves throughput for smaller operations.',
  },
};

export const VALUE_PILLARS = {
  safety: {
    headline: 'Safety First: Protecting Your Team and Your Bottom Line',
    stats: [
      'Forklift accidents cause approximately 85 deaths and 34,900 serious injuries annually in the US (OSHA)',
      'OSHA fines for forklift violations can exceed $150,000 per incident',
      'Combilift multi-directional design eliminates blind-spot turning with long loads',
      'Pedestrian-operated models remove the operator from the seat, reducing tip-over fatality risk',
      'Articulated steering provides superior visibility compared to conventional counterbalance trucks',
    ],
    relevance:
      'Every company handling materials cares about worker safety. Lead with safety to establish trust and concern for their people.',
  },
  efficiency: {
    headline: 'Operational Efficiency: Do More with Less',
    stats: [
      'Combilift trucks can replace 3+ conventional machines (forklift, sideloader, crane)',
      'Multi-directional capability reduces product handling steps by up to 60%',
      'Aisle-Master trucks operate in aisles as narrow as 1.6m vs 3.5m for conventional trucks',
      'Average load/unload cycle time reduced by 30-40% with purpose-built Combilift equipment',
      'One operator can handle tasks that previously required two or more workers',
    ],
    relevance:
      'Efficiency improvements directly impact profitability. Quantify time and labor savings for maximum impact.',
  },
  storage: {
    headline: 'Space Optimization: Unlock Hidden Capacity',
    stats: [
      'Narrow aisle operation can increase storage capacity by up to 50%',
      'Guided aisle systems not required, saving $50,000-$200,000 in rail infrastructure',
      'Multi-directional forklifts allow storage right up to walls and in corners',
      'Average facility reclaims 30-40% of floor space after switching to Combilift',
      'Avoid $5M-$20M new facility costs by maximizing existing space',
    ],
    relevance:
      'Warehouse space is expensive, especially in Florida metro areas. Frame Combilift as a space multiplier.',
  },
  roi: {
    headline: 'ROI & Total Cost of Ownership',
    stats: [
      'Typical payback period of 6-18 months through space savings alone',
      'Reduced product damage saves 2-5% of annual material costs',
      'Lower maintenance costs vs. maintaining multiple specialized machines',
      'Energy-efficient electric models reduce fuel costs by 60-80% vs. diesel/LPG',
      'Extended equipment lifespan of 15-20 years with proper maintenance',
    ],
    relevance:
      'Decision-makers need financial justification. Always quantify the value proposition in dollars and timeframes.',
  },
} as const;

export type ValuePillar = keyof typeof VALUE_PILLARS;

export const FLORIDA_INDUSTRIES: string[] = [
  'Aerospace & Defense',
  'Agriculture & Citrus',
  'Automotive Parts & Distribution',
  'Beverage & Bottling',
  'Boat & Marine Manufacturing',
  'Building Materials & Lumber',
  'Cold Storage & Refrigerated Warehousing',
  'Construction & Infrastructure',
  'E-Commerce Fulfillment',
  'Food Processing & Packaging',
  'Furniture & Fixtures',
  'Healthcare & Pharmaceutical',
  'Hospitality & Resort Supply Chain',
  'HVAC & Mechanical',
  'Lumber & Timber',
  'Marine & Port Operations',
  'Metal Fabrication & Steel',
  'Modular & Precast Construction',
  'Paper & Packaging',
  'Plastics & Composites',
  'Plumbing & Pipe Distribution',
  'Renewable Energy & Solar',
  'Retail & Wholesale Distribution',
  'Third-Party Logistics (3PL)',
  'Waste Management & Recycling',
];

export function matchProductToIndustry(
  industry: string,
  keywords: string[]
): string {
  const searchTerms = [
    industry.toLowerCase(),
    ...keywords.map((k) => k.toLowerCase()),
  ];

  let bestMatch = 'C-Series';
  let bestScore = 0;

  for (const [productName, product] of Object.entries(COMBILIFT_PRODUCTS)) {
    let score = 0;
    for (const term of searchTerms) {
      for (const idealTerm of product.idealFor) {
        if (
          term.includes(idealTerm.toLowerCase()) ||
          idealTerm.toLowerCase().includes(term)
        ) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = productName;
    }
  }

  return bestMatch;
}

export function getRelevantStats(
  pillar: 'safety' | 'efficiency' | 'storage' | 'roi'
): string[] {
  const pillarData = VALUE_PILLARS[pillar];
  if (!pillarData) {
    return [];
  }
  return [...pillarData.stats];
}
