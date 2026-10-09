import { useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Battery, Bell, BusFront, Check,
  ChevronDown, CircleHelp, Clock3, Download, Eye, Filter, HeartHandshake,
  MapPin, Mic2, Moon, Pause, Play, Radio, RefreshCw, Search,
  Send, Settings2, Siren, Sun, Volume2, Wifi,
  X,
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './App.css'

type Status = 'Waiting' | 'Bus Approaching' | 'Boarded'
type IncidentStatus = 'Open' | 'Assigned' | 'Resolved'
type FleetStatus = 'Healthy' | 'Low battery' | 'Offline'

interface Request { id: string; stop: string; bay: number; route: string; seconds: number; status: Status; alerted: boolean }
interface Incident { id: string; type: string; location: string; created: string; sla: string; assignee: string; status: IncidentStatus }
interface FleetUnit { id: string; type: 'Stop beacon' | 'Bus unit'; location: string; battery: number; lastSeen: number; status: FleetStatus }
interface Bus { route: string; destination: string; zone: 'Near' | 'Mid' | 'Far'; trend: 'Approaching' | 'Passing' | 'Dwelling'; dwell: number }
interface StopScore { name: string; score: number; wait: string; health: number; x: number; y: number }

const stops = ['Central Station', 'Adyar Depot', 'Guindy', 'T Nagar', 'Mylapore', 'Velachery', 'Anna Nagar', 'Egmore', 'Thiruvanmiyur', 'Porur', 'Tambaram', 'Royapettah']
const technicians = ['Arun K.', 'Priya S.', 'Karthik R.', 'Unassigned']
const initialRequests: Request[] = [
  { id: '#PWD-104', stop: 'Central Station', bay: 2, route: '23C', seconds: 74, status: 'Waiting', alerted: false },
  { id: '#PWD-087', stop: 'Adyar Depot', bay: 1, route: '18A', seconds: 182, status: 'Bus Approaching', alerted: true },
  { id: '#PWD-112', stop: 'Guindy', bay: 3, route: '21G', seconds: 246, status: 'Boarded', alerted: true },
]
const initialIncidents: Incident[] = [
  { id: 'INC-2084', type: 'Beacon offline', location: 'Velachery · Bay 2', created: '10:42', sla: '01:14:22', assignee: 'Unassigned', status: 'Open' },
  { id: 'INC-2083', type: 'Possible skipped stop', location: '47A · T Nagar', created: '10:36', sla: '00:47:08', assignee: 'Priya S.', status: 'Open' },
  { id: 'INC-2082', type: 'Low battery', location: 'Mylapore · Stop beacon', created: '09:58', sla: '00:19:44', assignee: 'Arun K.', status: 'Assigned' },
  { id: 'INC-2081', type: 'Missed announcement', location: '23C · Egmore', created: '09:21', sla: 'Resolved', assignee: 'Karthik R.', status: 'Resolved' },
]
const initialFleet: FleetUnit[] = [
  { id: 'STP-CEN-01', type: 'Stop beacon', location: 'Central Station · Bay 2', battery: 96, lastSeen: 4, status: 'Healthy' },
  { id: 'STP-MYL-02', type: 'Stop beacon', location: 'Mylapore · Bay 1', battery: 23, lastSeen: 12, status: 'Low battery' },
  { id: 'BUS-23C-04', type: 'Bus unit', location: 'Route 23C · Vehicle 04', battery: 78, lastSeen: 7, status: 'Healthy' },
  { id: 'STP-VEL-02', type: 'Stop beacon', location: 'Velachery · Bay 2', battery: 64, lastSeen: 72, status: 'Offline' },
  { id: 'BUS-47A-11', type: 'Bus unit', location: 'Route 47A · Vehicle 11', battery: 41, lastSeen: 18, status: 'Low battery' },
  { id: 'STP-GUI-01', type: 'Stop beacon', location: 'Guindy · Bay 1', battery: 89, lastSeen: 5, status: 'Healthy' },
]
const stopScores: StopScore[] = stops.map((name, i) => ({ name, score: [91, 64, 82, 48, 73, 44, 87, 69, 56, 78, 38, 84][i], wait: `${4 + (i % 5)}m ${12 + i}s`, health: [98, 76, 91, 64, 88, 52, 94, 83, 71, 89, 61, 95][i], x: 10 + (i % 4) * 25, y: 18 + Math.floor(i / 4) * 31 }))

function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }
function trendIcon(value: number) { return value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} /> }
function zoneClass(zone: string) { return `zone zone-${zone.toLowerCase()}` }

function Section({ number, title, subtitle, icon, children, className = '' }: { number: string; title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`panel section ${className}`}><div className="section-head"><div className="section-title"><span className="section-number">{number}</span><span className="section-icon">{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div><button className="icon-btn" aria-label={`Panel settings for ${title}`}><Settings2 size={18} /></button></div>{children}</section>
}

function App() {
  const [dark, setDark] = useState(true)
  const [requests, setRequests] = useState(initialRequests)
  const [incidents, setIncidents] = useState(initialIncidents)
  const [fleet, setFleet] = useState(initialFleet)
  const [buses, setBuses] = useState<Bus[]>([
    { route: '23C', destination: 'Tambaram', zone: 'Near', trend: 'Approaching', dwell: 22 },
    { route: '47A', destination: 'Avadi', zone: 'Mid', trend: 'Passing', dwell: 0 },
    { route: '18A', destination: 'Adyar', zone: 'Far', trend: 'Dwelling', dwell: 41 },
  ])
  const [signal, setSignal] = useState(() => Array.from({ length: 24 }, (_, i) => ({ t: i, raw: -78 + Math.round(Math.sin(i / 2) * 7) + (i % 3), smooth: -78 + Math.round(Math.sin(i / 3) * 4) })))
  const [scenario, setScenario] = useState<'idle' | 'running' | 'paused' | 'complete'>('idle')
  const [scenarioStep, setScenarioStep] = useState(0)
  const [message, setMessage] = useState('')
  const [language, setLanguage] = useState('English')
  const [dispatchStop, setDispatchStop] = useState(stops[0])
  const [sentMessages, setSentMessages] = useState([{ stop: 'Adyar Depot', language: 'Tamil', message: 'வழி 18A வருகை...', time: '10:41', status: 'Delivered' }])
  const [clock, setClock] = useState(new Date())
  const [search, setSearch] = useState('')
  const [openEvidence, setOpenEvidence] = useState<string | null>(null)

  useEffect(() => { const id = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(id) }, [])
  useEffect(() => {
    const id = window.setInterval(() => {
      setRequests(prev => prev.map(r => r.status === 'Boarded' ? r : { ...r, seconds: r.seconds + 1 }))
      setSignal(prev => [...prev.slice(-23), { t: prev[prev.length - 1].t + 1, raw: -72 + Math.round((Math.random() - .5) * 18), smooth: Math.round(prev[prev.length - 1].smooth * .65 + (-72 + Math.random() * 6) * .35) }])
      setFleet(prev => prev.map(unit => { const battery = Math.max(5, unit.battery - (Math.random() > .82 ? 1 : 0)); return { ...unit, battery, status: unit.lastSeen > 60 ? 'Offline' : battery < 30 ? 'Low battery' : 'Healthy' } }))
      setBuses(prev => prev.map(b => ({ ...b, dwell: b.trend === 'Dwelling' ? b.dwell + 1 : b.dwell })))
    }, 2000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    if (scenario !== 'running') return
    const id = window.setInterval(() => setScenarioStep(s => s >= 6 ? 6 : s + 1), 8500)
    return () => window.clearInterval(id)
  }, [scenario])
  useEffect(() => {
    if (scenarioStep === 1) setRequests(prev => [{ id: '#PWD-DEMO', stop: 'Central Station', bay: 2, route: '23C', seconds: 2, status: 'Waiting', alerted: false }, ...prev])
    if (scenarioStep === 2) setBuses(prev => [{ route: '47A', destination: 'Avadi', zone: 'Near', trend: 'Passing', dwell: 0 }, ...prev.filter(b => b.route !== '47A')])
    if (scenarioStep === 3) setBuses(prev => [{ route: '23C', destination: 'Tambaram', zone: 'Near', trend: 'Approaching', dwell: 12 }, ...prev.filter(b => b.route !== '23C')])
    if (scenarioStep === 4) setRequests(prev => prev.map(r => r.id === '#PWD-DEMO' ? { ...r, alerted: true, status: 'Bus Approaching' } : r))
    if (scenarioStep === 5) setBuses(prev => prev.map(b => b.route === '23C' ? { ...b, trend: 'Dwelling', dwell: 38 } : b))
    if (scenarioStep === 6) { setRequests(prev => prev.map(r => r.id === '#PWD-DEMO' ? { ...r, status: 'Boarded' } : r)); setScenario('complete') }
  }, [scenarioStep])

  const kpis = [
    { label: 'Avg wait time', value: '04:18', delta: 8, color: 'cyan', data: [3, 4, 3, 5, 4, 4, 3, 4] },
    { label: 'Boarding success rate', value: '94.6%', delta: 2.1, color: 'green', data: [88, 90, 89, 92, 91, 94, 93, 95] },
    { label: 'Announcement accuracy', value: '98.2%', delta: 1.4, color: 'purple', data: [94, 96, 95, 97, 96, 98, 98] },
    { label: 'Beacon uptime', value: '99.1%', delta: .6, color: 'amber', data: [97, 98, 98, 99, 98, 99, 99, 99] },
    { label: 'Open incidents', value: String(incidents.filter(i => i.status !== 'Resolved').length).padStart(2, '0'), delta: -12, color: 'red', data: [8, 7, 8, 6, 7, 5, 5, 4] },
  ]

  const alertDriver = (id: string) => setRequests(prev => prev.map(r => r.id === id ? { ...r, alerted: true, status: 'Bus Approaching' } : r))
  const updateIncident = (id: string, patch: Partial<Incident>) => setIncidents(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  const startScenario = () => { setScenario('running'); setScenarioStep(0) }
  const resetScenario = () => { setScenario('idle'); setScenarioStep(0); setRequests(initialRequests); setBuses([{ route: '23C', destination: 'Tambaram', zone: 'Near', trend: 'Approaching', dwell: 22 }, { route: '47A', destination: 'Avadi', zone: 'Mid', trend: 'Passing', dwell: 0 }, { route: '18A', destination: 'Adyar', zone: 'Far', trend: 'Dwelling', dwell: 41 }]) }
  const broadcast = () => { if (!message.trim()) return; setSentMessages(prev => [{ stop: dispatchStop, language, message, time: clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'Delivered' }, ...prev]); setMessage('') }
  const previewAudio = () => { if ('speechSynthesis' in window && message.trim()) window.speechSynthesis.speak(new SpeechSynthesisUtterance(message)) }
  const exportReport = () => { const rows = [['Metric', 'Value'], ...kpis.map(k => [k.label, k.value]), [], ['Incident ID', 'Type', 'Location', 'Status', 'Assignee'], ...incidents.map(i => [i.id, i.type, i.location, i.status, i.assignee]), [], ['Unit', 'Type', 'Location', 'Battery', 'Status'], ...fleet.map(f => [f.id, f.type, f.location, `${f.battery}%`, f.status])]; const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'matc-monthly-compliance.csv'; a.click(); URL.revokeObjectURL(url) }

  return <div className={dark ? 'app dark' : 'app light'}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Radio size={22} /></div><div><strong>MetroPulse</strong><span>Accessible Transit Command</span></div></div>
      <div className="top-actions"><label className="select-wrap"><MapPin size={15} /><select aria-label="Select city"><option>Chennai Transit</option><option>Bengaluru Transit</option></select><ChevronDown size={14} /></label><span className="live-pill"><i /> LIVE <em>(SIMULATED DATA)</em></span><span className="clock">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><button className="scenario-btn" onClick={scenario === 'running' ? () => setScenario('paused') : startScenario} aria-label="Run demo scenario">{scenario === 'running' ? <Pause size={16} /> : <Play size={16} />} {scenario === 'running' ? 'Pause' : 'Run Demo Scenario'}</button><button className="theme-btn" onClick={() => setDark(v => !v)} aria-label="Toggle light theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
    </header>
    <div className="demo-banner"><CircleHelp size={16} /> Demo uses simulated data. Passenger guidance works offline; this dashboard is an optional cloud layer.</div>
    <main>
      <div className="welcome-row"><div><p className="eyebrow">OPERATIONS OVERVIEW · THU, 09 OCT 2026</p><h1>Good morning, control room.</h1><p className="muted">Here’s the pulse of accessible transit across Chennai.</p></div><div className="header-search"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stops, routes, IDs..." aria-label="Search dashboard" /></div></div>
      <div className="kpi-grid">{kpis.map(k => <div className="kpi-card" key={k.label}><div className="kpi-top"><span>{k.label}</span><span className={`trend ${k.delta < 0 ? 'down' : ''}`}>{trendIcon(k.delta)} {Math.abs(k.delta)}%</span></div><strong>{k.value}</strong><div className="sparkline" aria-label={`${k.label} trend`}><svg viewBox="0 0 120 30" role="img"><polyline className={`spark-${k.color}`} points={k.data.map((v, i) => `${i * 17},${30 - (v - Math.min(...k.data)) / (Math.max(...k.data) - Math.min(...k.data) || 1) * 22 - 3}`).join(' ')} /></svg></div></div>)}</div>

      <div className="two-col">
        <Section number="01" title="Assisted boarding radar" subtitle="Opt-in requests · Live queue" icon={<HeartHandshake size={18} /> } className="radar-panel">
          <div className="section-tools"><span className="small-live"><i /> 3 active requests</span><button className="ghost-btn"><Filter size={14} /> Filter</button></div>
          <div className="request-list">{requests.map(r => <div className={`request-card ${r.status === 'Boarded' ? 'boarded' : ''}`} key={r.id}><div className="request-main"><div className="avatar"><Eye size={17} /></div><div><div className="request-id">{r.id} <span className={`status-dot status-${r.status.replace(' ', '-').toLowerCase()}`} /> <span className="status-text">{r.status}</span></div><strong>{r.stop}</strong><p>Bay {r.bay} <span>·</span> Route <b>{r.route}</b></p></div><div className="wait-time"><Clock3 size={15} /> {formatTime(r.seconds)}</div></div><div className="request-footer"><small>Opt-in request. Anonymous. Deleted after boarding.</small>{r.status !== 'Boarded' ? r.alerted ? <span className="alerted"><Check size={14} /> Driver alerted</span> : <button className="alert-btn" onClick={() => alertDriver(r.id)}><Bell size={14} /> Alert driver</button> : <span className="boarded-label"><Check size={14} /> Completed</span>}</div>{r.alerted && r.status !== 'Boarded' && <div className="driver-message"><Bell size={14} /><span>Caution: visually impaired passenger waiting at {r.stop}, Bay {r.bay}. Stop at the bay and activate the front door beacon.</span></div>}</div>)}</div>
        </Section>
        <Section number="02" title="Live stop view" subtitle="Central Station · Bay 01–04" icon={<BusFront size={18} /> } className="stop-panel">
          <div className="bus-table"><div className="table-head"><span>ROUTE</span><span>PROXIMITY ZONE</span><span>SIGNAL TREND</span><span>DWELL</span></div>{buses.map(b => <div className="table-row" key={b.route}><strong><BusFront size={14} /> {b.route}</strong><span className={zoneClass(b.zone)}>{b.zone}</span><span className={`signal-${b.trend.toLowerCase()}`}><ArrowUpRight size={14} /> {b.trend}</span><span>{b.dwell}s</span></div>)}</div>
        </Section>
      </div>

      <Section number="03" title="Signal inspector" subtitle="BLE proximity telemetry · BUS-23C-04" icon={<Wifi size={18} />} className="signal-panel">
        <div className="signal-layout"><div className="chart-wrap"><div className="chart-legend"><span><i className="legend-raw" /> Raw RSSI</span><span><i className="legend-smooth" /> Smoothed signal</span><span className="chart-live"><i /> Updating live</span></div><ResponsiveContainer width="100%" height={190}><LineChart data={signal}><XAxis dataKey="t" hide /><YAxis domain={[-100, -40]} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={34} /><Tooltip contentStyle={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 8 }} /><Line type="monotone" dataKey="raw" stroke="#66758f" strokeWidth={1.5} dot={false} /><Line type="monotone" dataKey="smooth" stroke="var(--cyan)" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div><div className="signal-state"><span className="label">CURRENT PROXIMITY</span><strong className="near-value">Near</strong><div className="signal-bar"><span /></div><p>Stable signal. Bus is within boarding range.</p><div className="armed"><Check size={15} /> Announcement trigger <b>Armed</b></div><small>Armed after 3 consecutive rising readings</small></div></div>
      </Section>

      <div className="two-col">
        <Section number="04" title="Beacon fleet health" subtitle="30 units monitored · Last 60 seconds" icon={<Battery size={18} />} className="fleet-panel">
          <div className="health-summary"><span><i className="healthy-dot" /> 26 Healthy</span><span><i className="low-dot" /> 3 Low battery</span><span><i className="offline-dot" /> 1 Offline</span></div>
          <div className="fleet-table"><div className="table-head"><span>UNIT</span><span>LOCATION</span><span>BATTERY</span><span>STATUS</span></div>{fleet.map(f => <div className="table-row" key={f.id}><strong>{f.id}</strong><span>{f.location}</span><span className="battery-cell"><span className="battery-track"><i style={{ width: `${f.battery}%` }} /></span>{f.battery}%</span><span className={`fleet-status ${f.status.replace(' ', '-').toLowerCase()}`}>{f.status === 'Offline' ? <Wifi size={13} /> : <Battery size={13} />} {f.status}</span></div>)}</div><p className="predictive-note"><AlertTriangle size={15} /> Predictive maintenance: <b>STP-MYL-02</b> estimated empty in ~3 days.</p>
        </Section>
        <Section number="05" title="Incident workflow" subtitle="Human-in-the-loop resolution" icon={<Siren size={18} />} className="incident-panel">
          <div className="incident-filter"><span className="small-live"><i /> {incidents.filter(i => i.status !== 'Resolved').length} open incidents</span><button className="ghost-btn"><RefreshCw size={14} /> Refresh</button></div>
          <div className="incident-columns">{(['Open', 'Assigned', 'Resolved'] as IncidentStatus[]).map(status => <div className="incident-col" key={status}><div className="col-title"><span>{status}</span><b>{incidents.filter(i => i.status === status).length}</b></div>{incidents.filter(i => i.status === status).map(i => <div className="incident-card" key={i.id}><div className="incident-card-top"><b>{i.id}</b><span className={`severity ${i.type === 'Beacon offline' ? 'critical' : ''}`}>{i.type === 'Possible skipped stop' ? 'Flagged for review' : i.type}</span></div><strong>{i.location}</strong><small>Created {i.created} · SLA {i.sla}</small><div className="incident-actions"><select value={i.assignee} onChange={e => updateIncident(i.id, { assignee: e.target.value })} aria-label={`Assign ${i.id}`}><option disabled>Assign technician</option>{technicians.map(t => <option key={t}>{t}</option>)}</select><select value={i.status} onChange={e => updateIncident(i.id, { status: e.target.value as IncidentStatus })} aria-label={`Move ${i.id}`}><option>Open</option><option>Assigned</option><option>Resolved</option></select></div>{i.type === 'Possible skipped stop' && <button className="evidence-btn" onClick={() => setOpenEvidence(openEvidence === i.id ? null : i.id)}>{openEvidence === i.id ? 'Close evidence' : 'View evidence'} <ChevronDown size={13} /></button>}{openEvidence === i.id && <div className="evidence-drawer"><p><b>Proximity trace:</b> 10:34:12 → 10:34:50</p><p><b>Dwell:</b> 0 seconds · Bay beacon silent</p><p><b>Evidence:</b> GPS corridor match 92%</p><div><button className="confirm-btn" onClick={() => updateIncident(i.id, { status: 'Assigned' })}><Check size={13} /> Confirm</button><button className="dismiss-btn" onClick={() => updateIncident(i.id, { status: 'Resolved' })}><X size={13} /> Dismiss</button></div><small>Never auto-penalize. A human decides.</small></div>}</div>)}</div>)}</div>
        </Section>
      </div>

      <div className="two-col">
        <Section number="06" title="Accessibility equity heatmap" subtitle="Boarding experience score · 12 monitored stops" icon={<MapPin size={18} />} className="heat-panel">
          <div className="heatmap"><svg viewBox="0 0 400 235" role="img" aria-label="Accessibility equity heatmap"><path d="M30 35 Q120 5 200 45 T370 28 M22 112 Q115 75 190 120 T380 100 M30 195 Q150 150 220 190 T370 175" fill="none" stroke="var(--muted-line)" strokeWidth="1" />{stopScores.map(s => <g key={s.name} transform={`translate(${s.x * 3.2},${s.y})`} className="map-stop"><circle r="15" className={s.score >= 80 ? 'score-high' : s.score >= 50 ? 'score-mid' : 'score-low'} /><text textAnchor="middle" y="4" fill="#07121d" fontSize="10" fontWeight="700">{s.score}</text><title>{s.name}: score {s.score}, avg wait {s.wait}, beacon health {s.health}%</title></g>)}</svg><div className="map-legend"><span><i className="score-high" /> 80+ Good</span><span><i className="score-mid" /> 50–79 Watch</span><span><i className="score-low" /> Under 50 Action</span></div></div><div className="suggested"><h3>Suggested next installs</h3>{stopScores.filter(s => s.score < 70).sort((a, b) => a.score - b.score).slice(0, 3).map((s, i) => <div className="suggest-row" key={s.name}><b>0{i + 1}</b><span><strong>{s.name}</strong><small>Score {s.score} · {s.wait} avg wait</small></span><ArrowUpRight size={15} /></div>)}</div>
        </Section>
        <Section number="07" title="Announcement dispatcher" subtitle="Send accessible audio to a stop" icon={<MegaphoneIcon />} className="dispatch-panel">
          <div className="dispatch-form"><label>STOP<select value={dispatchStop} onChange={e => setDispatchStop(e.target.value)}>{stops.map(s => <option key={s}>{s}</option>)}</select></label><label>LANGUAGE<select value={language} onChange={e => setLanguage(e.target.value)}><option>English</option><option>Tamil</option><option>Hindi</option></select></label><label className="message-field">MESSAGE<textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Route 23C is arriving at Bay 2..." rows={3} /></label><div className="dispatch-buttons"><button className="ghost-btn" onClick={previewAudio}><Volume2 size={15} /> Preview audio</button><button className="primary-btn" onClick={broadcast}><Send size={15} /> Broadcast</button></div></div><div className="sent-log"><div className="log-title">RECENTLY SENT <span>All delivered</span></div>{sentMessages.map((m, i) => <div className="sent-row" key={i}><div className="sent-icon"><Volume2 size={14} /></div><div><strong>{m.stop}</strong><p>{m.message}</p></div><span><Check size={13} /> {m.status}<small>{m.time} · {m.language}</small></span></div>)}</div>
        </Section>
      </div>
      <Section number="08" title="Report export" subtitle="Share a monthly compliance snapshot" icon={<Download size={18} />} className="export-panel"><div className="export-content"><div><h3>Monthly accessibility compliance report</h3><p>Includes current KPIs, incident workflow, fleet health, and dispatch logs.</p></div><button className="primary-btn" onClick={exportReport}><Download size={16} /> Download monthly compliance report</button></div></Section>
    </main>
    {scenario !== 'idle' && <div className="scenario-bar"><div className="scenario-progress"><span style={{ width: `${Math.min(100, scenarioStep / 6 * 100)}%` }} /></div><span className="scenario-label"><Radio size={14} /> DEMO SCENARIO <b>{scenario === 'complete' ? 'Complete' : `Step ${scenarioStep + 1} of 6`}</b></span><p>{['Ready to start: simulate a complete assisted boarding story.', 'A commuter requests route 23C at Central Station.', '47A passes without stopping — flagged for review.', '23C is approaching; signal rising from Mid to Near.', 'Driver alerted with bay and beacon instructions.', 'Bus dwells 38 seconds at Bay 2.', 'Passenger boarded. Request closed; KPIs updated.'][scenarioStep]}</p><div className="scenario-controls"><button onClick={() => setScenario(scenario === 'paused' ? 'running' : 'paused')} aria-label="Pause or resume scenario">{scenario === 'paused' ? <Play size={15} /> : <Pause size={15} />}</button><button onClick={resetScenario} aria-label="Reset scenario"><RefreshCw size={15} /></button></div></div>}
  </div>
}

function MegaphoneIcon() { return <Mic2 size={18} /> }
export default App
