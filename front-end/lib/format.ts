/** Presentation helpers shared across pages. */

const CONFEDERATION_BY_NAME: Record<string, string> = {
  Argentina: "CONMEBOL",
  Brazil: "CONMEBOL",
  Uruguay: "CONMEBOL",
  Colombia: "CONMEBOL",
  Ecuador: "CONMEBOL",
  Paraguay: "CONMEBOL",
  Chile: "CONMEBOL",
  Peru: "CONMEBOL",
  Venezuela: "CONMEBOL",
  Bolivia: "CONMEBOL",
  France: "UEFA",
  Spain: "UEFA",
  England: "UEFA",
  Portugal: "UEFA",
  Germany: "UEFA",
  Netherlands: "UEFA",
  Belgium: "UEFA",
  Italy: "UEFA",
  Croatia: "UEFA",
  Switzerland: "UEFA",
  Austria: "UEFA",
  Denmark: "UEFA",
  Norway: "UEFA",
  Sweden: "UEFA",
  Poland: "UEFA",
  Scotland: "UEFA",
  Wales: "UEFA",
  "Czech Republic": "UEFA",
  "Bosnia & Herzegovina": "UEFA",
  Turkey: "UEFA",
  Serbia: "UEFA",
  Ukraine: "UEFA",
  "Republic of Ireland": "UEFA",
  Romania: "UEFA",
  Hungary: "UEFA",
  Greece: "UEFA",
  Albania: "UEFA",
  Iceland: "UEFA",
  Slovenia: "UEFA",
  Slovakia: "UEFA",
  "North Macedonia": "UEFA",
  Morocco: "CAF",
  Senegal: "CAF",
  Egypt: "CAF",
  Algeria: "CAF",
  "Côte d'Ivoire": "CAF",
  Ghana: "CAF",
  Cameroon: "CAF",
  Tunisia: "CAF",
  Mali: "CAF",
  "South Africa": "CAF",
  "Cape Verde": "CAF",
  Nigeria: "CAF",
  "Guinea": "CAF",
  "DR Congo": "CAF",
  Japan: "AFC",
  "South Korea": "AFC",
  Iran: "AFC",
  Australia: "AFC",
  "Saudi Arabia": "AFC",
  Qatar: "AFC",
  Uzbekistan: "AFC",
  Iraq: "AFC",
  Jordan: "AFC",
  China: "AFC",
  "New Zealand": "OFC",
  USA: "CONCACAF",
  Mexico: "CONCACAF",
  Canada: "CONCACAF",
  Panama: "CONCACAF",
  "Costa Rica": "CONCACAF",
  Jamaica: "CONCACAF",
  Honduras: "CONCACAF",
  Curaçao: "CONCACAF",
  Haiti: "CONCACAF",
};

export function confederationOf(country: string): string {
  return CONFEDERATION_BY_NAME[country] ?? "Other";
}

export const CONFEDERATIONS = [
  "All",
  "UEFA",
  "CONMEBOL",
  "CONCACAF",
  "CAF",
  "AFC",
  "OFC",
] as const;

export const CONFEDERATION_COLORS: Record<string, string> = {
  UEFA: "#5b8cff",
  CONMEBOL: "#ffc83d",
  CONCACAF: "#18d6c1",
  CAF: "#ff3d81",
  AFC: "#ff6b4a",
  OFC: "#a78bfa",
  Other: "#b9aee8",
};

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Group stage",
  R16: "Round of 16",
  R32: "Round of 32",
  QUARTER_FINAL: "Quarter-final",
  SEMI_FINAL: "Semi-final",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
  FINAL_ROUND: "Final round (decisive group)",
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "TBC";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "TBC";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "TBC";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "TBC";
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("en-GB");
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** Deterministic 32-bit hash. Avoids Math.random so SSR and client agree. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}