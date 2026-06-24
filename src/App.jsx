import { useState, useEffect, useMemo } from "react";
import logoSrc from "./assets/logo-epi-original.png";

// ============ DATA MASTER ============
const STORES = [
  { n: "EPIS TANGERANG", g: 38e9, m: 19e9, s: 5e9, seg: "TOP" },
  { n: "EPIS MALANG", g: 24.8e9, m: 12.4e9, s: 2e9, seg: "GROWTH" },
  { n: "EPIS MEDAN", g: 14.4e9, m: 7.2e9, s: 2e9, seg: "GROWTH" },
  { n: "EPIS TASIKMALAYA", g: 62.8e9, m: 31.4e9, s: 6e9, seg: "TOP" },
  { n: "EPIS SEMARANG", g: 18.8e9, m: 9.4e9, s: 3.5e9, seg: "GROWTH" },
  { n: "EPIS DURI BENGKALIS", g: 20e9, m: 10e9, s: 0.6e9, seg: "GROWTH" },
  { n: "EPIS PEKANBARU", g: 13.6e9, m: 6.8e9, s: 0.8e9, seg: "GROWTH" },
  { n: "EPIS BATAM", g: 11.2e9, m: 5.6e9, s: 2.5e9, seg: "GROWTH" },
  { n: "EPIS JAKARTA", g: 18.8e9, m: 9.4e9, s: 1e9, seg: "GROWTH" },
  { n: "EPIS TEGAL RAYA", g: 8.8e9, m: 4.4e9, s: 1.5e9, seg: "START UP" },
  { n: "EPIS BEKASI KABUPATEN", g: 19.6e9, m: 9.8e9, s: 0.2e9, seg: "GROWTH" },
  { n: "EPIS SURABAYA", g: 9.2e9, m: 4.6e9, s: 2e9, seg: "START UP" },
  { n: "EPIS JAKARTA SELATAN", g: 10.4e9, m: 5.2e9, s: 1e9, seg: "GROWTH" },
  { n: "EPIS GARUT", g: 8.4e9, m: 4.2e9, s: 0.6e9, seg: "START UP" },
  { n: "EPIS YOGYAKARTA", g: 8.4e9, m: 4.2e9, s: 1e9, seg: "START UP" },
  { n: "EPIS BENGKULU", g: 8.4e9, m: 4.2e9, s: 0.5e9, seg: "START UP" },
  { n: "EPIS DEPOK", g: 8.4e9, m: 4.2e9, s: 0.45e9, seg: "START UP" },
  { n: "EPIS JAKARTA TIMUR", g: 8.4e9, m: 4.2e9, s: 0.3e9, seg: "START UP" },
  { n: "EPIS BANDUNG KABUPATEN", g: 8.4e9, m: 4.2e9, s: 1e9, seg: "START UP" },
  { n: "EPIS BANDA ACEH", g: 8e9, m: 4e9, s: 0.8e9, seg: "START UP" },
  { n: "EPIS PONTIANAK", g: 8e9, m: 4e9, s: 0.25e9, seg: "START UP" },
  { n: "EPIS BANDUNG BARAT", g: 8e9, m: 4e9, s: 0.3e9, seg: "START UP" },
  { n: "EPIS CILEGON RAYA", g: 8e9, m: 4e9, s: 0.5e9, seg: "START UP" },
  { n: "EPIS INDRAMAYU", g: 8e9, m: 4e9, s: 0.2e9, seg: "START UP" },
  { n: "EPIS BPRS ATTAQWA", g: 9.8e9, m: 4.9e9, s: 0.1e9, seg: "START UP" },
  { n: "NEW EPIS 2", g: 9.8e9, m: 4.9e9, s: 0.1e9, seg: "START UP" },
  { n: "NEW EPIS 3", g: 9.8e9, m: 4.9e9, s: 0.1e9, seg: "START UP" },
  { n: "NEW EPIS 4", g: 9.8e9, m: 4.9e9, s: 0.1e9, seg: "START UP" },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const REWARD_START_MONTH = 5; // Program reward berlaku mulai JUN 2026.
const WEIGHTS = [0.04, 0.07, 0.09, 0.075, 0.0875, 0.0875, 0.09, 0.105, 0.105, 0.075, 0.0875, 0.0875];
const SEASON = ["Low", "Low", "Normal", "Normal", "Normal", "Normal", "Normal", "High", "High", "Normal", "Normal", "Low"];

const GPM_RATES = {
  emas: 0.04,
  perak: 0.2,
};
const PAYOUT_DISTRIBUTION = {
  monthly: 0.7,
  quarterly: 0.2,
  annual: 0.1,
};
const PAYOUT_THRESHOLDS = {
  quarterly: 80,
  annual: 85,
};
const EMAS_TIERS = [
  { min: 2.5e9, bm: 0.1, name: "Emas Tier 5" },
  { min: 2e9, bm: 0.08, name: "Emas Tier 4" },
  { min: 1.5e9, bm: 0.05, name: "Emas Tier 3" },
  { min: 1e9, bm: 0.03, name: "Emas Tier 2" },
  { min: 750e6, bm: 0.02, name: "Emas Tier 1" },
];
const PERAK_TIERS = [
  { min: 1e9, bm: 0.1, name: "Perak Tier 5" },
  { min: 750e6, bm: 0.08, name: "Perak Tier 4" },
  { min: 500e6, bm: 0.05, name: "Perak Tier 3" },
  { min: 300e6, bm: 0.03, name: "Perak Tier 2" },
  { min: 200e6, bm: 0.02, name: "Perak Tier 1" },
];

const BRANDS = [
  { code: "goldgram", name: "GOLDGRAM", field: "g", targetField: "tg", realField: "rg", color: "#fbbf24", gradient: "linear-gradient(135deg,#b8860b,#f5d78e)" },
  { code: "meezan_gold", name: "MEEZAN GOLD", field: "m", targetField: "tm", realField: "rm", color: "#86efac", gradient: "linear-gradient(135deg,#0f3d2e,#4a7a5e)" },
  { code: "silvergram", name: "SILVERGRAM", field: "s", targetField: "ts", realField: "rs", color: "#cbd5e1", gradient: "linear-gradient(135deg,#64748b,#e2e8f0)" },
];
const LOGO_SRC = logoSrc;

// Realisasi Jan-Mei 2026, full 25 EPI Store (sumber: Realisasi_Input_Jan_Mei_Import_EPI_RECHECK.csv)
// key: "storeIdx-monthIdx" -> { g, m, s, be }
const SEED_DATA = {
  "0-0": { g: 1422430000, m: 972646000, s: 1589685500, be: "Import" },
  "0-1": { g: 2045728000, m: 349749000, s: 706053800, be: "Import" },
  "0-2": { g: 1065346000, m: 709247000, s: 286522200, be: "Import" },
  "0-3": { g: 2621848000, m: 1574129000, s: 151838900, be: "Import" },
  "0-4": { g: 1354781000, m: 152254000, s: 53558100, be: "Import" },
  "1-0": { g: 2258371000, m: 186983000, s: 866478400, be: "Import" },
  "1-1": { g: 1895605000, m: 197155000, s: 305481700, be: "Import" },
  "1-2": { g: 1681214000, m: 150836000, s: 203342400, be: "Import" },
  "1-3": { g: 1331157000, m: 181507000, s: 192449100, be: "Import" },
  "1-4": { g: 347461000, m: 72633000, s: 131619000, be: "Import" },
  "2-0": { g: 758638000, m: 101806000, s: 464904800, be: "Import" },
  "2-1": { g: 85194000, m: 59100000, s: 44584300, be: "Import" },
  "2-2": { g: 464969000, m: 384702000, s: 39707800, be: "Import" },
  "2-3": { g: 0, m: 43318000, s: 19640000, be: "Import" },
  "2-4": { g: 0, m: 0, s: 0, be: "Import" },
  "3-0": { g: 286007000, m: 226700000, s: 100157600, be: "Import" },
  "3-1": { g: 349920000, m: 13942000, s: 3720500, be: "Import" },
  "3-2": { g: 0, m: 0, s: 0, be: "Import" },
  "3-3": { g: 0, m: 15304000, s: 0, be: "Import" },
  "3-4": { g: 0, m: 0, s: 0, be: "Import" },
  "4-0": { g: 773624000, m: 972646000, s: 1631509000, be: "Import" },
  "4-1": { g: 470164000, m: 439709000, s: 644821800, be: "Import" },
  "4-2": { g: 190890000, m: 903580000, s: 229648000, be: "Import" },
  "4-3": { g: 53565000, m: 466342000, s: 323755900, be: "Import" },
  "4-4": { g: 0, m: 208626000, s: 125504200, be: "Import" },
  "5-0": { g: 687813000, m: 5612000, s: 449072700, be: "Import" },
  "5-1": { g: 506111000, m: 0, s: 48576600, be: "Import" },
  "5-2": { g: 361546000, m: 4461000, s: 59088100, be: "Import" },
  "5-3": { g: 56669000, m: 3812000, s: 33155800, be: "Import" },
  "5-4": { g: 349267000, m: 3134000, s: 11675000, be: "Import" },
  "6-0": { g: 2466894000, m: 292098000, s: 467277100, be: "Import" },
  "6-1": { g: 700604000, m: 423614000, s: 33902700, be: "Import" },
  "6-2": { g: 54529000, m: 63793000, s: 34370400, be: "Import" },
  "6-3": { g: 597757000, m: 13004000, s: 24425000, be: "Import" },
  "6-4": { g: 329958000, m: 38820000, s: 6388700, be: "Import" },
  "7-0": { g: 1481027000, m: 178400000, s: 733229900, be: "Import" },
  "7-1": { g: 920631000, m: 165782000, s: 252685700, be: "Import" },
  "7-2": { g: 346632000, m: 264629000, s: 82906100, be: "Import" },
  "7-3": { g: 440665000, m: 160430000, s: 73475200, be: "Import" },
  "7-4": { g: 655663000, m: 88552000, s: 160651400, be: "Import" },
  "8-0": { g: 626122000, m: 664995000, s: 369864800, be: "Import" },
  "8-1": { g: 230995000, m: 344130000, s: 41515800, be: "Import" },
  "8-2": { g: 258098000, m: 81590000, s: 15822000, be: "Import" },
  "8-3": { g: 440049000, m: 352767000, s: 11119600, be: "Import" },
  "8-4": { g: 27482000, m: 113133000, s: 871000, be: "Import" },
  "9-0": { g: 123278000, m: 204797000, s: 344990800, be: "Import" },
  "9-1": { g: 0, m: 123033000, s: 127692300, be: "Import" },
  "9-2": { g: 2950000, m: 118743000, s: 102125300, be: "Import" },
  "9-3": { g: 30998000, m: 52985000, s: 83490700, be: "Import" },
  "9-4": { g: 0, m: 78710000, s: 19777100, be: "Import" },
  "10-0": { g: 0, m: 436478000, s: 217681800, be: "Import" },
  "10-1": { g: 0, m: 441653000, s: 42998500, be: "Import" },
  "10-2": { g: 0, m: 539522000, s: 0, be: "Import" },
  "10-3": { g: 519253000, m: 857839000, s: 0, be: "Import" },
  "10-4": { g: 84131000, m: 43758000, s: 883000, be: "Import" },
  "11-0": { g: 540960000, m: 218929000, s: 671774900, be: "Import" },
  "11-1": { g: 147656000, m: 118935000, s: 143422700, be: "Import" },
  "11-2": { g: 100440000, m: 62177000, s: 74982800, be: "Import" },
  "11-3": { g: 94961000, m: 63526000, s: 72837500, be: "Import" },
  "11-4": { g: 51646000, m: 53927000, s: 30628600, be: "Import" },
  "12-0": { g: 320658000, m: 5746000, s: 491545900, be: "Import" },
  "12-1": { g: 541886000, m: 235576000, s: 45220100, be: "Import" },
  "12-2": { g: 175130000, m: 142662000, s: 236806300, be: "Import" },
  "12-3": { g: 361049000, m: 76712000, s: 68947200, be: "Import" },
  "12-4": { g: 56192000, m: 28916000, s: 12184600, be: "Import" },
  "13-0": { g: 300125000, m: 94781000, s: 79769400, be: "Import" },
  "13-1": { g: 211477000, m: 80787000, s: 22254200, be: "Import" },
  "13-2": { g: 49458000, m: 29695000, s: 11903700, be: "Import" },
  "13-3": { g: 294768000, m: 49358000, s: 30686600, be: "Import" },
  "13-4": { g: 0, m: 13880000, s: 10235200, be: "Import" },
  "14-0": { g: 59405000, m: 120995000, s: 987613000, be: "Import" },
  "14-1": { g: 156641000, m: 293518000, s: 391109100, be: "Import" },
  "14-2": { g: 20250000, m: 45019000, s: 81200300, be: "Import" },
  "14-3": { g: 33888000, m: 59784000, s: 31175600, be: "Import" },
  "14-4": { g: 10881000, m: 48781000, s: 16742600, be: "Import" },
  "15-0": { g: 284808000, m: 445973000, s: 355593300, be: "Import" },
  "15-1": { g: 0, m: 28731000, s: 53732700, be: "Import" },
  "15-2": { g: 29116000, m: 44179000, s: 27706400, be: "Import" },
  "15-3": { g: 27365000, m: 133632000, s: 24973200, be: "Import" },
  "15-4": { g: 0, m: 37226000, s: 0, be: "Import" },
  "16-0": { g: 1390026000, m: 220232000, s: 149418100, be: "Import" },
  "16-1": { g: 64129000, m: 31758000, s: 9607500, be: "Import" },
  "16-2": { g: 8780000, m: 64097000, s: 4386400, be: "Import" },
  "16-3": { g: 5612000, m: 186429000, s: 7844600, be: "Import" },
  "16-4": { g: 276858000, m: 58189000, s: 52285000, be: "Import" },
  "17-0": { g: 197380000, m: 101626000, s: 90041600, be: "Import" },
  "17-1": { g: 56374000, m: 37701000, s: 35016300, be: "Import" },
  "17-2": { g: 40812000, m: 63779000, s: 19200300, be: "Import" },
  "17-3": { g: 201804000, m: 121679000, s: 0, be: "Import" },
  "17-4": { g: 176945000, m: 7801000, s: 7966900, be: "Import" },
  "18-0": { g: 63017000, m: 57574000, s: 173424600, be: "Import" },
  "18-1": { g: 28366000, m: 77260000, s: 14549500, be: "Import" },
  "18-2": { g: 5919000, m: 129473000, s: 17444800, be: "Import" },
  "18-3": { g: 0, m: 97271000, s: 0, be: "Import" },
  "18-4": { g: 16199000, m: 49620000, s: 0, be: "Import" },
  "19-0": { g: 117795000, m: 81996000, s: 386596700, be: "Import" },
  "19-1": { g: 0, m: 71591000, s: 8643300, be: "Import" },
  "19-2": { g: 57385000, m: 49405000, s: 16668100, be: "Import" },
  "19-3": { g: 21485000, m: 28248000, s: 22592000, be: "Import" },
  "19-4": { g: 85555000, m: 30012000, s: 2888200, be: "Import" },
  "20-0": { g: 533858000, m: 395521000, s: 351268700, be: "Import" },
  "20-1": { g: 222642000, m: 204316000, s: 96440600, be: "Import" },
  "20-2": { g: 32776000, m: 150099000, s: 56374400, be: "Import" },
  "20-3": { g: 0, m: 55755000, s: 15414400, be: "Import" },
  "20-4": { g: 0, m: 25427000, s: 16404700, be: "Import" },
  "21-0": { g: 190578000, m: 113408000, s: 694418100, be: "Import" },
  "21-1": { g: 28198000, m: 112202000, s: 65165900, be: "Import" },
  "21-2": { g: 14984000, m: 46174000, s: 71813600, be: "Import" },
  "21-3": { g: 0, m: 25853000, s: 0, be: "Import" },
  "21-4": { g: 0, m: 0, s: 88257300, be: "Import" },
  "22-0": { g: 23116000, m: 72372000, s: 120285200, be: "Import" },
  "22-1": { g: 0, m: 15390000, s: 35586300, be: "Import" },
  "22-2": { g: 0, m: 0, s: 19419300, be: "Import" },
  "22-3": { g: 0, m: 33253000, s: 51026000, be: "Import" },
  "22-4": { g: 0, m: 9940000, s: 0, be: "Import" },
  "23-0": { g: 0, m: 29593000, s: 85435900, be: "Import" },
  "23-1": { g: 0, m: 0, s: 78838900, be: "Import" },
  "23-2": { g: 25260000, m: 5875000, s: 4254500, be: "Import" },
  "23-3": { g: 0, m: 0, s: 1885900, be: "Import" },
  "23-4": { g: 0, m: 4430000, s: 5315500, be: "Import" },
  "24-0": { g: 0, m: 0, s: 0, be: "Import" },
  "24-1": { g: 0, m: 0, s: 56078000, be: "Import" },
  "24-2": { g: 32980000, m: 0, s: 49398100, be: "Import" },
  "24-3": { g: 279285000, m: 0, s: 0, be: "Import" },
  "24-4": { g: 179022000, m: 0, s: 50993400, be: "Import" },
};

// ============ HELPERS ============
const fmt = (v) => v == null || isNaN(v) ? "-" : "Rp " + Math.round(v).toLocaleString("id-ID");
const fmtS = (v) => {
  if (v == null || isNaN(v)) return "-";
  const a = Math.abs(v);
  if (a >= 1e9) return "Rp " + (v / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " M";
  if (a >= 1e6) return "Rp " + (v / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  return fmt(v);
};
const pct = (v) => v == null || isNaN(v) ? "-" : v.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "%";
const pctWeight = (v) => (v * 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const pctRate = (v) => (v * 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

const tierCalc = (omzet, tiers, gpmRate) => {
  const gpm = omzet * gpmRate;
  for (const t of tiers) {
    if (omzet >= t.min) {
      const rate = gpmRate * t.bm;
      return { ...t, gpmRate, gpm, rate, reward: gpm * t.bm };
    }
  }
  return { name: "Belum Lolos", min: 0, bm: 0, gpmRate, gpm, rate: 0, reward: 0 };
};
const splitReward = (reward) => ({
  rewardBudget: reward,
  monthlyReward: reward * PAYOUT_DISTRIBUTION.monthly,
  quarterlyPool: reward * PAYOUT_DISTRIBUTION.quarterly,
  annualPool: reward * PAYOUT_DISTRIBUTION.annual,
});
const quarterStart = (monthIndex) => Math.floor(monthIndex / 3) * 3;
const annualPayoutRate = (achievement) => {
  if (achievement >= 100) return 1;
  if (achievement >= PAYOUT_THRESHOLDS.annual) return achievement / 100;
  return 0;
};
const isRewardMonth = (monthIndex) => monthIndex >= REWARD_START_MONTH;

const statusOf = (ach, hasInput) => {
  if (!hasInput) return { t: "Belum Input", c: "#94a3b8", bg: "#f1f5f9" };
  if (ach >= 100) return { t: "Achieved", c: "#15803d", bg: "#dcfce7" };
  if (ach >= 75) return { t: "On Track", c: "#1d4ed8", bg: "#dbeafe" };
  return { t: "Gap", c: "#b91c1c", bg: "#fee2e2" };
};

const parseNum = (str) => {
  const d = String(str).replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
};
const fmtInput = (str) => {
  const d = String(str).replace(/[^\d]/g, "");
  return d ? parseInt(d, 10).toLocaleString("id-ID") : "";
};

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.message || "Permintaan gagal.");
  return payload;
};

// ============ MAIN APP ============
export default function App() {
  const [tab, setTab] = useState("login");
  const [data, setData] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Auth state
  const [pinInput, setPinInput] = useState("");
  const [session, setSession] = useState(null); // { role: 'admin'|'be', name }
  const [loginErr, setLoginErr] = useState("");

  // Input form state
  const [fStore, setFStore] = useState(0);
  const [fMonth, setFMonth] = useState(0);
  const [fG, setFG] = useState("");
  const [fM, setFM] = useState("");
  const [fS, setFS] = useState("");
  const [fNote, setFNote] = useState("");

  // Dashboard state
  const [dMonth, setDMonth] = useState(5);
  const [dSeg, setDSeg] = useState("ALL");
  const [pStore, setPStore] = useState(0);
  const [rMonth, setRMonth] = useState(5);

  // Admin user management
  const [newPin, setNewPin] = useState("");
  const [newPinName, setNewPinName] = useState("");
  const [newUserRole, setNewUserRole] = useState("be");
  const [newUserBrand, setNewUserBrand] = useState("goldgram");
  const [newUserStores, setNewUserStores] = useState([]);
  const [userPinChanges, setUserPinChanges] = useState({});

  // CSV / bulk import
  const [csvText, setCsvText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importMsg, setImportMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const sessionPayload = await api("/api/session");
        if (sessionPayload.session) {
          setSession(sessionPayload.session);
          setTab(sessionPayload.session.role === "be" ? "input" : "dash");
          const bootstrap = await api("/api/bootstrap");
          setData(bootstrap.data || {});
          setSession(bootstrap.session || sessionPayload.session);

          if (sessionPayload.session.role === "admin") await loadUsers();
        }
      } catch (e) {
        setData(SEED_DATA);
      }
      setLoading(false);
    })();
  }, []);

  // Load existing values when store/month changes
  useEffect(() => {
    const k = `${fStore}-${fMonth}`;
    const d = data[k];
    setFG(d && d.g ? d.g.toLocaleString("id-ID") : "");
    setFM(d && d.m ? d.m.toLocaleString("id-ID") : "");
    setFS(d && d.s ? d.s.toLocaleString("id-ID") : "");
    setFNote(d && d.note ? d.note : "");
  }, [fStore, fMonth, data]);

  const allStoreCodes = useMemo(() => STORES.map((_, index) => index), []);
  const accessibleStoreCodes = useMemo(() => {
    if (!session) return [];
    if (session.role === "admin" || session.canReadAllStores) return allStoreCodes;
    const allowed = Array.isArray(session.storeCodes) ? session.storeCodes.map(Number) : [];
    return allStoreCodes.filter((code) => allowed.includes(code));
  }, [session, allStoreCodes]);
  const accessibleStoreSet = useMemo(() => new Set(accessibleStoreCodes), [accessibleStoreCodes]);

  useEffect(() => {
    if (!session || accessibleStoreCodes.length === 0) return;
    if (!accessibleStoreSet.has(fStore)) setFStore(accessibleStoreCodes[0]);
    if (!accessibleStoreSet.has(pStore)) setPStore(accessibleStoreCodes[0]);
  }, [session, accessibleStoreCodes, accessibleStoreSet, fStore, pStore]);

  const doLogin = async () => {
    const pin = pinInput.trim();
    if (!pin) return;
    try {
      const loginPayload = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      const nextSession = loginPayload.session;
      const bootstrap = await api("/api/bootstrap");
      setData(bootstrap.data || {});
      setSession(bootstrap.session || nextSession);
      setTab(nextSession.role === "be" ? "input" : "dash");
      setLoginErr("");
      setPinInput("");

      if (nextSession.role === "admin") await loadUsers();
    } catch (error) {
      setLoginErr(error.message);
    }
  };

  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (error) {
      // Clear the local session even if the server is temporarily unreachable.
    }
    setSession(null);
    setTab("login");
    setPinInput("");
    setUsers([]);
  };

  const loadUsers = async () => {
    const payload = await api("/api/users");
    setUsers(payload.users);
  };

  const save = async () => {
    setSaving(true);
    const k = `${fStore}-${fMonth}`;
    try {
      const payload = await api(`/api/realisations/${fStore}/${fMonth}`, {
        method: "PUT",
        body: JSON.stringify({
          g: parseNum(fG),
          m: parseNum(fM),
          s: parseNum(fS),
          note: fNote.trim(),
        }),
      });
      setData((current) => ({ ...current, [k]: payload.entry }));
      setMsg({ ok: true, t: `Tersimpan: ${STORES[fStore].n} — ${MONTHS[fMonth]}` });
    } catch (error) {
      setMsg({ ok: false, t: error.message });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  };

  // Per-row computation
  const getRow = (si, mi) => {
    const st = STORES[si];
    const w = WEIGHTS[mi];
    const tg = st.g * w, tm = st.m * w, ts = st.s * w;
    const d = data[`${si}-${mi}`];
    const hasInput = !!d;
    const rg = d ? d.g : 0, rm = d ? d.m : 0, rs = d ? d.s : 0;
    const emasOmzet = rg + rm, perakOmzet = rs;
    const rewardActive = isRewardMonth(mi);
    const emasTier = rewardActive ? tierCalc(emasOmzet, EMAS_TIERS, GPM_RATES.emas) : { name: "Belum Berlaku", min: 0, bm: 0, gpmRate: GPM_RATES.emas, gpm: 0, rate: 0, reward: 0 };
    const perakTier = rewardActive ? tierCalc(perakOmzet, PERAK_TIERS, GPM_RATES.perak) : { name: "Belum Berlaku", min: 0, bm: 0, gpmRate: GPM_RATES.perak, gpm: 0, rate: 0, reward: 0 };
    const totalReward = emasTier.reward + perakTier.reward;
    const target = tg + tm + ts, real = rg + rm + rs;
    const ach = target > 0 ? (real / target) * 100 : 0;
    return { st, tg, tm, ts, rg, rm, rs, target, real, ach, hasInput, emasOmzet, perakOmzet, emasTier, perakTier, totalReward, ...splitReward(totalReward), be: d?.be, note: d?.note };
  };

  // ===== INPUT TAB PREVIEW =====
  const inputPreview = useMemo(() => {
    const st = STORES[fStore], w = WEIGHTS[fMonth];
    const tg = st.g * w, tm = st.m * w, ts = st.s * w;
    const g = parseNum(fG), m = parseNum(fM), s = parseNum(fS);
    const rewardActive = isRewardMonth(fMonth);
    const emasTier = rewardActive ? tierCalc(g + m, EMAS_TIERS, GPM_RATES.emas) : { name: "Belum Berlaku", min: 0, bm: 0, gpmRate: GPM_RATES.emas, gpm: 0, rate: 0, reward: 0 };
    const perakTier = rewardActive ? tierCalc(s, PERAK_TIERS, GPM_RATES.perak) : { name: "Belum Berlaku", min: 0, bm: 0, gpmRate: GPM_RATES.perak, gpm: 0, rate: 0, reward: 0 };
    const totalReward = emasTier.reward + perakTier.reward;
    const target = tg + tm + ts, real = g + m + s;
    return { tg, tm, ts, g, m, s, emasTier, perakTier, totalReward, ...splitReward(totalReward), target, real, ach: target > 0 ? real / target * 100 : 0 };
  }, [fStore, fMonth, fG, fM, fS]);

  const warn = inputPreview.real > inputPreview.target * 5 && inputPreview.real > 0;

  const getStoreQuarter = (si, monthIndex) => {
    const start = quarterStart(monthIndex);
    const rows = [0, 1, 2].map((offset) => getRow(si, start + offset));
    const target = rows.reduce((a, r) => a + r.target, 0);
    const real = rows.reduce((a, r) => a + r.real, 0);
    const pool = rows.reduce((a, r) => a + r.quarterlyPool, 0);
    const ach = target > 0 ? real / target * 100 : 0;
    return { start, end: start + 2, target, real, ach, pool, payout: ach >= PAYOUT_THRESHOLDS.quarterly ? pool : 0 };
  };

  const getStoreAnnual = (si) => {
    const rows = MONTHS.map((_, mi) => getRow(si, mi));
    const target = rows.reduce((a, r) => a + r.target, 0);
    const real = rows.reduce((a, r) => a + r.real, 0);
    const pool = rows.reduce((a, r) => a + r.annualPool, 0);
    const ach = target > 0 ? real / target * 100 : 0;
    return { target, real, ach, pool, payout: pool * annualPayoutRate(ach) };
  };

  // ===== DASHBOARD COMPUTATIONS =====
  const dashRows = useMemo(() => {
    return accessibleStoreCodes.map((i) => getRow(i, dMonth)).filter(r => dSeg === "ALL" || r.st.seg === dSeg);
  }, [data, dMonth, dSeg, accessibleStoreCodes]);

  const dashKPI = useMemo(() => {
    const rows = accessibleStoreCodes.map((i) => getRow(i, dMonth));
    const totReal = rows.reduce((a, r) => a + r.real, 0);
    const totTarget = rows.reduce((a, r) => a + r.target, 0);
    const totReward = rows.reduce((a, r) => a + r.totalReward, 0);
    const monthlyReward = rows.reduce((a, r) => a + r.monthlyReward, 0);
    const quarterlyPool = rows.reduce((a, r) => a + r.quarterlyPool, 0);
    const annualPool = rows.reduce((a, r) => a + r.annualPool, 0);
    const emasReward = rows.reduce((a, r) => a + r.emasTier.reward, 0);
    const perakReward = rows.reduce((a, r) => a + r.perakTier.reward, 0);
    const lolos = rows.filter(r => r.totalReward > 0).length;
    let ytdT = 0, ytdR = 0, ytdRw = 0, ytdMonthly = 0, ytdQuarterlyPool = 0, ytdAnnualPool = 0;
    for (let m = 0; m <= dMonth; m++) {
      accessibleStoreCodes.forEach((i) => {
        const r = getRow(i, m);
        ytdT += r.target; ytdR += r.real; ytdRw += r.totalReward; ytdMonthly += r.monthlyReward; ytdQuarterlyPool += r.quarterlyPool; ytdAnnualPool += r.annualPool;
      });
    }
    return { totReal, totTarget, totReward, monthlyReward, quarterlyPool, annualPool, emasReward, perakReward, lolos, ytdT, ytdR, ytdRw, ytdMonthly, ytdQuarterlyPool, ytdAnnualPool, ytdAch: ytdT > 0 ? ytdR / ytdT * 100 : 0 };
  }, [data, dMonth, accessibleStoreCodes]);

  const dashBrandKPI = useMemo(() => {
    return BRANDS.map((brand) => {
      const target = dashRows.reduce((total, row) => total + row[brand.targetField], 0);
      const real = dashRows.reduce((total, row) => total + row[brand.realField], 0);
      return {
        ...brand,
        target,
        real,
        gap: real - target,
        achievement: target > 0 ? real / target * 100 : 0,
      };
    });
  }, [dashRows]);

  // ===== PER EPIS =====
  const episRows = useMemo(() => MONTHS.map((_, mi) => getRow(pStore, mi)), [data, pStore]);
  const episYr = useMemo(() => {
    const t = episRows.reduce((a, r) => a + r.target, 0);
    const r = episRows.reduce((a, x) => a + x.real, 0);
    const rw = episRows.reduce((a, x) => a + x.totalReward, 0);
    const monthly = episRows.reduce((a, x) => a + x.monthlyReward, 0);
    const quarterly = episRows.reduce((a, x) => a + x.quarterlyPool, 0);
    const annual = episRows.reduce((a, x) => a + x.annualPool, 0);
    const ach = t > 0 ? r / t * 100 : 0;
    return { t, r, rw, monthly, quarterly, annual, annualPayout: annual * annualPayoutRate(ach), ach };
  }, [episRows]);

  const episBrandKPI = useMemo(() => {
    return BRANDS.map((brand) => {
      const target = episRows.reduce((total, row) => total + row[brand.targetField], 0);
      const real = episRows.reduce((total, row) => total + row[brand.realField], 0);
      return {
        ...brand,
        target,
        real,
        gap: real - target,
        achievement: target > 0 ? real / target * 100 : 0,
      };
    });
  }, [episRows]);

  // ===== REWARD TAB =====
  const rewardRows = useMemo(() => accessibleStoreCodes.map((i) => getRow(i, rMonth)).sort((a, b) => b.totalReward - a.totalReward), [data, rMonth, accessibleStoreCodes]);
  const rewardMonthKPI = useMemo(() => ({
    budget: rewardRows.reduce((a, r) => a + r.totalReward, 0),
    monthly: rewardRows.reduce((a, r) => a + r.monthlyReward, 0),
    quarterly: rewardRows.reduce((a, r) => a + r.quarterlyPool, 0),
    annual: rewardRows.reduce((a, r) => a + r.annualPool, 0),
  }), [rewardRows]);
  const rewardQuarter = useMemo(() => {
    const rows = accessibleStoreCodes.map((i) => ({ st: STORES[i], ...getStoreQuarter(i, rMonth) })).sort((a, b) => b.payout - a.payout || b.pool - a.pool);
    return {
      rows,
      pool: rows.reduce((a, r) => a + r.pool, 0),
      payout: rows.reduce((a, r) => a + r.payout, 0),
      eligible: rows.filter(r => r.payout > 0).length,
      label: `Q${Math.floor(rMonth / 3) + 1} (${MONTHS[quarterStart(rMonth)]}-${MONTHS[quarterStart(rMonth) + 2]})`,
    };
  }, [data, rMonth, accessibleStoreCodes]);
  const rewardAnnual = useMemo(() => {
    const rows = accessibleStoreCodes.map((i) => ({ st: STORES[i], ...getStoreAnnual(i) })).sort((a, b) => b.payout - a.payout || b.pool - a.pool);
    return {
      rows,
      pool: rows.reduce((a, r) => a + r.pool, 0),
      payout: rows.reduce((a, r) => a + r.payout, 0),
      eligible: rows.filter(r => r.payout > 0).length,
    };
  }, [data, accessibleStoreCodes]);
  const rewardYTD = useMemo(() => {
    return accessibleStoreCodes.map((i) => {
      let rw = 0, monthly = 0, quarterly = 0, annual = 0;
      for (let m = 0; m < 12; m++) {
        const row = getRow(i, m);
        rw += row.totalReward; monthly += row.monthlyReward; quarterly += row.quarterlyPool; annual += row.annualPool;
      }
      return { n: STORES[i].n, rw, monthly, quarterly, annual };
    }).sort((a, b) => b.rw - a.rw);
  }, [data, accessibleStoreCodes]);

  // ===== ADMIN: User management =====
  const addUser = async () => {
    const pin = newPin.trim();
    const name = newPinName.trim();
    if (!/^\d{4,6}$/.test(pin)) { setImportMsg({ ok: false, t: "PIN harus 4-6 digit angka." }); return; }
    if (!name) { setImportMsg({ ok: false, t: "Nama pengguna wajib diisi." }); return; }
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          pin,
          role: newUserRole,
          brandCodes: newUserRole === "be" ? [newUserBrand] : [],
          storeCodes: newUserRole === "admin" ? [] : newUserStores,
        }),
      });
      await loadUsers();
      setImportMsg({ ok: true, t: `Akun ${name} berhasil dibuat.` });
      setNewPin("");
      setNewPinName("");
      setNewUserStores([]);
    } catch (error) {
      setImportMsg({ ok: false, t: error.message });
    }
    setTimeout(() => setImportMsg(null), 4000);
  };

  const updateUserField = (userId, field, value) => {
    setUsers((current) => current.map((user) => (
      user.id === userId ? { ...user, [field]: value } : user
    )));
  };

  const saveUser = async (user) => {
    try {
      await api(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          brandCodes: user.role === "be" ? user.brandCodes : [],
          storeCodes: user.role === "admin" ? [] : (user.storeCodes || []),
          pin: userPinChanges[user.id] || "",
        }),
      });
      setUserPinChanges((current) => ({ ...current, [user.id]: "" }));
      await loadUsers();
      setImportMsg({ ok: true, t: `Akun ${user.name} diperbarui.` });
    } catch (error) {
      setImportMsg({ ok: false, t: error.message });
    }
    setTimeout(() => setImportMsg(null), 4000);
  };

  // ===== ADMIN: CSV Import =====
  const STORE_NAMES = STORES.map(s => s.n.toUpperCase());
  const handleCSVFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportMsg({ ok: false, t: "File harus berformat .csv." });
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ""));
      setCsvFileName(file.name);
      setImportPreview(null);
      setImportMsg({ ok: true, t: `File ${file.name} berhasil dimuat. Klik Preview Import untuk memeriksa data.` });
      setTimeout(() => setImportMsg(null), 5000);
    };
    reader.onerror = () => {
      setImportMsg({ ok: false, t: `File ${file.name} gagal dibaca.` });
    };
    reader.readAsText(file);
  };
  const parseCSV = () => {
    if (!csvText.trim()) {
      setImportPreview(null);
      setImportMsg({ ok: false, t: "Isi CSV masih kosong. Upload file CSV atau tempel data terlebih dahulu." });
      setTimeout(() => setImportMsg(null), 4000);
      return;
    }
    const lines = csvText.trim().split("\n").filter(l => l.trim());
    const rows = [];
    const errors = [];
    lines.forEach((line, idx) => {
      if (idx === 0 && /epi.?store/i.test(line)) return; // skip header
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 5) { errors.push(`Baris ${idx + 1}: kolom tidak lengkap (butuh: EPIStore,Bulan,Gold,Meezan,Silver)`); return; }
      const [storeName, monthName, g, m, s] = parts;
      const si = STORE_NAMES.indexOf(storeName.toUpperCase());
      const mi = MONTHS.indexOf(monthName.toUpperCase());
      if (si === -1) { errors.push(`Baris ${idx + 1}: EPI Store "${storeName}" tidak ditemukan`); return; }
      if (mi === -1) { errors.push(`Baris ${idx + 1}: Bulan "${monthName}" tidak valid (gunakan JAN-DEC)`); return; }
      rows.push({ si, mi, g: parseNum(g), m: parseNum(m), s: parseNum(s), storeName: STORES[si].n, monthName: MONTHS[mi] });
    });
    setImportPreview({ rows, errors });
  };
  const applyImport = async () => {
    if (!importPreview || importPreview.rows.length === 0) return;
    if (importPreview.errors.length > 0) {
      setImportMsg({ ok: false, t: "Import dibatalkan. Perbaiki semua EPI Store/bulan yang tidak sesuai master sebelum menyimpan." });
      setTimeout(() => setImportMsg(null), 5000);
      return;
    }
    try {
      const payload = await api("/api/realisations/import", {
        method: "POST",
        body: JSON.stringify({
          rows: importPreview.rows.map((row) => ({
            storeIndex: row.si,
            monthIndex: row.mi,
            g: row.g,
            m: row.m,
            s: row.s,
          })),
        }),
      });
      setData((current) => ({ ...current, ...payload.data }));
      setImportMsg({ ok: true, t: `${payload.count} baris berhasil diimport.` });
      setImportPreview(null);
      setCsvText("");
      setCsvFileName("");
    } catch (error) {
      setImportMsg({ ok: false, t: error.message });
    }
    setTimeout(() => setImportMsg(null), 5000);
  };

  const assignedBrandCodes = session?.role === "admin"
    ? BRANDS.map((brand) => brand.code)
    : session?.brandCodes || [];
  const canEditBrand = (brandCode) => assignedBrandCodes.includes(brandCode);
  const accessibleTotalTarget = accessibleStoreCodes.reduce((total, i) => {
    const store = STORES[i];
    return store ? total + store.g + store.m + store.s : total;
  }, 0);

  const S = {
    wrap: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0", paddingBottom: 40 },
    headerShell: { background: "linear-gradient(135deg,#1e3a8a,#0f172a)", borderBottom: "3px solid #d4af37" },
    header: { maxWidth: 1100, width: "calc(100% - 24px)", boxSizing: "border-box", margin: "0 auto", padding: "20px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
    headerBrand: { display: "flex", alignItems: "center", gap: 12, flex: "1 1 280px", minWidth: 0, flexWrap: "wrap" },
    logo: { width: 140, maxWidth: "42vw", height: "auto", display: "block", objectFit: "contain", flexShrink: 0 },
    loginLogo: { width: 140, maxWidth: "56vw", height: "auto", display: "block", objectFit: "contain", margin: "0 auto 12px" },
    h1: { margin: 0, fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: 0.3 },
    sub: { margin: "4px 0 0", fontSize: 12, color: "#94a3b8" },
    tabsShell: { background: "#1e293b", borderBottom: "1px solid #334155" },
    tabs: { maxWidth: 1100, width: "calc(100% - 24px)", boxSizing: "border-box", margin: "0 auto", display: "flex", justifyContent: "center", gap: 6, padding: "10px 12px", overflowX: "auto", scrollPadding: 12 },
    tab: (a) => ({ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", background: a ? "#d4af37" : "#334155", color: a ? "#0f172a" : "#cbd5e1" }),
    body: { padding: "14px 12px", maxWidth: 1100, margin: "0 auto" },
    card: { background: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #334155" },
    label: { fontSize: 12, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 4 },
    input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: 14 },
    select: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: 14 },
    btn: { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#d4af37", color: "#0f172a", fontWeight: 800, fontSize: 15, cursor: "pointer" },
    loginBtn: { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#d4af37,#f8e7a4,#d4af37)", color: "#0f172a", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, position: "relative", overflow: "hidden", boxShadow: "0 10px 24px rgba(212, 175, 55, 0.18)" },
    btnGhost: { padding: "8px 12px", borderRadius: 8, border: "1px solid #475569", background: "transparent", color: "#cbd5e1", fontWeight: 700, fontSize: 12, cursor: "pointer" },
    loginCredit: { width: "100%", padding: "12px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 },
    loginCreditLink: { color: "#d4af37", fontWeight: 800, textDecoration: "none" },
    loveIcon: { color: "#f87171", fontSize: 12, margin: "0 3px", verticalAlign: "-1px" },
    th: { padding: "8px 8px", fontSize: 11, textAlign: "left", color: "#94a3b8", borderBottom: "1px solid #334155", whiteSpace: "nowrap" },
    td: { padding: "8px 8px", fontSize: 12, borderBottom: "1px solid #283548", whiteSpace: "nowrap" },
    kpi: { background: "#1e293b", borderRadius: 12, padding: "12px 14px", border: "1px solid #334155", flex: "1 1 140px", minWidth: 140 },
    kpiV: { fontSize: 17, fontWeight: 800, color: "#fff", marginTop: 2 },
    badge: (st) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: st.c, background: st.bg }),
  };

  if (loading) return <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#d4af37", fontWeight: 700 }}>Memuat data…</div></div>;

  // ============ LOGIN SCREEN ============
  if (!session) {
    return (
      <div style={{ ...S.wrap, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
        <div aria-hidden="true" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div style={{ ...S.card, maxWidth: 360, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <img src={LOGO_SRC} alt="EPI" style={S.loginLogo} />
              <div style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>Dashboard EPI Store 2026</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Masukkan PIN Anda untuk masuk</div>
            </div>
            <input
              style={{ ...S.input, textAlign: "center", fontSize: 22, letterSpacing: 6, fontWeight: 800 }}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value.replace(/[^\d]/g, "")); setLoginErr(""); }}
              onKeyDown={e => e.key === "Enter" && doLogin()}
            />
            {loginErr && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8, textAlign: "center" }}>{loginErr}</div>}
            <div style={{ marginTop: 14 }}>
              <button className="login-button" style={S.loginBtn} onClick={doLogin}>
                <span className="login-button-icon" aria-hidden="true">🔓</span>
                <span>AKSES DASHBOARD</span>
              </button>
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>
              Gunakan PIN akun yang diberikan administrator.<br />
            </div>
          </div>
        </div>
        <footer className="credit-footer" style={S.loginCredit}>
          Made with love
          <span className="credit-love" style={S.loveIcon} aria-label="love" role="img">♥</span>
          by{" "}
          <a
            className="credit-link"
            href="https://arvadigital.web.id/"
            target="_blank"
            rel="noopener noreferrer"
            style={S.loginCreditLink}
          >
            Arva Digital Media
          </a>
        </footer>
      </div>
    );
  }

  const visibleTabs = session.role === "admin"
    ? [["dash", "🏠 Dashboard Nasional"], ["epis", "🏪 Per EPI Store"], ["reward", "🏆 Reward"], ["input", "✍️ Input Realisasi"], ["import", "📥 Import Data"], ["access", "🔐 Akses & PIN"], ["setup", "⚙️ Skema"]]
    : session.role === "viewer"
      ? [["dash", "🏠 Dashboard Nasional"], ["epis", "🏪 Per EPI Store"], ["reward", "🏆 Reward"]]
      : [["input", "✍️ Input Realisasi"], ["dash", "🏠 Dashboard Nasional"], ["epis", "🏪 Per EPI Store"], ["reward", "🏆 Reward"], ["setup", "⚙️ Skema"]];

  return (
    <div style={S.wrap}>
      <div style={S.headerShell}>
        <div style={S.header}>
          <div style={S.headerBrand}>
            <img src={LOGO_SRC} alt="EPI" style={S.logo} />
            <div style={{ minWidth: 0 }}>
              <p style={{ ...S.sub, marginTop: 0 }}>Dashboard Performance & Reward 2026 | Total Target Akses: {fmtS(accessibleTotalTarget)}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "linear-gradient(135deg,#b8860b,#f5d78e)", color: "#1a1200" }}>GOLDGRAM</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "linear-gradient(135deg,#0f3d2e,#4a7a5e)", color: "#f5d78e" }}>MEEZAN GOLD</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "linear-gradient(135deg,#94a3b8,#e2e8f0)", color: "#0f172a" }}>SILVERGRAM</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "auto" }}>
            <div style={{ fontSize: 12, color: "#d4af37", fontWeight: 800 }}>{session.name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>{session.role === "admin" ? "Administrator" : session.role === "viewer" ? "Manajemen — Hanya Lihat" : "Brand Executive"}</div>
            <button style={S.btnGhost} onClick={logout}>Keluar</button>
          </div>
        </div>
      </div>

      <div className="app-tabs-shell" style={S.tabsShell}>
        <div className="app-tabs" style={S.tabs}>
          {visibleTabs.map(([k, l]) => (
            <button className="app-tab" key={k} style={S.tab(tab === k)} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={S.body}>
        {/* ============ INPUT TAB ============ */}
        {tab === "input" && session.role !== "viewer" && (
          <div>
            {accessibleStoreCodes.length === 0 ? (
              <div style={S.card}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "#d4af37" }}>Belum Ada Akses EPI Store</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                  Akun ini belum ditugaskan ke EPI Store mana pun. Hubungi admin untuk mengatur akses store pada PIN ini.
                </div>
              </div>
            ) : (
              <>
                <div style={S.card}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, color: "#d4af37" }}>Form Submit Realisasi Bulanan</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                    Login sebagai: <b style={{ color: "#e2e8f0" }}>{session.name}</b>
                    {session.role === "be" && (
                      <span> | Brand: <b style={{ color: "#d4af37" }}>{BRANDS.filter(brand => assignedBrandCodes.includes(brand.code)).map(brand => brand.name).join(", ") || "Belum ditugaskan"}</b></span>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={S.label}>EPI Store</label>
                      <select style={S.select} value={fStore} onChange={e => setFStore(+e.target.value)}>
                        {accessibleStoreCodes.map((i) => <option key={i} value={i}>{STORES[i].n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Bulan</label>
                      <select style={S.select} value={fMonth} onChange={e => setFMonth(+e.target.value)}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m} — bobot {pctWeight(WEIGHTS[i])} ({SEASON[i]} Season)</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    {[
                      ["GOLDGRAM", fG, setFG, inputPreview.tg, "#1a1200", "linear-gradient(135deg,#b8860b,#f5d78e)"],
                      ["MEEZAN GOLD", fM, setFM, inputPreview.tm, "#f5d78e", "linear-gradient(135deg,#0f3d2e,#4a7a5e)"],
                      ["SILVERGRAM", fS, setFS, inputPreview.ts, "#0f172a", "linear-gradient(135deg,#94a3b8,#e2e8f0)"],
                    ].map(([name, val, set, tgt, txtCol, bgGrad]) => {
                      const brand = BRANDS.find((item) => item.name === name);
                      const editable = canEditBrand(brand.code);
                      return (
                        <div key={name}>
                          <label style={S.label}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: bgGrad, color: txtCol, marginRight: 6 }}>{name}</span>
                            Target bulan ini: {fmtS(tgt)}
                            {!editable && <span style={{ color: "#64748b", marginLeft: 6 }}>(hanya baca)</span>}
                          </label>
                          <input style={{ ...S.input, opacity: editable ? 1 : 0.55 }} disabled={!editable} inputMode="numeric" placeholder="Realisasi omzet (Rp)" value={val}
                            onChange={e => set(fmtInput(e.target.value))} />
                        </div>
                      );
                    })}
                    <div>
                      <label style={S.label}>Catatan (opsional)</label>
                      <input style={S.input} placeholder="Catatan" value={fNote} onChange={e => setFNote(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#0f172a", border: "1px solid #334155" }}>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>PREVIEW OTOMATIS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13 }}>
                      <div>Ach Total: <b style={{ color: inputPreview.ach >= 100 ? "#4ade80" : inputPreview.ach >= 75 ? "#60a5fa" : "#f87171" }}>{pct(inputPreview.ach)}</b></div>
                      <div>Emas ({fmtS(inputPreview.g + inputPreview.m)}): <b style={{ color: "#fbbf24" }}>{inputPreview.emasTier.name}</b> → {fmt(inputPreview.emasTier.reward)}</div>
                      <div>Perak ({fmtS(inputPreview.s)}): <b style={{ color: "#cbd5e1" }}>{inputPreview.perakTier.name}</b> → {fmt(inputPreview.perakTier.reward)}</div>
                      <div>Budget Reward: <b style={{ color: "#d4af37" }}>{fmt(inputPreview.totalReward)}</b></div>
                      <div>Cair Bulanan 70%: <b style={{ color: "#4ade80" }}>{fmt(inputPreview.monthlyReward)}</b></div>
                      <div>Pool Q/Annual: <b style={{ color: "#93c5fd" }}>{fmt(inputPreview.quarterlyPool)} / {fmt(inputPreview.annualPool)}</b></div>
                    </div>
                    {warn && <div style={{ marginTop: 8, fontSize: 12, color: "#fb923c" }}>⚠️ Realisasi &gt;5× target bulanan — pastikan satuan Rupiah penuh (bukan ribuan/jutaan).</div>}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button style={{ ...S.btn, opacity: saving || assignedBrandCodes.length === 0 ? 0.6 : 1 }} disabled={saving || assignedBrandCodes.length === 0} onClick={save}>
                      {saving ? "Menyimpan…" : "💾 Submit Realisasi"}
                    </button>
                    {msg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: msg.ok ? "#4ade80" : "#f87171", textAlign: "center" }}>{msg.t}</div>}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Akun hanya dapat melihat dan submit EPI Store yang ditugaskan. Kolom brand yang bisa diubah mengikuti penugasan brand akun.
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ DASHBOARD NASIONAL ============ */}
        {tab === "dash" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={S.label}>Bulan Laporan</label>
                <select style={S.select} value={dMonth} onChange={e => setDMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={S.label}>Segmentasi</label>
                <select style={S.select} value={dSeg} onChange={e => setDSeg(e.target.value)}>
                  {["ALL", "TOP", "GROWTH", "START UP"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={S.kpi}><div style={S.label}>Realisasi {MONTHS[dMonth]}</div><div style={S.kpiV}>{fmtS(dashKPI.totReal)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Target: {fmtS(dashKPI.totTarget)}</div></div>
              <div style={S.kpi}><div style={S.label}>Reward Cair {MONTHS[dMonth]}</div><div style={{ ...S.kpiV, color: "#4ade80" }}>{fmt(dashKPI.monthlyReward)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>70% dari budget {fmtS(dashKPI.totReward)}</div></div>
              <div style={S.kpi}><div style={S.label}>Pool Q / Akhir Tahun</div><div style={{ ...S.kpiV, color: "#93c5fd" }}>{fmtS(dashKPI.quarterlyPool)} / {fmtS(dashKPI.annualPool)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>20% quarterly | 10% annual</div></div>
              <div style={S.kpi}><div style={S.label}>EPIS Lolos Reward</div><div style={S.kpiV}>{dashKPI.lolos} <span style={{ fontSize: 12, color: "#94a3b8" }}>/ 28</span></div></div>
              <div style={S.kpi}><div style={S.label}>YTD s.d. {MONTHS[dMonth]}</div><div style={S.kpiV}>{pct(dashKPI.ytdAch)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtS(dashKPI.ytdR)} / {fmtS(dashKPI.ytdT)} | Cair: {fmtS(dashKPI.ytdMonthly)}</div></div>
            </div>

            <div style={{ ...S.card, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", marginBottom: 10 }}>
                Perolehan Omzet per Brand — {MONTHS[dMonth]}
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginLeft: 6 }}>({dSeg === "ALL" ? "Seluruh Segmentasi" : dSeg})</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
                {dashBrandKPI.map((brand) => {
                  const positive = brand.gap >= 0;
                  const progress = Math.min(Math.max(brand.achievement, 0), 100);
                  return (
                    <div key={brand.code} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: brand.gradient, color: brand.code === "goldgram" ? "#1a1200" : brand.code === "silvergram" ? "#0f172a" : "#f5d78e" }}>{brand.name}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: brand.achievement >= 100 ? "#4ade80" : brand.achievement >= 75 ? "#60a5fa" : "#f87171" }}>{pct(brand.achievement)}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>TARGET BULAN</div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtS(brand.target)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>REALISASI OMZET</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: brand.color }}>{fmtS(brand.real)}</div>
                        </div>
                      </div>
                      <div style={{ height: 7, borderRadius: 99, background: "#1e293b", overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: brand.gradient }} />
                      </div>
                      <div style={{ fontSize: 11, color: positive ? "#4ade80" : "#f87171" }}>
                        {positive ? "Surplus" : "Gap"}: {fmtS(Math.abs(brand.gap))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...S.card, overflowX: "auto", padding: 8 }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr>
                  {["EPI Store", "Seg", "Target", "Realisasi", "Ach %", "Budget Reward", "Cair 70%", "Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {dashRows.sort((a, b) => b.ach - a.ach).map((r, i) => {
                    const st = statusOf(r.ach, r.hasInput);
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 700 }}>{r.st.n}</td>
                        <td style={S.td}><span style={{ fontSize: 10, color: "#94a3b8" }}>{r.st.seg}</span></td>
                        <td style={S.td}>{fmtS(r.target)}</td>
                        <td style={S.td}>{r.hasInput ? fmtS(r.real) : "-"}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: st.c }}>{r.hasInput ? pct(r.ach) : "-"}</td>
                        <td style={{ ...S.td, color: "#d4af37", fontWeight: 600 }}>{r.totalReward > 0 ? fmt(r.totalReward) : "-"}</td>
                        <td style={{ ...S.td, color: "#4ade80", fontWeight: 600 }}>{r.monthlyReward > 0 ? fmt(r.monthlyReward) : "-"}</td>
                        <td style={S.td}><span style={S.badge(st)}>{st.t}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {accessibleStoreSet.has(3) && STORES[3] && dSeg !== "GROWTH" && dSeg !== "START UP" && (
              <div style={{ ...S.card, borderColor: "#92400e", background: "#1c1410" }}>
                <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700, marginBottom: 4 }}>📌 Catatan Evaluasi: EPIS Tasikmalaya</div>
                <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>
                  Target tahunan EPIS Tasikmalaya (Rp 100,2 M, kontribusi 15,79%) jauh di atas baseline 2025 (Rp 9,6 M) — by design sesuai keputusan Coach.
                  Disarankan evaluasi pencapaian Semester 1 untuk menentukan apakah penyesuaian distribusi bobot bulanan H2 diperlukan,
                  namun <b>target tahunan per kategori logam mulia (Gold/Meezan/Silver) tetap sesuai angka awal</b>.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ PER EPI STORE ============ */}
        {tab === "epis" && (
          <div>
            {accessibleStoreCodes.length === 0 ? (
              <div style={S.card}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "#d4af37" }}>Belum Ada Akses EPI Store</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Akun ini belum ditugaskan ke EPI Store mana pun.</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Pilih EPI Store</label>
                  <select style={S.select} value={pStore} onChange={e => setPStore(+e.target.value)}>
                    {accessibleStoreCodes.map((i) => <option key={i} value={i}>{STORES[i].n} ({STORES[i].seg})</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={S.kpi}><div style={S.label}>Target Tahun</div><div style={S.kpiV}>{fmtS(episYr.t)}</div></div>
                  <div style={S.kpi}><div style={S.label}>Realisasi Tahun</div><div style={S.kpiV}>{fmtS(episYr.r)}</div></div>
                  <div style={S.kpi}><div style={S.label}>Ach Tahun</div><div style={{ ...S.kpiV, color: episYr.ach >= 100 ? "#4ade80" : episYr.ach >= 75 ? "#60a5fa" : "#f87171" }}>{pct(episYr.ach)}</div></div>
                  <div style={S.kpi}><div style={S.label}>Budget Reward Tahun</div><div style={{ ...S.kpiV, color: "#d4af37" }}>{fmt(episYr.rw)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Cair bulanan: {fmtS(episYr.monthly)}</div></div>
                  <div style={S.kpi}><div style={S.label}>Pool Q / Annual</div><div style={{ ...S.kpiV, color: "#93c5fd" }}>{fmtS(episYr.quarterly)} / {fmtS(episYr.annual)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Estimasi annual cair: {fmtS(episYr.annualPayout)}</div></div>
                </div>

                <div style={{ ...S.card, padding: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>
                    Pencapaian Omzet per Brand
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
                    {STORES[pStore].n} — akumulasi realisasi yang telah tercatat dibanding target tahunan
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
                    {episBrandKPI.map((brand) => {
                      const positive = brand.gap >= 0;
                      const progress = Math.min(Math.max(brand.achievement, 0), 100);
                      return (
                        <div key={brand.code} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: brand.gradient, color: brand.code === "goldgram" ? "#1a1200" : brand.code === "silvergram" ? "#0f172a" : "#f5d78e" }}>{brand.name}</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: brand.achievement >= 100 ? "#4ade80" : brand.achievement >= 75 ? "#60a5fa" : "#f87171" }}>{pct(brand.achievement)}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>TARGET TAHUN</div>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtS(brand.target)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>REALISASI OMZET</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: brand.color }}>{fmtS(brand.real)}</div>
                            </div>
                          </div>
                          <div style={{ height: 7, borderRadius: 99, background: "#1e293b", overflow: "hidden", marginBottom: 8 }}>
                            <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: brand.gradient }} />
                          </div>
                          <div style={{ fontSize: 11, color: positive ? "#4ade80" : "#f87171" }}>
                            {positive ? "Surplus" : "Gap"}: {fmtS(Math.abs(brand.gap))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...S.card, overflowX: "auto", padding: 8 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead><tr>
                      {["Bulan", "Target", "Realisasi", "Gap", "Ach %", "Tier Emas", "Tier Perak", "Budget", "Cair 70%", "Pool Q", "Pool Annual", "Status", "BE"].map(h => <th key={h} style={S.th}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {episRows.map((r, mi) => {
                        const st = statusOf(r.ach, r.hasInput);
                        return (
                          <tr key={mi}>
                            <td style={{ ...S.td, fontWeight: 700 }}>{MONTHS[mi]}</td>
                            <td style={S.td}>{fmtS(r.target)}</td>
                            <td style={S.td}>{r.hasInput ? fmtS(r.real) : "-"}</td>
                            <td style={{ ...S.td, color: r.real - r.target >= 0 ? "#4ade80" : "#f87171" }}>{r.hasInput ? fmtS(r.real - r.target) : "-"}</td>
                            <td style={{ ...S.td, fontWeight: 700, color: st.c }}>{r.hasInput ? pct(r.ach) : "-"}</td>
                            <td style={S.td}>{r.hasInput ? r.emasTier.name : "-"}</td>
                            <td style={S.td}>{r.hasInput ? r.perakTier.name : "-"}</td>
                            <td style={{ ...S.td, color: "#d4af37", fontWeight: 600 }}>{r.totalReward > 0 ? fmt(r.totalReward) : "-"}</td>
                            <td style={{ ...S.td, color: "#4ade80", fontWeight: 600 }}>{r.monthlyReward > 0 ? fmt(r.monthlyReward) : "-"}</td>
                            <td style={S.td}>{r.quarterlyPool > 0 ? fmt(r.quarterlyPool) : "-"}</td>
                            <td style={S.td}>{r.annualPool > 0 ? fmt(r.annualPool) : "-"}</td>
                            <td style={S.td}><span style={S.badge(st)}>{st.t}</span></td>
                            <td style={{ ...S.td, fontSize: 11, color: "#94a3b8" }}>{r.be || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============ REWARD TAB ============ */}
        {tab === "reward" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Bulan Laporan</label>
              <select style={S.select} value={rMonth} onChange={e => setRMonth(+e.target.value)}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={S.kpi}><div style={S.label}>Budget Reward {MONTHS[rMonth]}</div><div style={{ ...S.kpiV, color: "#d4af37" }}>{fmt(rewardMonthKPI.budget)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Total 100%</div></div>
              <div style={S.kpi}><div style={S.label}>Cair Bulanan 70%</div><div style={{ ...S.kpiV, color: "#4ade80" }}>{fmt(rewardMonthKPI.monthly)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Dibayarkan setiap bulan</div></div>
              <div style={S.kpi}><div style={S.label}>Pool Quarter 20%</div><div style={{ ...S.kpiV, color: "#93c5fd" }}>{fmt(rewardQuarter.pool)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{rewardQuarter.label} eligible: {fmtS(rewardQuarter.payout)}</div></div>
              <div style={S.kpi}><div style={S.label}>Pool Annual 10%</div><div style={{ ...S.kpiV, color: "#c4b5fd" }}>{fmt(rewardAnnual.pool)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Estimasi cair: {fmtS(rewardAnnual.payout)}</div></div>
            </div>

            <div style={{ ...S.card, overflowX: "auto", padding: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14, padding: "6px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "linear-gradient(135deg,#cbd5e1,#94a3b8,#d4af37,#f5d78e)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Detail Reward {MONTHS[rMonth]} (per EPI Store)</span>
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr>
                  {["EPI Store",
                    <span key="ge" style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "linear-gradient(135deg,#b8860b,#f5d78e)", color: "#1a1200" }}>Omzet Emas</span>,
                    "Tier Emas", "Reward Emas",
                    <span key="pe" style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "linear-gradient(135deg,#94a3b8,#e2e8f0)", color: "#0f172a" }}>Omzet Perak</span>,
                    "Tier Perak", "Reward Perak", "Budget 100%", "Cair 70%", "Pool Q 20%", "Pool Annual 10%"].map((h, hi) => <th key={hi} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rewardRows.map((r, i) => (
                    <tr key={i} style={{ opacity: r.hasInput ? 1 : 0.45 }}>
                      <td style={{ ...S.td, fontWeight: 700 }}>{r.st.n}</td>
                      <td style={S.td}>{r.hasInput ? fmtS(r.emasOmzet) : "-"}</td>
                      <td style={{ ...S.td, color: r.emasTier.rate > 0 ? "#fbbf24" : "#64748b" }}>{r.hasInput ? r.emasTier.name : "-"}</td>
                      <td style={S.td}>{r.emasTier.reward > 0 ? fmt(r.emasTier.reward) : "-"}</td>
                      <td style={S.td}>{r.hasInput ? fmtS(r.perakOmzet) : "-"}</td>
                      <td style={{ ...S.td, color: r.perakTier.rate > 0 ? "#cbd5e1" : "#64748b" }}>{r.hasInput ? r.perakTier.name : "-"}</td>
                      <td style={S.td}>{r.perakTier.reward > 0 ? fmt(r.perakTier.reward) : "-"}</td>
                      <td style={{ ...S.td, color: "#d4af37", fontWeight: 800 }}>{r.totalReward > 0 ? fmt(r.totalReward) : "Rp 0"}</td>
                      <td style={{ ...S.td, color: "#4ade80", fontWeight: 700 }}>{r.monthlyReward > 0 ? fmt(r.monthlyReward) : "-"}</td>
                      <td style={S.td}>{r.quarterlyPool > 0 ? fmt(r.quarterlyPool) : "-"}</td>
                      <td style={S.td}>{r.annualPool > 0 ? fmt(r.annualPool) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ ...S.card, overflowX: "auto", padding: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#93c5fd", padding: "6px 8px" }}>Reward Quarterly {rewardQuarter.label}</div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr>{["EPI Store", "Ach Quarter", "Pool 20%", "Status", "Cair Quarterly"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rewardQuarter.rows.filter(r => r.pool > 0).map((r, i) => {
                    const eligible = r.ach >= PAYOUT_THRESHOLDS.quarterly;
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 700 }}>{r.st.n}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: eligible ? "#4ade80" : "#f87171" }}>{pct(r.ach)}</td>
                        <td style={S.td}>{fmt(r.pool)}</td>
                        <td style={S.td}>{eligible ? "Eligible" : "Belum Eligible"}</td>
                        <td style={{ ...S.td, color: eligible ? "#93c5fd" : "#64748b", fontWeight: 700 }}>{eligible ? fmt(r.payout) : "-"}</td>
                      </tr>
                    );
                  })}
                  {rewardQuarter.rows.filter(r => r.pool > 0).length === 0 && (
                    <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#64748b" }}>Belum ada pool quarterly.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ ...S.card, overflowX: "auto", padding: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", padding: "6px 8px" }}>🏆 Leaderboard Reward Akumulasi (Full Year)</div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr>{["#", "EPI Store", "Budget Reward YTD", "Cair Bulanan", "Pool Q", "Pool Annual"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rewardYTD.filter(r => r.rw > 0).map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...S.td, fontWeight: 800, color: i < 3 ? "#d4af37" : "#94a3b8" }}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{r.n}</td>
                      <td style={{ ...S.td, color: "#d4af37", fontWeight: 700 }}>{fmt(r.rw)}</td>
                      <td style={{ ...S.td, color: "#4ade80", fontWeight: 700 }}>{fmt(r.monthly)}</td>
                      <td style={S.td}>{fmt(r.quarterly)}</td>
                      <td style={S.td}>{fmt(r.annual)}</td>
                    </tr>
                  ))}
                  {rewardYTD.filter(r => r.rw > 0).length === 0 && (
                    <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#64748b" }}>Belum ada reward cair.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ IMPORT TAB (ADMIN ONLY) ============ */}
        {tab === "import" && session.role === "admin" && (
          <div>
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "#d4af37" }}>📥 Import Data Realisasi (CSV)</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, lineHeight: 1.6 }}>
                Format per baris: <code style={{ color: "#fbbf24" }}>NAMA EPI STORE,BULAN,GOLDGRAM,MEEZAN GOLD,SILVERGRAM</code><br />
                Upload file .csv atau tempel isi CSV di kolom berikut. Nama EPI Store wajib sama dengan master existing. Bulan gunakan singkatan JAN-DEC. Angka tanpa titik/koma (contoh: 1422430000). Baris pertama boleh berupa header (akan diabaikan).
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Upload File CSV</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={S.input}
                  onChange={handleCSVFile}
                />
                {csvFileName && <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>File dimuat: <b style={{ color: "#e2e8f0" }}>{csvFileName}</b></div>}
              </div>
              <textarea
                style={{ ...S.input, minHeight: 140, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                placeholder={"EPIS TANGERANG,JAN,1422430000,972646000,0\nEPIS MALANG,JAN,0,0,866478400\nEPIS TANGERANG,FEB,2045728000,349749000,0"}
                value={csvText}
                onChange={e => {
                  setCsvText(e.target.value);
                  setCsvFileName("");
                  setImportPreview(null);
                }}
              />
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button style={{ ...S.btn, flex: 1 }} onClick={parseCSV}>🔍 Preview Import</button>
              </div>

              {importPreview && (
                <div style={{ marginTop: 12 }}>
                  {importPreview.errors.length > 0 && (
                    <div style={{ padding: 10, borderRadius: 8, background: "#1c1410", border: "1px solid #92400e", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>⚠️ {importPreview.errors.length} baris bermasalah (wajib diperbaiki sebelum import):</div>
                      {importPreview.errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: "#fca5a5" }}>{e}</div>)}
                    </div>
                  )}
                  {importPreview.rows.length > 0 && (
                    <>
                      <div style={{ ...S.card, overflowX: "auto", padding: 8, marginBottom: 8 }}>
                        <table style={{ borderCollapse: "collapse", width: "100%" }}>
                          <thead><tr>{["EPI Store", "Bulan", "Goldgram", "Meezan Gold", "Silvergram"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                          <tbody>
                            {importPreview.rows.map((r, i) => (
                              <tr key={i}>
                                <td style={{ ...S.td, fontWeight: 700 }}>{r.storeName}</td>
                                <td style={S.td}>{r.monthName}</td>
                                <td style={S.td}>{fmt(r.g)}</td>
                                <td style={S.td}>{fmt(r.m)}</td>
                                <td style={S.td}>{fmt(r.s)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        style={{ ...S.btn, opacity: importPreview.errors.length > 0 ? 0.55 : 1 }}
                        disabled={importPreview.errors.length > 0}
                        onClick={applyImport}
                      >
                        ✅ Konfirmasi & Simpan {importPreview.rows.length} Baris
                      </button>
                    </>
                  )}
                </div>
              )}
              {importMsg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: importMsg.ok ? "#4ade80" : "#f87171", textAlign: "center" }}>{importMsg.t}</div>}
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", marginBottom: 8 }}>📋 Data Tersimpan Saat Ini</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{Object.keys(data).length} entri data realisasi tersimpan.</div>
              <div style={{ ...S.card, maxHeight: 240, overflowY: "auto", padding: 8 }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead><tr>{["EPI Store", "Bulan", "Gold", "Meezan", "Silver", "BE"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(data).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([k, d]) => {
                      const [si, mi] = k.split("-").map(Number);
                      if (!STORES[si] || !accessibleStoreSet.has(si)) return null;
                      return (
                        <tr key={k}>
                          <td style={{ ...S.td, fontWeight: 700 }}>{STORES[si].n}</td>
                          <td style={S.td}>{MONTHS[mi]}</td>
                          <td style={S.td}>{fmt(d.g)}</td>
                          <td style={S.td}>{fmt(d.m)}</td>
                          <td style={S.td}>{fmt(d.s)}</td>
                          <td style={{ ...S.td, fontSize: 11, color: "#94a3b8" }}>{d.be}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ USER ACCESS MANAGEMENT (ADMIN ONLY) ============ */}
        {tab === "access" && session.role === "admin" && (
          <div>
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "#d4af37" }}>Buat Akun Pengguna</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 1fr auto", gap: 8, alignItems: "end" }}>
                <div>
                  <label style={S.label}>Nama Pengguna</label>
                  <input style={S.input} placeholder="cth: Andi - Goldgram" value={newPinName} onChange={e => setNewPinName(e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>PIN Baru (4-6 digit)</label>
                  <input style={S.input} inputMode="numeric" maxLength={6} placeholder="cth: 1111" value={newPin} onChange={e => setNewPin(e.target.value.replace(/[^\d]/g, ""))} />
                </div>
                <div>
                  <label style={S.label}>Peran</label>
                  <select style={S.select} value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="be">Brand Executive</option>
                    <option value="viewer">Manajemen (Hanya Lihat)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Penugasan Brand</label>
                  <select style={S.select} value={newUserBrand} disabled={newUserRole !== "be"} onChange={e => setNewUserBrand(e.target.value)}>
                    {BRANDS.map((brand) => <option key={brand.code} value={brand.code}>{brand.name}</option>)}
                  </select>
                </div>
                <button style={{ ...S.btn, width: "auto", padding: "10px 16px" }} onClick={addUser}>Tambah</button>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={S.label}>Akses EPI Store</label>
                <select
                  multiple
                  style={{ ...S.select, minHeight: 130 }}
                  value={newUserStores.map(String)}
                  disabled={newUserRole === "admin"}
                  onChange={e => setNewUserStores(Array.from(e.target.selectedOptions, option => Number(option.value)))}
                >
                  {STORES.map((store, i) => <option key={i} value={i}>{store.n}</option>)}
                </select>
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>Tahan Ctrl/Shift untuk memilih lebih dari satu. Admin otomatis memiliki akses semua store.</div>
              </div>
              {importMsg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: importMsg.ok ? "#4ade80" : "#f87171" }}>{importMsg.t}</div>}
            </div>

            <div style={{ ...S.card, overflowX: "auto" }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "#d4af37" }}>Pengguna dan Otorisasi</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>PIN disimpan sebagai hash dan tidak dapat ditampilkan kembali. Isi kolom PIN baru hanya saat ingin menggantinya.</div>
              <div style={{ marginTop: 14 }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1100 }}>
                  <thead><tr>{["Nama", "Peran", "Brand", "EPI Store", "Status", "PIN Baru", "Aksi"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={S.td}>
                          <input style={{ ...S.input, minWidth: 160 }} value={user.name} onChange={e => updateUserField(user.id, "name", e.target.value)} />
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select, minWidth: 130 }} value={user.role} disabled={user.id === session.id} onChange={e => updateUserField(user.id, "role", e.target.value)}>
                            <option value="be">Brand Executive</option>
                            <option value="viewer">Manajemen</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td style={S.td}>
                          <select
                            style={{ ...S.select, minWidth: 220 }}
                            value={user.brandCodes[0] ?? ""}
                            disabled={user.role !== "be"}
                            onChange={e => updateUserField(user.id, "brandCodes", e.target.value === "" ? [] : [e.target.value])}
                          >
                            <option value="">Belum ditugaskan</option>
                            {BRANDS.map((brand) => <option key={brand.code} value={brand.code}>{brand.name}</option>)}
                          </select>
                        </td>
                        <td style={S.td}>
                          <select
                            multiple
                            style={{ ...S.select, minWidth: 260, minHeight: 96 }}
                            value={(user.storeCodes || []).map(String)}
                            disabled={user.role === "admin"}
                            onChange={e => updateUserField(user.id, "storeCodes", Array.from(e.target.selectedOptions, option => Number(option.value)))}
                          >
                            {STORES.map((store, i) => <option key={i} value={i}>{store.n}</option>)}
                          </select>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select, minWidth: 110 }} value={user.isActive ? "1" : "0"} disabled={user.id === session.id} onChange={e => updateUserField(user.id, "isActive", e.target.value === "1")}>
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                          </select>
                        </td>
                        <td style={S.td}>
                          <input
                            style={{ ...S.input, width: 120 }}
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Opsional"
                            value={userPinChanges[user.id] || ""}
                            onChange={e => setUserPinChanges(current => ({ ...current, [user.id]: e.target.value.replace(/[^\d]/g, "") }))}
                          />
                        </td>
                        <td style={S.td}><button style={S.btnGhost} onClick={() => saveUser(user)}>Simpan</button></td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#64748b" }}>Belum ada pengguna.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                Setiap submission mengambil identitas dari sesi server dan otomatis tercatat atas nama pengguna tersebut.
                Brand Executive hanya dapat melihat dan submit EPI Store yang ditugaskan, serta hanya dapat mengubah omzet brand yang ditugaskan kepadanya.
              </div>
            </div>
          </div>
        )}

        {/* ============ SETUP / SKEMA ============ */}
        {tab === "setup" && (
          <div>
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", marginBottom: 8 }}>Skema Reward Challenge Bulanan 2026</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead><tr>{["Kategori", "Tier", "Min. Omzet Bulanan", "GPM Rate", "BM", "% Reward", "Basis"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ...EMAS_TIERS.slice().reverse().map((tier) => ["EMAS", tier.name.replace("Emas ", ""), fmt(tier.min), pctRate(GPM_RATES.emas), pctRate(tier.bm), pctRate(GPM_RATES.emas * tier.bm), "GOLDGRAM + MEEZAN GOLD"]),
                      ...PERAK_TIERS.slice().reverse().map((tier) => ["PERAK", tier.name.replace("Perak ", ""), fmt(tier.min), pctRate(GPM_RATES.perak), pctRate(tier.bm), pctRate(GPM_RATES.perak * tier.bm), "SILVERGRAM"]),
                    ].map((row, i) => (
                      <tr key={i}>{row.map((c, j) => <td key={j} style={{ ...S.td, color: row[0] === "EMAS" ? (j === 0 ? "#fbbf24" : "#e2e8f0") : (j === 0 ? "#cbd5e1" : "#e2e8f0"), fontWeight: j === 0 ? 700 : 400 }}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 18, marginTop: 10, lineHeight: 1.7 }}>
                <li>GPM Emas = 4% x omzet GOLDGRAM + MEEZAN GOLD. GPM Perak = 20% x omzet SILVERGRAM.</li>
                <li>Reward dihitung dari GPM x BM sesuai tier omzet aktual bulan terpilih.</li>
                <li>Di bawah tier minimum → reward kategori Rp 0. Cair parsial jika hanya satu kategori lolos.</li>
                <li>Berlaku mulai JUN 2026. JAN-MAY tetap tercatat sebagai realisasi performa, tetapi tidak membentuk reward.</li>
              </ul>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", marginBottom: 8 }}>Distribusi Payout Reward</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead><tr>{["Kantong Payout", "Porsi", "Syarat", "Catatan"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ["Reward Bulanan", pctRate(PAYOUT_DISTRIBUTION.monthly), "Eligible jika reward budget terbentuk", "Dibayarkan setiap bulan"],
                      ["Reward Quarterly", pctRate(PAYOUT_DISTRIBUTION.quarterly), `Pencapaian quarter >= ${PAYOUT_THRESHOLDS.quarterly}%`, "Pool dari akumulasi 20% reward bulanan, cair full jika eligible"],
                      ["Reward Akhir Tahun", pctRate(PAYOUT_DISTRIBUTION.annual), `Pencapaian tahunan >= ${PAYOUT_THRESHOLDS.annual}%`, "85%-99,99% proporsional; >=100% full"],
                    ].map((row, i) => (
                      <tr key={i}>{row.map((c, j) => <td key={j} style={{ ...S.td, fontWeight: j === 0 ? 700 : 400 }}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, lineHeight: 1.7 }}>
                Total budget reward tetap 100%. Sistem hanya membagi pola pencairan menjadi 70% bulanan, 20% quarterly, dan 10% akhir tahun. Distribusi ini mulai dihitung dari JUN 2026.
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", marginBottom: 8 }}>Bobot Target Bulanan</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MONTHS.map((m, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: "#0f172a", border: "1px solid #334155", fontSize: 12, textAlign: "center", minWidth: 62 }}>
                    <div style={{ fontWeight: 800 }}>{m}</div>
                    <div style={{ color: "#d4af37", fontWeight: 700 }}>{pctWeight(WEIGHTS[i])}</div>
                    <div style={{ fontSize: 10, color: SEASON[i] === "High" ? "#4ade80" : SEASON[i] === "Low" ? "#60a5fa" : "#94a3b8" }}>{SEASON[i]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", marginBottom: 8 }}>Master Target EPI Store Akses ({accessibleStoreCodes.length} Store)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead><tr>{["EPI Store", "Seg", "Gold", "Meezan", "Silver", "Total"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {accessibleStoreCodes.map((i) => {
                      const s = STORES[i];
                      return (
                        <tr key={i}>
                          <td style={{ ...S.td, fontWeight: 700 }}>{s.n}</td>
                          <td style={{ ...S.td, fontSize: 10, color: "#94a3b8" }}>{s.seg}</td>
                          <td style={S.td}>{fmtS(s.g)}</td>
                          <td style={S.td}>{fmtS(s.m)}</td>
                          <td style={S.td}>{fmtS(s.s)}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{fmtS(s.g + s.m + s.s)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
