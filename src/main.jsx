
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Trophy, CircleDollarSign, Plus, Search, AlertTriangle, BarChart3, List, Settings, Trash2, Clock, CalendarDays, Flame, TrendingUp, TrendingDown, WalletCards, Pencil, Save, X } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import "./style.css";

const STORAGE_KEY = "clarence_poker_tracker_records_v1";
const TZ = "America/Los_Angeles";

const demoRecords = [
  { id: 1, date: "2026-05-18", gameType: "Tournament", startTime: "19:30", endTime: "22:45", buyIn: 25, bullets: 1, cashOut: 0, notes: "Bounty tournament. Lost flip late." },
  { id: 2, date: "2026-05-19", gameType: "Cash", startTime: "20:15", endTime: "21:40", buyIn: 100, bullets: 1, cashOut: 142, notes: "Short session. Good stop." },
  { id: 3, date: "2026-05-21", gameType: "Tournament", startTime: "18:20", endTime: "23:10", buyIn: 10.8, bullets: 2, cashOut: 48.25, notes: "ITM. Stayed patient near bubble." },
];

function californiaParts() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

function newBlankRecord() {
  const ca = californiaParts();
  return { id: Date.now(), date: ca.date, gameType: "Tournament", startTime: ca.time, endTime: ca.time, buyIn: "", bullets: 1, cashOut: "", notes: "" };
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : demoRecords;
  } catch {
    return demoRecords;
  }
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function calcCashIn(record) {
  return Number(record.buyIn || 0) * Number(record.bullets || 0);
}

function calcPL(record) {
  return Number(record.cashOut || 0) - calcCashIn(record);
}

function prettyDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function monthKey(dateStr) {
  if (!dateStr) return "Unknown";
  const [y, m] = dateStr.split("-");
  return `${y}-${m}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function duration(record) {
  if (!record.startTime || !record.endTime) return "";
  const [sh, sm] = record.startTime.split(":").map(Number);
  const [eh, em] = record.endTime.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Stat({ icon: Icon, label, value, trend }) {
  return (
    <Card className="statCard">
      <div className="statIcon"><Icon size={19} /></div>
      <div>
        <p className="tiny muted">{label}</p>
        <p className={`statValue ${trend || ""}`}>{value}</p>
      </div>
    </Card>
  );
}

function Input({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

function Select({ label, children, ...props }) {
  return <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;
}

function TextArea({ label, ...props }) {
  return <label className="field full"><span>{label}</span><textarea {...props} /></label>;
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "record", label: "Record", icon: Plus },
    { id: "history", label: "History", icon: List },
    { id: "graphs", label: "Graphs", icon: BarChart3 },
    { id: "settings", label: "More", icon: Settings },
  ];
  return (
    <nav className="bottomNav">
      <div className="bottomInner">
        {items.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`navButton ${tab === item.id ? "active" : ""}`}><Icon size={21} /><span>{item.label}</span></button>;
        })}
      </div>
    </nav>
  );
}

function RecordForm({ onSave }) {
  const [form, setForm] = useState(newBlankRecord());
  const cashIn = calcCashIn(form);
  const pl = calcPL(form);

  function update(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  function resetTimeNow() {
    const ca = californiaParts();
    setForm((prev) => ({ ...prev, date: ca.date, startTime: ca.time, endTime: ca.time }));
  }
  function save() {
    if (!form.buyIn && !form.cashOut) return;
    onSave({ ...form, id: Date.now(), buyIn: Number(form.buyIn || 0), bullets: Number(form.bullets || 1), cashOut: Number(form.cashOut || 0) });
    setForm(newBlankRecord());
  }

  return (
    <section className="page">
      <div className="hero">
        <div>
          <p className="eyebrow">California time · local save</p>
          <h1>Poker Session Tracker</h1>
          <p className="heroSub">Track tournaments, cash games, bullets, cash-outs, and session P/L.</p>
        </div>
        <div className="heroChip"><Trophy size={22} /></div>
      </div>

      <div className="quickStats">
        <Stat icon={WalletCards} label="Cash-In" value={money(cashIn)} />
        <Stat icon={CircleDollarSign} label="Cash-Out" value={money(form.cashOut)} />
        <Stat icon={pl >= 0 ? TrendingUp : TrendingDown} label="P/L" value={money(pl)} trend={pl >= 0 ? "good" : "bad"} />
      </div>

      <Card className="formCard">
        <div className="formTop">
          <div>
            <h2>New Record</h2>
            <p>Profit/Loss = cash-out − buy-in × bullets.</p>
          </div>
          <button type="button" className="ghostButton" onClick={resetTimeNow}><Clock size={16} /> Now</button>
        </div>

        <div className="formGrid">
          <Input label="Date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
          <Select label="Game Type" value={form.gameType} onChange={(e) => update("gameType", e.target.value)}><option>Tournament</option><option>Cash</option></Select>
          <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
          <Input label="End Time" type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
          <Input label="Buy-in" type="number" inputMode="decimal" placeholder="25" value={form.buyIn} onChange={(e) => update("buyIn", e.target.value)} />
          <Input label="No. of Bullets" type="number" inputMode="numeric" min="1" value={form.bullets} onChange={(e) => update("bullets", e.target.value)} />
          <Input label="Cash-out" type="number" inputMode="decimal" placeholder="0" value={form.cashOut} onChange={(e) => update("cashOut", e.target.value)} />
          <label className="field"><span>Profit/Loss</span><input readOnly value={money(pl)} className={pl >= 0 ? "profitInput" : "lossInput"} /></label>
          <TextArea label="Notes" rows="4" placeholder="Key hand, mental state, discipline note, table condition..." value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>

        <button type="button" className="saveButton" onClick={save}><Save size={18} /> Save Session</button>
      </Card>
    </section>
  );
}

function History({ records, setRecords }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editing, setEditing] = useState(null);

  const filtered = records
    .filter((r) => typeFilter === "All" || r.gameType === typeFilter)
    .filter((r) => Object.values(r).join(" ").toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);

  function deleteRecord(id) { setRecords(records.filter((r) => r.id !== id)); }
  function saveEdit() {
    setRecords(records.map((r) => (r.id === editing.id ? { ...editing, buyIn: Number(editing.buyIn || 0), bullets: Number(editing.bullets || 1), cashOut: Number(editing.cashOut || 0) } : r)));
    setEditing(null);
  }

  return (
    <section className="page">
      <div className="sectionHeader"><div><p className="eyebrow">Browse records</p><h1>History</h1></div><div className="recordCount">{filtered.length}</div></div>
      <Card>
        <div className="historyTools">
          <div className="searchBox"><Search size={16} /><input placeholder="Search notes, date, type..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All</option><option>Cash</option><option>Tournament</option></select>
        </div>
      </Card>

      <div className="recordList">
        {filtered.map((r) => {
          const pl = calcPL(r), cashIn = calcCashIn(r);
          return (
            <Card key={r.id} className="recordCard">
              {editing?.id === r.id ? (
                <div className="editGrid">
                  <Input label="Date" type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
                  <Select label="Type" value={editing.gameType} onChange={(e) => setEditing({ ...editing, gameType: e.target.value })}><option>Tournament</option><option>Cash</option></Select>
                  <Input label="Start" type="time" value={editing.startTime} onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} />
                  <Input label="End" type="time" value={editing.endTime} onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} />
                  <Input label="Buy-in" type="number" value={editing.buyIn} onChange={(e) => setEditing({ ...editing, buyIn: e.target.value })} />
                  <Input label="Bullets" type="number" value={editing.bullets} onChange={(e) => setEditing({ ...editing, bullets: e.target.value })} />
                  <Input label="Cash-out" type="number" value={editing.cashOut} onChange={(e) => setEditing({ ...editing, cashOut: e.target.value })} />
                  <TextArea label="Notes" rows="3" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
                  <div className="editActions"><button type="button" className="smallButton" onClick={saveEdit}><Save size={16}/> Save</button><button type="button" className="smallButton secondary" onClick={() => setEditing(null)}><X size={16}/> Cancel</button></div>
                </div>
              ) : (
                <>
                  <div className="recordTop">
                    <div><p className="dateLine"><CalendarDays size={15} /> {prettyDate(r.date)}</p><h3>{r.gameType}</h3><p className="tiny muted">{r.startTime}–{r.endTime} · {duration(r)}</p></div>
                    <div className={`plBadge ${pl >= 0 ? "win" : "loss"}`}>{money(pl)}</div>
                  </div>
                  <div className="recordMetrics"><div><span>Cash-In</span><strong>{money(cashIn)}</strong></div><div><span>Bullets</span><strong>{r.bullets}</strong></div><div><span>Cash-Out</span><strong>{money(r.cashOut)}</strong></div></div>
                  {r.notes && <p className="noteBlock">{r.notes}</p>}
                  <div className="recordActions"><button type="button" onClick={() => setEditing(r)}><Pencil size={15} /> Edit</button><button type="button" onClick={() => deleteRecord(r.id)}><Trash2 size={15} /> Delete</button></div>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Graphs({ records }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [xAxis, setXAxis] = useState("Sessions");
  const [yAxis, setYAxis] = useState("Profit/Loss");
  const [chartType, setChartType] = useState("Line");

  const filtered = records.filter((r) => typeFilter === "All" || r.gameType === typeFilter).sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id);

  const chartData = useMemo(() => {
    if (xAxis === "Months") {
      const grouped = {};
      filtered.forEach((r) => {
        const key = monthKey(r.date);
        if (!grouped[key]) grouped[key] = { key, label: monthLabel(key), buyIn: 0, cashOut: 0, profitLoss: 0, sessions: 0 };
        grouped[key].buyIn += calcCashIn(r);
        grouped[key].cashOut += Number(r.cashOut || 0);
        grouped[key].profitLoss += calcPL(r);
        grouped[key].sessions += 1;
      });
      return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
    }
    return filtered.map((r, index) => ({ label: `#${index + 1}`, buyIn: calcCashIn(r), cashOut: Number(r.cashOut || 0), profitLoss: calcPL(r), date: prettyDate(r.date), gameType: r.gameType }));
  }, [filtered, xAxis]);

  const metricKey = yAxis === "Buy-In" ? "buyIn" : yAxis === "Cash-Out" ? "cashOut" : "profitLoss";
  const totalPL = filtered.reduce((s, r) => s + calcPL(r), 0);
  const totalBuyIn = filtered.reduce((s, r) => s + calcCashIn(r), 0);
  const totalCashOut = filtered.reduce((s, r) => s + Number(r.cashOut || 0), 0);
  const wins = filtered.filter((r) => calcPL(r) > 0).length;

  return (
    <section className="page">
      <div className="sectionHeader"><div><p className="eyebrow">Performance view</p><h1>Graphs</h1></div><Flame className="flame" size={29} /></div>
      <div className="quickStats"><Stat icon={TrendingUp} label="Total P/L" value={money(totalPL)} trend={totalPL >= 0 ? "good" : "bad"} /><Stat icon={WalletCards} label="Total Buy-In" value={money(totalBuyIn)} /><Stat icon={CircleDollarSign} label="Cash-Out" value={money(totalCashOut)} /><Stat icon={Trophy} label="Win Rate" value={filtered.length ? `${Math.round((wins / filtered.length) * 100)}%` : "0%"} /></div>

      <Card>
        <div className="filterGrid">
          <Select label="Game Filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="All">Cash + Tourney</option><option value="Cash">Cash</option><option value="Tournament">Tourney</option></Select>
          <Select label="X-Axis" value={xAxis} onChange={(e) => setXAxis(e.target.value)}><option>Sessions</option><option>Months</option></Select>
          <Select label="Y-Axis" value={yAxis} onChange={(e) => setYAxis(e.target.value)}><option>Profit/Loss</option><option>Buy-In</option><option>Cash-Out</option></Select>
          <Select label="Chart Type" value={chartType} onChange={(e) => setChartType(e.target.value)}><option>Line</option><option>Bar</option><option>Area</option></Select>
        </div>
      </Card>

      <Card className="chartCard">
        <div className="chartHeader"><div><h2>{yAxis}</h2><p>{typeFilter === "All" ? "Cash + Tourney" : typeFilter} · by {xAxis.toLowerCase()}</p></div></div>
        <div className="bigChart">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "Bar" ? (
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#8EA0B8" fontSize={12} /><YAxis stroke="#8EA0B8" fontSize={12} /><Tooltip content={<PokerTooltip metricKey={metricKey} />} /><Bar dataKey={metricKey} radius={[10, 10, 0, 0]} fill="#D6B35A" /></BarChart>
            ) : chartType === "Area" ? (
              <AreaChart data={chartData}><defs><linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D6B35A" stopOpacity={0.75}/><stop offset="95%" stopColor="#D6B35A" stopOpacity={0.04}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#8EA0B8" fontSize={12} /><YAxis stroke="#8EA0B8" fontSize={12} /><Tooltip content={<PokerTooltip metricKey={metricKey} />} /><Area type="monotone" dataKey={metricKey} stroke="#D6B35A" fill="url(#goldArea)" strokeWidth={3} /></AreaChart>
            ) : (
              <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#8EA0B8" fontSize={12} /><YAxis stroke="#8EA0B8" fontSize={12} /><Tooltip content={<PokerTooltip metricKey={metricKey} />} /><Line type="monotone" dataKey={metricKey} stroke="#D6B35A" strokeWidth={3} dot={{ r: 4, fill: "#D6B35A" }} /></LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

function PokerTooltip({ active, payload, label, metricKey }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return <div className="tooltip"><p className="tooltipTitle">{label}</p>{item?.date && <p>{item.date} · {item.gameType}</p>}<p>{metricKey}: <strong>{money(payload[0].value)}</strong></p>{item?.sessions && <p>Sessions: {item.sessions}</p>}</div>;
}

function SettingsPage({ records, setRecords }) {
  function exportJSON() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "poker-tracker-records.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function resetDemo() { setRecords(demoRecords); }
  function clearAll() { if (confirm("Delete all poker records on this device?")) setRecords([]); }

  return (
    <section className="page">
      <div className="sectionHeader"><div><p className="eyebrow">App controls</p><h1>More</h1></div></div>
      <Card><h2>iPhone install</h2><p className="muted paragraph">Open your Vercel link in Safari, tap Share, then Add to Home Screen. This app saves data locally on the iPhone/Safari browser.</p></Card>
      <Card><h2>Data tools</h2><div className="settingsActions"><button type="button" onClick={exportJSON}>Export JSON</button><button type="button" onClick={resetDemo}>Reset Demo Records</button><button type="button" onClick={clearAll} className="danger">Clear All Records</button></div></Card>
      <Card><h2>Next upgrades</h2><ul className="upgradeList"><li>Cloud sync with Supabase/Firebase.</li><li>CSV import/export.</li><li>Stake-selling and rebuy dilution calculations.</li><li>Monthly bankroll report and discipline reminders.</li><li>Separate tournament/cash dashboards.</li></ul></Card>
    </section>
  );
}

function App() {
  const [tab, setTab] = useState("record");
  const [records, setRecords] = useState(loadRecords);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }, [records]);
  function addRecord(record) { setRecords((prev) => [record, ...prev]); setTab("history"); }

  return <div className="appShell"><main className="container">{tab === "record" && <RecordForm onSave={addRecord} />}{tab === "history" && <History records={records} setRecords={setRecords} />}{tab === "graphs" && <Graphs records={records} />}{tab === "settings" && <SettingsPage records={records} setRecords={setRecords} />}</main><BottomNav tab={tab} setTab={setTab} /></div>;
}

createRoot(document.getElementById("root")).render(<App />);
