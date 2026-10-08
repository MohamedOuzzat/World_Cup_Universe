/**
 * Flag lookup by team/country name or by the flagCode stored in the dataset.
 *
 * Two entry points:
 *  - flagUrl(name)          -> from a country/team name ("Spain" -> flagcdn.com/es.svg)
 *  - flagUrlFromCode(code)  -> from a dataset flagCode ("gbeng" -> flagcdn.com/gb-eng.svg)
 *
 * Codes are ISO 3166-1 alpha-2 as used by flagcdn.com, with the UN M.49
 * subdivision codes for the UK home nations (flagcdn serves gb-eng, gb-sct,
 * gb-wls, gb-nir).
 */

/** UK subdivision codes stored in the dataset as emoji tags (gbeng …). */
const SUBDIVISION_CODES: Record<string, string> = {
  gbeng: "gb-eng",
  gbsct: "gb-sct",
  gbwls: "gb-wls",
  gbnir: "gb-nir",
  "gb-eng": "gb-eng",
  "gb-sct": "gb-sct",
  "gb-wls": "gb-wls",
  "gb-nir": "gb-nir",
};

/** Every national team that can appear in the UI, mapped to its flag code. */
const NAME_TO_CODE: Record<string, string> = {
  // UEFA
  Albania: "al",
  Andorra: "ad",
  Armenia: "am",
  Austria: "at",
  Azerbaijan: "az",
  Belarus: "by",
  Belgium: "be",
  "Bosnia and Herzegovina": "ba",
  "Bosnia & Herzegovina": "ba",
  Bulgaria: "bg",
  Croatia: "hr",
  Cyprus: "cy",
  "Czech Republic": "cz",
  Czechia: "cz",
  Czechoslovakia: "cz",
  Denmark: "dk",
  England: "gb-eng",
  Estonia: "ee",
  Finland: "fi",
  France: "fr",
  Georgia: "ge",
  Germany: "de",
  "West Germany": "de",
  "East Germany": "de",
  Greece: "gr",
  Hungary: "hu",
  Iceland: "is",
  Israel: "il",
  Italy: "it",
  Kazakhstan: "kz",
  Kosovo: "xk",
  Latvia: "lv",
  Liechtenstein: "li",
  Lithuania: "lt",
  Luxembourg: "lu",
  Malta: "mt",
  Moldova: "md",
  Montenegro: "me",
  Netherlands: "nl",
  "Northern Ireland": "gb-nir",
  "North Macedonia": "mk",
  Norway: "no",
  Poland: "pl",
  Portugal: "pt",
  "Republic of Ireland": "ie",
  Romania: "ro",
  Russia: "ru",
  "Soviet Union": "ru",
  "San Marino": "sm",
  Scotland: "gb-sct",
  Serbia: "rs",
  "Serbia and Montenegro": "rs",
  Yugoslavia: "rs",
  Slovakia: "sk",
  Slovenia: "si",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  Turkey: "tr",
  "Türkiye": "tr",
  Ukraine: "ua",
  "United Kingdom": "gb",
  Wales: "gb-wls",

  // CONMEBOL
  Argentina: "ar",
  Bolivia: "bo",
  Brazil: "br",
  Chile: "cl",
  Colombia: "co",
  Ecuador: "ec",
  Paraguay: "py",
  Peru: "pe",
  Uruguay: "uy",
  Venezuela: "ve",

  // CONCACAF
  Canada: "ca",
  "Costa Rica": "cr",
  "Cuba": "cu",
  "Curaçao": "cw",
  Curacao: "cw",
  "Dominican Republic": "do",
  "El Salvador": "sv",
  Guatemala: "gt",
  Haiti: "ht",
  Honduras: "hn",
  Jamaica: "jm",
  Mexico: "mx",
  "Netherlands Antilles": "cw",
  Nicaragua: "ni",
  Panama: "pa",
  "Puerto Rico": "pr",
  "Trinidad and Tobago": "tt",
  "United States": "us",
  USA: "us",
  "US": "us",

  // CAF
  Algeria: "dz",
  Angola: "ao",
  Benin: "bj",
  "Botswana": "bw",
  "Burkina Faso": "bf",
  Cameroon: "cm",
  "Cape Verde": "cv",
  "Cabo Verde": "cv",
  "Central African Republic": "cf",
  Chad: "td",
  Comoros: "km",
  "Congo": "cg",
  "DR Congo": "cd",
  "Democratic Republic of the Congo": "cd",
  "Egypt": "eg",
  "Equatorial Guinea": "gq",
  Eritrea: "er",
  Eswatini: "sz",
  Ethiopia: "et",
  Gabon: "ga",
  Gambia: "gm",
  Ghana: "gh",
  Guinea: "gn",
  "Guinea-Bissau": "gw",
  "Ivory Coast": "ci",
  "Côte d'Ivoire": "ci",
  Kenya: "ke",
  Lesotho: "ls",
  Liberia: "lr",
  Libya: "ly",
  Madagascar: "mg",
  Malawi: "mw",
  Mali: "ml",
  Mauritania: "mr",
  Mauritius: "mu",
  Morocco: "ma",
  Mozambique: "mz",
  Namibia: "na",
  Niger: "ne",
  Nigeria: "ng",
  Rwanda: "rw",
  "Sao Tome and Principe": "st",
  Senegal: "sn",
  "Seychelles": "sc",
  "Sierra Leone": "sl",
  Somalia: "so",
  "South Africa": "za",
  "South Sudan": "ss",
  Sudan: "sd",
  Tanzania: "tz",
  Togo: "tg",
  Tunisia: "tn",
  Uganda: "ug",
  Zambia: "zm",
  Zimbabwe: "zw",
  Zaire: "cd",

  // AFC
  Afghanistan: "af",
  Australia: "au",
  Bahrain: "bh",
  Bangladesh: "bd",
  Bhutan: "bt",
  Brunei: "bn",
  Cambodia: "kh",
  China: "cn",
  "Chinese Taipei": "tw",
  "Hong Kong": "hk",
  India: "in",
  Indonesia: "id",
  "Dutch East Indies": "id",
  Iran: "ir",
  "IR Iran": "ir",
  Iraq: "iq",
  Japan: "jp",
  Jordan: "jo",
  "Korea Republic": "kr",
  "South Korea": "kr",
  "Korea DPR": "kp",
  "North Korea": "kp",
  Kuwait: "kw",
  Kyrgyzstan: "kg",
  Laos: "la",
  Lebanon: "lb",
  Macau: "mo",
  Malaysia: "my",
  Maldives: "mv",
  Mongolia: "mn",
  Myanmar: "mm",
  Nepal: "np",
  Oman: "om",
  Pakistan: "pk",
  Palestine: "ps",
  Philippines: "ph",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Singapore: "sg",
  "Sri Lanka": "lk",
  Syria: "sy",
  Tajikistan: "tj",
  Thailand: "th",
  "Timor-Leste": "tl",
  Turkmenistan: "tm",
  "United Arab Emirates": "ae",
  UAE: "ae",
  Uzbekistan: "uz",
  Vietnam: "vn",
  Yemen: "ye",

  // OFC
  "American Samoa": "as",
  "Cook Islands": "ck",
  Fiji: "fj",
  "New Caledonia": "nc",
  "New Zealand": "nz",
  "Papua New Guinea": "pg",
  "Samoa": "ws",
  "Solomon Islands": "sb",
  Tahiti: "pf",
  "Tonga": "to",
  "Vanuatu": "vu",
};

/** Common aliases that show up in fixtures and datasets. */
const ALIASES: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Czechia": "Czech Republic",
  "Türkiye": "Turkey",
  "IR Iran": "Iran",
  "Korea Republic": "South Korea",
  "Korea DPR": "North Korea",
  "USA": "United States",
  "US": "United States",
  "Côte d'Ivoire": "Ivory Coast",
  "Cabo Verde": "Cape Verde",
};

function normalizeName(name: string): string {
  const trimmed = name.trim();
  return ALIASES[trimmed] ?? trimmed;
}

/** ISO-style code for a flagcdn URL, or null when the team is unknown. */
export function codeForCountry(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = normalizeName(name);
  const direct = NAME_TO_CODE[key];
  if (direct) return direct;
  const lower = key.toLowerCase();
  for (const [candidate, code] of Object.entries(NAME_TO_CODE)) {
    if (candidate.toLowerCase() === lower) return code;
  }
  return null;
}

/**
 * Resolves a dataset flagCode ("br", "gbeng") to a flagcdn code.
 * Accepts country names too, so callers can pass either.
 */
export function flagUrlFromCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const raw = code.trim().toLowerCase();
  if (!raw) return null;
  const subdivision = SUBDIVISION_CODES[raw];
  if (subdivision) return `https://flagcdn.com/${subdivision}.svg`;
  if (/^[a-z]{2}$/.test(raw)) return `https://flagcdn.com/${raw}.svg`;
  if (/^[a-z]{2}-[a-z]{2}$/.test(raw)) return `https://flagcdn.com/${raw}.svg`;
  return codeForCountry(code) ? `https://flagcdn.com/${codeForCountry(code)}.svg` : null;
}

/** Flag image URL for a country/team name, or null when unknown. */
export function flagUrl(country: string | null | undefined): string | null {
  if (!country) return null;
  const code = codeForCountry(country);
  if (!code) return null;
  return `https://flagcdn.com/${code}.svg`;
}

function regionalIndicator(code: string): string {
  return [...code.toLowerCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

const SUBDIVISION_EMOJI: Record<string, string> = {
  "gb-eng": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  "gb-sct": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  "gb-wls": "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
  "gb-nir": "\u{1F3F4}\u{E0067}\u{E0062}\u{E006E}\u{E0069}\u{E0072}\u{E007F}",
};

/** Emoji flag for a country/team name (fallback: white flag). */
export function flagEmoji(country: string | null | undefined): string {
  if (!country) return "\u{1F3F3}\u{FE0F}";
  const code = codeForCountry(country);
  if (!code) return "\u{1F3F3}\u{FE0F}";
  return SUBDIVISION_EMOJI[code] ?? regionalIndicator(code);
}
