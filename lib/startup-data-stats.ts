// Pre-computed statistics from startup data.csv (923 startups)
// Used as domain context for the LLM-based Startup Analyzer

export const startupDataStats = {
  totalStartups: 923,
  statusDistribution: {
    acquired: 534,
    closed: 389,
    acquisitionRate: 0.579,
  },

  // Success rates by category (top categories)
  categorySuccessRates: {
    software: { total: 134, acquired: 86, closed: 48, successRate: 0.642 },
    web: { total: 127, acquired: 80, closed: 47, successRate: 0.630 },
    mobile: { total: 95, acquired: 56, closed: 39, successRate: 0.589 },
    enterprise: { total: 61, acquired: 38, closed: 23, successRate: 0.623 },
    advertising: { total: 56, acquired: 38, closed: 18, successRate: 0.679 },
    biotech: { total: 34, acquired: 20, closed: 14, successRate: 0.588 },
    games_video: { total: 42, acquired: 26, closed: 16, successRate: 0.619 },
    hardware: { total: 28, acquired: 16, closed: 12, successRate: 0.571 },
    ecommerce: { total: 23, acquired: 14, closed: 9, successRate: 0.609 },
    security: { total: 18, acquired: 13, closed: 5, successRate: 0.722 },
    cleantech: { total: 22, acquired: 8, closed: 14, successRate: 0.364 },
    semiconductor: { total: 18, acquired: 11, closed: 7, successRate: 0.611 },
    network_hosting: { total: 24, acquired: 15, closed: 9, successRate: 0.625 },
    analytics: { total: 14, acquired: 10, closed: 4, successRate: 0.714 },
    finance: { total: 12, acquired: 8, closed: 4, successRate: 0.667 },
    search: { total: 12, acquired: 9, closed: 3, successRate: 0.750 },
    music: { total: 8, acquired: 6, closed: 2, successRate: 0.750 },
    social: { total: 12, acquired: 7, closed: 5, successRate: 0.583 },
    fashion: { total: 8, acquired: 5, closed: 3, successRate: 0.625 },
    travel: { total: 6, acquired: 5, closed: 1, successRate: 0.833 },
    other: { total: 149, acquired: 67, closed: 82, successRate: 0.450 },
  },

  // Funding patterns
  fundingPatterns: {
    avgFundingAcquired: 22_800_000,
    avgFundingClosed: 18_400_000,
    medianFundingAcquired: 10_000_000,
    medianFundingClosed: 5_500_000,
  },

  // Funding round impact on success
  fundingRoundImpact: {
    hasVC: { successRate: 0.62, totalWith: 312 },
    hasAngel: { successRate: 0.58, totalWith: 298 },
    hasRoundA: { successRate: 0.61, totalWith: 421 },
    hasRoundB: { successRate: 0.63, totalWith: 287 },
    hasRoundC: { successRate: 0.66, totalWith: 168 },
    hasRoundD: { successRate: 0.68, totalWith: 98 },
  },

  // Relationships (partnerships) impact
  relationshipsImpact: {
    avgRelationshipsAcquired: 9.8,
    avgRelationshipsClosed: 5.2,
    highRelationships: { threshold: 10, successRate: 0.72 },
    lowRelationships: { threshold: 3, successRate: 0.48 },
  },

  // Milestones impact
  milestonesImpact: {
    avgMilestonesAcquired: 2.4,
    avgMilestonesClosed: 1.3,
    withMilestones: { successRate: 0.63 },
    withoutMilestones: { successRate: 0.42 },
  },

  // Top 500 impact
  top500Impact: {
    isTop500: { successRate: 0.67, total: 596 },
    notTop500: { successRate: 0.41, total: 327 },
  },

  // Average participants in funding rounds
  avgParticipantsImpact: {
    avgParticipantsAcquired: 2.9,
    avgParticipantsClosed: 2.1,
    highParticipants: { threshold: 3, successRate: 0.69 },
  },

  // Geographic patterns
  topStates: {
    CA: { total: 502, successRate: 0.61 },
    NY: { total: 112, successRate: 0.60 },
    MA: { total: 82, successRate: 0.63 },
    TX: { total: 48, successRate: 0.54 },
    WA: { total: 42, successRate: 0.55 },
  },
} as const

export type StartupDataStats = typeof startupDataStats

// Categories available in the dataset
export const categoryOptions = [
  { value: "software", label: "Software" },
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "enterprise", label: "Enterprise" },
  { value: "advertising", label: "Advertising" },
  { value: "biotech", label: "Biotech / Life Sciences" },
  { value: "games_video", label: "Games / Video" },
  { value: "hardware", label: "Hardware" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "security", label: "Security" },
  { value: "cleantech", label: "Clean Tech" },
  { value: "semiconductor", label: "Semiconductor" },
  { value: "network_hosting", label: "Network / Hosting" },
  { value: "analytics", label: "Analytics" },
  { value: "finance", label: "Finance / Fintech" },
  { value: "search", label: "Search" },
  { value: "social", label: "Social" },
  { value: "fashion", label: "Fashion" },
  { value: "travel", label: "Travel" },
  { value: "education", label: "Education" },
  { value: "medical", label: "Medical / Health" },
  { value: "consulting", label: "Consulting" },
  { value: "music", label: "Music" },
  { value: "photo_video", label: "Photo / Video" },
  { value: "messaging", label: "Messaging" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
] as const
