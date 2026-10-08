const ISO = {
  DZA: "dz", AGO: "ao", ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BOL: "bo",
  BIH: "ba", BRA: "br", BGR: "bg", CMR: "cm", CAN: "ca", CHL: "cl", CHN: "cn",
  COL: "co", CRI: "cr", HRV: "hr", CUB: "cu", CZE: "cz", DNK: "dk", ECU: "ec",
  EGY: "eg", SLV: "sv", FRA: "fr", DEU: "de", GHA: "gh", GRC: "gr", HTI: "ht", HND: "hn",
  HUN: "hu", ISL: "is", IRN: "ir", IRQ: "iq", ISR: "il", ITA: "it", CIV: "ci",
  JAM: "jm", JPN: "jp", KWT: "kw", MEX: "mx", MAR: "ma", NLD: "nl", NZL: "nz",
  NGA: "ng", PRK: "kp", NOR: "no", PAN: "pa", PRY: "py", PER: "pe", POL: "pl",
  PRT: "pt", QAT: "qa", IRL: "ie", ROU: "ro", RUS: "ru", SAU: "sa", SEN: "sn",
  SRB: "rs", SCG: "rs", SVK: "sk", SVN: "si", ZAF: "za", KOR: "kr", ESP: "es",
  SWE: "se", CHE: "ch", TGO: "tg", TTO: "tt", TUN: "tn", TUR: "tr", UKR: "ua",
  ARE: "ae", USA: "us", URY: "uy", CPV: "cv", CUW: "cw", JOR: "jo", UZB: "uz",
  CRC: "cr", CIV_ALT: "ci", KSA: "sa", UAE: "ae", TPE: "tw", HKG: "hk",
};

const UK_SUBDIVISION = {
  ENG: "gbeng",
  SCO: "gbsct",
  WAL: "gbwls",
  NIR: "gbnir",
};

const HISTORICAL = {
  CSK: { flag: "cz", since: "Czechoslovakia", replacedBy: "CZE" },
  DDR: { flag: "de", since: "East Germany", replacedBy: "DEU" },
  YUG: { flag: "rs", since: "Yugoslavia", replacedBy: "SRB" },
  SUN: { flag: "ru", since: "Soviet Union", replacedBy: "RUS" },
  COD: { flag: "cd", since: "Zaire", replacedBy: "COD" },
  IDN: { flag: "id", since: "Dutch East Indies", replacedBy: "IDN" },
};

const WEST_GERMANY = "de";

export const TEAM_OVERRIDES = {
  "cabo verde": { code: "CPV", confederation: "CAF", region: "Africa", flagCode: "cv" },
  curacao: { code: "CUW", confederation: "CONCACAF", region: "North America", flagCode: "cw" },
  "curaçao": { code: "CUW", confederation: "CONCACAF", region: "North America", flagCode: "cw" },
  jordan: { code: "JOR", confederation: "AFC", region: "Asia", flagCode: "jo" },
  uzbekistan: { code: "UZB", confederation: "AFC", region: "Asia", flagCode: "uz" },
  haiti: { code: "HAI", confederation: "CONCACAF", region: "North America", flagCode: "ht" },
};

export const VENUE_OVERRIDES = {
  "mexico city stadium": { name: "Estadio Azteca", city: "Mexico City", country: "Mexico", capacity: 87523 },
  "guadalajara stadium": { name: "Estadio Akron", city: "Guadalajara", country: "Mexico", capacity: 46232 },
  "monterrey stadium": { name: "Estadio BBVA", city: "Monterrey", country: "Mexico", capacity: 53500 },
  "atlanta stadium": { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "United States", capacity: 71000 },
  "toronto stadium": { name: "BMO Field", city: "Toronto", country: "Canada", capacity: 30991 },
  "san francisco bay area stadium": { name: "Levi's Stadium", city: "Santa Clara", country: "United States", capacity: 68500 },
  "los angeles stadium": { name: "SoFi Stadium", city: "Inglewood", country: "United States", capacity: 70240 },
  "bc place vancouver": { name: "BC Place", city: "Vancouver", country: "Canada", capacity: 54500 },
  "seattle stadium": { name: "Lumen Field", city: "Seattle", country: "United States", capacity: 68740 },
  "new york/new jersey stadium": { name: "MetLife Stadium", city: "East Rutherford", country: "United States", capacity: 82500 },
  "boston stadium": { name: "Gillette Stadium", city: "Foxborough", country: "United States", capacity: 65878 },
  "philadelphia stadium": { name: "Lincoln Financial Field", city: "Philadelphia", country: "United States", capacity: 69176 },
  "miami stadium": { name: "Hard Rock Stadium", city: "Miami Gardens", country: "United States", capacity: 65326 },
  "houston stadium": { name: "NRG Stadium", city: "Houston", country: "United States", capacity: 72220 },
  "kansas city stadium": { name: "Arrowhead Stadium", city: "Kansas City", country: "United States", capacity: 76416 },
  "dallas stadium": { name: "AT&T Stadium", city: "Arlington", country: "United States", capacity: 80000 },
};

export function flagForCode(code, teamName) {
  if (!code) return null;
  const upper = code.toUpperCase();
  if (UK_SUBDIVISION[upper]) {
    return { flagCode: UK_SUBDIVISION[upper], historical: false, subdivision: true };
  }
  if (HISTORICAL[upper]) {
    const h = HISTORICAL[upper];
    return { flagCode: h.flag, historical: true, formerName: h.since };
  }
  if (upper === "DEU" && teamName === "West Germany") {
    return { flagCode: WEST_GERMANY, historical: true, formerName: "West Germany" };
  }
  const iso = ISO[upper];
  if (!iso) return null;
  return { flagCode: iso, historical: false };
}

const NAME_ALIASES = new Map(
  Object.entries({
    "west germany": "West Germany",
    "east germany": "East Germany",
    "german dr": "East Germany",
    "soviet union": "Soviet Union",
    "ussr": "Soviet Union",
    yugoslavia: "Yugoslavia",
    czechoslovakia: "Czechoslovakia",
    zaire: "Zaire",
    "zaire dr": "Zaire",
    "democratic republic of the congo": "Zaire",
    "dr congo": "Zaire",
    "congo dr": "Zaire",
    "congo": "Zaire",
    "congolese": "Zaire",
    "indonesia": "Dutch East Indies",
    "netherlands indies": "Dutch East Indies",
    "korea republic": "South Korea",
    "korea dpr": "North Korea",
    "south korea": "South Korea",
    "republic of korea": "South Korea",
    "north korea": "North Korea",
    "korea democratic peoples republic": "North Korea",
    "ir iran": "Iran",
    "iran": "Iran",
    "cote divoire": "Ivory Coast",
    "côte divoire": "Ivory Coast",
    "cote d ivoire": "Ivory Coast",
    czechia: "Czech Republic",
    "czech republic": "Czech Republic",
    turkey: "Turkey",
    "turkiye": "Turkey",
    "türkiye": "Turkey",
    usa: "United States",
    "united states": "United States",
    "united states of america": "United States",
    holland: "Netherlands",
    "the netherlands": "Netherlands",
    netherlands: "Netherlands",
    "republic of ireland": "Republic of Ireland",
    ireland: "Republic of Ireland",
    "bosnia": "Bosnia and Herzegovina",
    "bosnia and herzegovina": "Bosnia and Herzegovina",
    "bosnia & herzegovina": "Bosnia and Herzegovina",
    "serbia and montenegro": "Serbia and Montenegro",
    "trinidad": "Trinidad and Tobago",
    "china pr": "China",
    "china": "China",
    "hong kong": "Hong Kong",
    "united arab emirates": "United Arab Emirates",
    uae: "United Arab Emirates",
    "saudi arabia": "Saudi Arabia",
    "south africa": "South Africa",
    "new zealand": "New Zealand",
    "south africa ": "South Africa",
    "wales ": "Wales",
  }).map(([k, v]) => [k, v])
);

export function stripDiacritics(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeTeamName(name) {
  if (!name) return "";
  const base = stripDiacritics(String(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const alias = NAME_ALIASES.get(base);
  if (alias) return alias;
  return String(name).trim();
}

export function flagUrl(flagCode, width = 40) {
  if (!flagCode) return null;
  return `https://flagcdn.com/w${width}/${flagCode}.png`;
}

export function flagSvgUrl(flagCode) {
  if (!flagCode) return null;
  return `https://flagcdn.com/${flagCode}.svg`;
}