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
const WEIGHTS = [0.04, 0.07, 0.09, 0.075, 0.0875, 0.0875, 0.09, 0.105, 0.105, 0.075, 0.0875, 0.0875];
const SEASON = ["Low", "Low", "Normal", "Normal", "Normal", "Normal", "Normal", "High", "High", "Normal", "Normal", "Low"];

const EMAS_TIERS = [
  { min: 1.5e9, rate: 0.0015, name: "Emas Tier 3" },
  { min: 1e9, rate: 0.0012, name: "Emas Tier 2" },
  { min: 750e6, rate: 0.001, name: "Emas Tier 1" },
];
const PERAK_TIERS = [
  { min: 1e9, rate: 0.002, name: "Perak Tier 3" },
  { min: 300e6, rate: 0.0015, name: "Perak Tier 2" },
  { min: 150e6, rate: 0.001, name: "Perak Tier 1" },
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

const tierCalc = (omzet, tiers) => {
  for (const t of tiers) if (omzet >= t.min) return { ...t, reward: omzet * t.rate };
  return { name: "Belum Lolos", rate: 0, reward: 0 };
};

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
  const [userPinChanges, setUserPinChanges] = useState({});

  // CSV / bulk import
  const [csvText, setCsvText] = useState("");
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
    const emasTier = tierCalc(emasOmzet, EMAS_TIERS);
    const perakTier = tierCalc(perakOmzet, PERAK_TIERS);
    const target = tg + tm + ts, real = rg + rm + rs;
    const ach = target > 0 ? (real / target) * 100 : 0;
    return { st, tg, tm, ts, rg, rm, rs, target, real, ach, hasInput, emasOmzet, perakOmzet, emasTier, perakTier, totalReward: emasTier.reward + perakTier.reward, be: d?.be, note: d?.note };
  };

  // ===== INPUT TAB PREVIEW =====
  const inputPreview = useMemo(() => {
    const st = STORES[fStore], w = WEIGHTS[fMonth];
    const tg = st.g * w, tm = st.m * w, ts = st.s * w;
    const g = parseNum(fG), m = parseNum(fM), s = parseNum(fS);
    const emasTier = tierCalc(g + m, EMAS_TIERS);
    const perakTier = tierCalc(s, PERAK_TIERS);
    const target = tg + tm + ts, real = g + m + s;
    return { tg, tm, ts, g, m, s, emasTier, perakTier, target, real, ach: target > 0 ? real / target * 100 : 0 };
  }, [fStore, fMonth, fG, fM, fS]);

  const warn = inputPreview.real > inputPreview.target * 5 && inputPreview.real > 0;

  // ===== DASHBOARD COMPUTATIONS =====
  const dashRows = useMemo(() => {
    return STORES.map((_, i) => getRow(i, dMonth)).filter(r => dSeg === "ALL" || r.st.seg === dSeg);
  }, [data, dMonth, dSeg]);

  const dashKPI = useMemo(() => {
    const rows = STORES.map((_, i) => getRow(i, dMonth));
    const totReal = rows.reduce((a, r) => a + r.real, 0);
    const totTarget = rows.reduce((a, r) => a + r.target, 0);
    const totReward = rows.reduce((a, r) => a + r.totalReward, 0);
    const emasReward = rows.reduce((a, r) => a + r.emasTier.reward, 0);
    const perakReward = rows.reduce((a, r) => a + r.perakTier.reward, 0);
    const lolos = rows.filter(r => r.totalReward > 0).length;
    let ytdT = 0, ytdR = 0, ytdRw = 0;
    for (let m = 0; m <= dMonth; m++) {
      STORES.forEach((_, i) => {
        const r = getRow(i, m);
        ytdT += r.target; ytdR += r.real; ytdRw += r.totalReward;
      });
    }
    return { totReal, totTarget, totReward, emasReward, perakReward, lolos, ytdT, ytdR, ytdRw, ytdAch: ytdT > 0 ? ytdR / ytdT * 100 : 0 };
  }, [data, dMonth]);

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
    return { t, r, rw, ach: t > 0 ? r / t * 100 : 0 };
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
  const rewardRows = useMemo(() => STORES.map((_, i) => getRow(i, rMonth)).sort((a, b) => b.totalReward - a.totalReward), [data, rMonth]);
  const rewardYTD = useMemo(() => {
    return STORES.map((_, i) => {
      let rw = 0;
      for (let m = 0; m < 12; m++) rw += getRow(i, m).totalReward;
      return { n: STORES[i].n, rw };
    }).sort((a, b) => b.rw - a.rw);
  }, [data]);

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
        }),
      });
      await loadUsers();
      setImportMsg({ ok: true, t: `Akun ${name} berhasil dibuat.` });
      setNewPin("");
      setNewPinName("");
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
  const parseCSV = () => {
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
    } catch (error) {
      setImportMsg({ ok: false, t: error.message });
    }
    setTimeout(() => setImportMsg(null), 5000);
  };

  const assignedBrandCodes = session?.role === "admin"
    ? BRANDS.map((brand) => brand.code)
    : session?.brandCodes || [];
  const canEditBrand = (brandCode) => assignedBrandCodes.includes(brandCode);

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
    btnGhost: { padding: "8px 12px", borderRadius: 8, border: "1px solid #475569", background: "transparent", color: "#cbd5e1", fontWeight: 700, fontSize: 12, cursor: "pointer" },
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
      <div style={{ ...S.wrap, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
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
            <button style={S.btn} onClick={doLogin}>Masuk</button>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>
            Gunakan PIN akun yang diberikan administrator.<br />
            Akun awal hanya dibuat saat database pertama kali diinisialisasi.
          </div>
        </div>
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
              <p style={{ ...S.sub, marginTop: 0 }}>Dashboard Performance & Reward 2026 | Total Target: Rp 634,4 M</p>
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
                    {STORES.map((store, i) => <option key={i} value={i}>{store.n}</option>)}
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
                  <div>Total Reward: <b style={{ color: "#d4af37" }}>{fmt(inputPreview.emasTier.reward + inputPreview.perakTier.reward)}</b></div>
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
                Seluruh data EPIS dapat dibaca oleh semua pengguna. Anda dapat memilih semua EPI Store, tetapi hanya kolom brand yang ditugaskan kepada akun Anda yang dapat diubah.
              </div>
            </div>
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
              <div style={S.kpi}><div style={S.label}>Reward Cair {MONTHS[dMonth]}</div><div style={{ ...S.kpiV, color: "#d4af37" }}>{fmt(dashKPI.totReward)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Emas {fmt(dashKPI.emasReward)} | Perak {fmt(dashKPI.perakReward)}</div></div>
              <div style={S.kpi}><div style={S.label}>EPIS Lolos Reward</div><div style={S.kpiV}>{dashKPI.lolos} <span style={{ fontSize: 12, color: "#94a3b8" }}>/ 28</span></div></div>
              <div style={S.kpi}><div style={S.label}>YTD s.d. {MONTHS[dMonth]}</div><div style={S.kpiV}>{pct(dashKPI.ytdAch)}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtS(dashKPI.ytdR)} / {fmtS(dashKPI.ytdT)} | Reward YTD: {fmtS(dashKPI.ytdRw)}</div></div>
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
                  {["EPI Store", "Seg", "Target", "Realisasi", "Ach %", "Reward", "Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
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
                        <td style={S.td}><span style={S.badge(st)}>{st.t}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {STORES[3] && dSeg !== "GROWTH" && dSeg !== "START UP" && (
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
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Pilih EPI Store</label>
              <select style={S.select} value={pStore} onChange={e => setPStore(+e.target.value)}>
                {STORES.map((s, i) => <option key={i} value={i}>{s.n} ({s.seg})</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={S.kpi}><div style={S.label}>Target Tahun</div><div style={S.kpiV}>{fmtS(episYr.t)}</div></div>
              <div style={S.kpi}><div style={S.label}>Realisasi Tahun</div><div style={S.kpiV}>{fmtS(episYr.r)}</div></div>
              <div style={S.kpi}><div style={S.label}>Ach Tahun</div><div style={{ ...S.kpiV, color: episYr.ach >= 100 ? "#4ade80" : episYr.ach >= 75 ? "#60a5fa" : "#f87171" }}>{pct(episYr.ach)}</div></div>
              <div style={S.kpi}><div style={S.label}>Total Reward Tahun</div><div style={{ ...S.kpiV, color: "#d4af37" }}>{fmt(episYr.rw)}</div></div>
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
                  {["Bulan", "Target", "Realisasi", "Gap", "Ach %", "Tier Emas", "Tier Perak", "Reward", "Status", "BE"].map(h => <th key={h} style={S.th}>{h}</th>)}
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
                        <td style={S.td}><span style={S.badge(st)}>{st.t}</span></td>
                        <td style={{ ...S.td, fontSize: 11, color: "#94a3b8" }}>{r.be || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                    "Tier Perak", "Reward Perak", "Total Reward"].map((h, hi) => <th key={hi} style={S.th}>{h}</th>)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ ...S.card, overflowX: "auto", padding: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", padding: "6px 8px" }}>🏆 Leaderboard Reward Akumulasi (Full Year)</div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead><tr>{["#", "EPI Store", "Total Reward YTD"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rewardYTD.filter(r => r.rw > 0).map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...S.td, fontWeight: 800, color: i < 3 ? "#d4af37" : "#94a3b8" }}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{r.n}</td>
                      <td style={{ ...S.td, color: "#d4af37", fontWeight: 700 }}>{fmt(r.rw)}</td>
                    </tr>
                  ))}
                  {rewardYTD.filter(r => r.rw > 0).length === 0 && (
                    <tr><td colSpan={3} style={{ ...S.td, textAlign: "center", color: "#64748b" }}>Belum ada reward cair.</td></tr>
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
                Bulan gunakan singkatan JAN-DEC. Angka tanpa titik/koma (contoh: 1422430000). Baris pertama boleh berupa header (akan diabaikan).
              </div>
              <textarea
                style={{ ...S.input, minHeight: 140, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                placeholder={"EPIS TANGERANG,JAN,1422430000,972646000,0\nEPIS MALANG,JAN,0,0,866478400\nEPIS TANGERANG,FEB,2045728000,349749000,0"}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button style={{ ...S.btn, flex: 1 }} onClick={parseCSV}>🔍 Preview Import</button>
              </div>

              {importPreview && (
                <div style={{ marginTop: 12 }}>
                  {importPreview.errors.length > 0 && (
                    <div style={{ padding: 10, borderRadius: 8, background: "#1c1410", border: "1px solid #92400e", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>⚠️ {importPreview.errors.length} baris bermasalah (akan diabaikan):</div>
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
                      <button style={S.btn} onClick={applyImport}>✅ Konfirmasi & Simpan {importPreview.rows.length} Baris</button>
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
                      if (!STORES[si]) return null;
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
              {importMsg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: importMsg.ok ? "#4ade80" : "#f87171" }}>{importMsg.t}</div>}
            </div>

            <div style={{ ...S.card, overflowX: "auto" }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "#d4af37" }}>Pengguna dan Otorisasi</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>PIN disimpan sebagai hash dan tidak dapat ditampilkan kembali. Isi kolom PIN baru hanya saat ingin menggantinya.</div>
              <div style={{ marginTop: 14 }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 850 }}>
                  <thead><tr>{["Nama", "Peran", "Brand", "Status", "PIN Baru", "Aksi"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
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
                    {users.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#64748b" }}>Belum ada pengguna.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                Setiap submission mengambil identitas dari sesi server dan otomatis tercatat atas nama pengguna tersebut.
                Brand Executive dapat memilih seluruh EPI Store, tetapi hanya dapat mengubah omzet brand yang ditugaskan kepadanya.
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
                  <thead><tr>{["Kategori", "Tier", "Min. Omzet Bulanan", "Rate", "Basis"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[["EMAS", "Tier 1", fmt(750e6), "0,10%", "GOLDGRAM + MEEZAN GOLD"],
                    ["EMAS", "Tier 2", fmt(1e9), "0,12%", "GOLDGRAM + MEEZAN GOLD"],
                    ["EMAS", "Tier 3", fmt(1.5e9), "0,15%", "GOLDGRAM + MEEZAN GOLD"],
                    ["PERAK", "Tier 1", fmt(150e6), "0,10%", "SILVERGRAM"],
                    ["PERAK", "Tier 2", fmt(300e6), "0,15%", "SILVERGRAM"],
                    ["PERAK", "Tier 3", fmt(1e9), "0,20%", "SILVERGRAM"]].map((row, i) => (
                      <tr key={i}>{row.map((c, j) => <td key={j} style={{ ...S.td, color: row[0] === "EMAS" ? (j === 0 ? "#fbbf24" : "#e2e8f0") : (j === 0 ? "#cbd5e1" : "#e2e8f0"), fontWeight: j === 0 ? 700 : 400 }}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 18, marginTop: 10, lineHeight: 1.7 }}>
                <li>Reward dihitung per kategori, per EPI Store, dari omzet aktual bulan terpilih.</li>
                <li>Di bawah tier minimum → reward kategori Rp 0. Cair parsial jika hanya satu kategori lolos.</li>
                <li>Berlaku sepanjang tahun 2026 (JAN–DEC).</li>
              </ul>
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
              <div style={{ fontWeight: 800, fontSize: 14, color: "#d4af37", marginBottom: 8 }}>Master Target 28 EPI Store (Total Rp 634,4 M)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead><tr>{["EPI Store", "Seg", "Gold", "Meezan", "Silver", "Total"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {STORES.map((s, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 700 }}>{s.n}</td>
                        <td style={{ ...S.td, fontSize: 10, color: "#94a3b8" }}>{s.seg}</td>
                        <td style={S.td}>{fmtS(s.g)}</td>
                        <td style={S.td}>{fmtS(s.m)}</td>
                        <td style={S.td}>{fmtS(s.s)}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{fmtS(s.g + s.m + s.s)}</td>
                      </tr>
                    ))}
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
