export const REPORT_CATEGORIES = [
  'Streets',
  'Lighting',
  'Transit',
  'Trees',
  'Sanitation',
  'Parks',
  'Noise',
  'Other'
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
