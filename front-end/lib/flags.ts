/**
 * Flag emoji lookup. Uses regional-indicator pairs derived from ISO 3166-1
 * alpha-2 codes, with subdivision tags for the UK home nations, which have no
 * standalone ISO code but do have widely rendered emoji sequences.
 */

const SUBDIVISION: Record<string, string> = {
  England: "gbeng",
  Scotland: "gbsct",
  Wales: "gbwls",
  "Northern Ireland": "gbnir",
};

const OVERRIDES: Record<string, string> = {
  ...SUBDIVISION,
  "USA": "us",
  "United States": "us",
  "IR Iran": "ir",
  Iran: "ir",
  "Korea Republic": "kr",
  "South Korea": "kr",
  "Korea DPR": "kp",
  "Côte d'Ivoire": "ci",
  "Ivory Coast": "ci",
  "Curaçao": "cw",
  Curacao: "cw",
  "Cape Verde": "cv",
  "Czech Republic": "cz",
  "Czechia": "cz",
  "DR Congo": "cd",
  "Democratic Republic of the Congo": "cd",
  "Bosnia & Herzegovina": "ba",
  "Bosnia and Herzegovina": "ba",
  Turkey: "tr",
  "Türkiye": "tr",
};

function toRegional(code: string): string {
  return [...code.toLowerCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function flagEmoji(country: string | null | undefined): string {
  if (!country) return "🏳️";
  const override = OVERRIDES[country];
  if (override) return toRegional(override);

  // "United States" -> "US"
  const words = country.trim().split(/\s+/);
  if (words.length === 2 && words[0] === "United") {
    return toRegional(`${words[1][0]}S`);
  }

  const alpha2 = country.slice(0, 2);
  if (alpha2.length !== 2 || !/^[A-Za-z]{2}$/.test(alpha2)) return "🏳️";
  return toRegional(alpha2);
}

export function flagUrl(country: string | null | undefined): string | null {
  if (!country) return null;
  const override = OVERRIDES[country];
  if (override) return `https://flagcdn.com/${override}.svg`;

  const words = country.trim().split(/\s+/);
  let code: string | null = null;
  if (words.length === 2 && words[0] === "United") code = `${words[1][0]}s`;
  else if (/^[A-Za-z]{2}$/.test(country.slice(0, 2))) code = country.slice(0, 2).toLowerCase();

  return code ? `https://flagcdn.com/${code}.svg` : null;
}