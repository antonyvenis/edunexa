import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, animate, motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, BedDouble, Bell as BellIcon, BookOpen, Bus, CalendarClock, Check, ExternalLink, Eye, EyeOff, Lock, Mail, MessageSquare, Phone, Rocket, Send, ShieldCheck, CalendarCheck, CalendarDays, CheckCircle2, ClipboardList, Download, FileText, GraduationCap, IndianRupee, LayoutDashboard, LogOut, Megaphone,
  Library as LibraryIcon, Moon, NotebookPen, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Receipt, Search, ShieldAlert, Sparkles, Sun, Ticket, Trash2, UserCog, Users, XCircle } from 'lucide-react'
import { DEMO, api, auth, downloadHallTicket, downloadReceipt, downloadReport, exportExcel, me } from './api'

/* ---------- constants & helpers ---------- */
const [A, T, S, P] = ['admin', 'teacher', 'student', 'parent']
const NAV = [['/', 'Dashboard', LayoutDashboard, [A, T, S, P]], ['/students', 'Students', Users, [A, T]], ['/courses', 'Courses', BookOpen, [A, T]],
  ['/attendance', 'Attendance', CalendarCheck, [A, T]], ['/timetable', 'Timetable', CalendarDays, [A, T, S, P]], ['/assignments', 'Assignments', NotebookPen, [A, T, S, P]],
  ['/exams', 'Exams', ClipboardList, [A, T, S, P]], ['/fees', 'Fees', IndianRupee, [A, S, P]], ['/library', 'Library', LibraryIcon, [A, T, S, P]], ['/hall-tickets', 'Hall tickets', Ticket, [A, T, S, P]], ['/leave', 'Leave', CalendarClock, [A, T, S, P]], ['/messages', 'Messages', MessageSquare, [A, T, S, P]], ['/transport', 'Transport', Bus, [A, T, S, P]],
  ['/hostel', 'Hostel', BedDouble, [A, T, S, P]], ['/teachers', 'Teachers', GraduationCap, [A]], ['/users', 'Users', UserCog, [A]], ['/notices', 'Notices', Megaphone, [A, T, S, P]]]
const W = { students: [A], courses: [A], teachers: [A], fees: [A], results: [A, T], announcements: [A, T], assignments: [A, T], timetable: [A], books: [A], loans: [A], examschedule: [A], busroutes: [A], buspasses: [A], hostelrooms: [A], hostelstay: [A] }
const can = r => W[r].includes(me().role)
const isKid = () => ['student', 'parent'].includes(me().role)
const avg = (a, k) => (a.length ? Math.round(a.reduce((s, x) => s + x[k], 0) / a.length) : 0)
const tone = v => (v >= 85 ? 'good' : v >= 70 ? 'mid' : 'bad')
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
const errMsg = e => { const d = e?.response?.data; return (d && typeof d === 'object' ? Object.values(d).flat()[0] : null) || 'Something went wrong. Please try again.' }
const rise = i => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 } })

/* ---------- toast ---------- */
const bus = new EventTarget()
const toast = (msg, type = 'ok') => bus.dispatchEvent(new CustomEvent('t', { detail: { id: Math.random(), msg, type } }))
function Toasts() {
  const [list, setList] = useState([])
  useEffect(() => {
    const h = e => { const t = e.detail; setList(l => [...l, t]); setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), 3200) }
    bus.addEventListener('t', h); return () => bus.removeEventListener('t', h)
  }, [])
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {list.map(t => (
          <motion.div key={t.id} layout className={'toast ' + t.type} initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}>
            {t.type === 'err' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}{t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
const run = async (fn, ok) => { try { await fn(); ok && toast(ok); return true } catch (e) { console.error(e); toast(errMsg(e), 'err'); return false } }

/* ---------- small ui pieces ---------- */
function useRes(r) {
  const [d, setD] = useState([]), [ready, setReady] = useState(false)
  const load = () => api.list(r).then(x => { setD(x); setReady(true) }).catch(() => { setReady(true); toast('Could not load ' + r, 'err') })
  useEffect(() => { load() }, [])
  return [d, load, ready]
}
function Count({ to, suf = '' }) {
  const [n, setN] = useState(0)
  useEffect(() => { const c = animate(0, to, { duration: 1.1, ease: 'easeOut', onUpdate: v => setN(Math.round(v)) }); return () => c.stop() }, [to])
  return <>{n.toLocaleString('en-IN')}{suf}</>
}
function Avatar({ name = '?', size = 38 }) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return <span className="av" style={{ width: size, height: size, background: `hsl(${h} 62% 46%)` }}>{name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
}
const Skeleton = ({ rows = 5 }) => <div className="skwrap">{Array.from({ length: rows }, (_, i) => <div className="sk" key={i} />)}</div>
function ThemeToggle() {
  const [t, setT] = useState(document.documentElement.dataset.theme || 'light')
  const flip = () => { const n = t === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = n; localStorage.setItem('theme', n); setT(n) }
  return <button className="icon round" aria-label="Toggle dark mode" onClick={flip}>{t === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
}
const PageHead = ({ title, sub, children }) => (
  <div className="head"><div><h1>{title}</h1><p className="sub">{sub}</p></div><div className="row">{children}</div></div>
)

function Modal({ title, fields, init, onSave, onClose }) {
  const [v, setV] = useState(init), [busy, setBusy] = useState(false)
  const set = (k, x) => setV({ ...v, [k]: x })
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form className="sheet" onClick={e => e.stopPropagation()} initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0 }}
        onSubmit={async e => { e.preventDefault(); setBusy(true); try { if ((await onSave(v)) !== false) onClose() } finally { setBusy(false) } }}>
        <h2>{title}</h2>
        <div className="fields">
          {fields.map(f => (
            <label key={f.k}>{f.l}
              {f.options ? (
                <select required={!f.optional} value={v[f.k] ?? ''} onChange={e => set(f.k, e.target.value)}>
                  <option value="">Select</option>{f.options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              ) : <input required={!f.optional} type={f.t || 'text'} min={f.min} max={f.max} value={v[f.k] ?? ''} onChange={e => set(f.k, e.target.value)} />}
            </label>
          ))}
        </div>
        <div className="row end"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </motion.form>
    </motion.div>
  )
}

/* ---------- AI risk ---------- */
const lvl = l => ({ High: 'bad', Medium: 'mid', Low: 'good' }[l])
function useRisk() {
  const [r, setR] = useState([])
  useEffect(() => { api.risk().then(setR).catch(() => {}) }, [])
  return r
}
function RiskModal({ r, onClose }) {
  const [adv, setAdv] = useState(null), [busy, setBusy] = useState(false)
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  const ask = async () => { setBusy(true); try { setAdv(await api.advice(r.id)) } catch (e) { toast(errMsg(e), 'err') } finally { setBusy(false) } }
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet" onClick={e => e.stopPropagation()} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
        <div className="li"><span className="who2"><Avatar name={r.name} size={44} /><span><h2>{r.name}</h2><small>Risk score {r.score} / 100</small></span></span><em className={'chip ' + lvl(r.level)}>{r.level}</em></div>
        <div className="bar big"><motion.i initial={{ width: 0 }} animate={{ width: r.score + '%' }} transition={{ duration: 0.8 }} /></div>
        <h3>Why this score</h3>
        <ul className="reasons">{r.reasons.length ? r.reasons.map(x => <li key={x}><ShieldAlert size={16} />{x}</li>) : <li>No risk factors found. Student is on track.</li>}</ul>
        {adv && <div className="advice"><small>{adv.source === 'rules' ? 'Rule-based suggestion' : `Suggested by ${adv.source.charAt(0).toUpperCase() + adv.source.slice(1)} AI`}</small><p>{adv.suggestion}</p></div>}
        <div className="row end"><button className="ghost" onClick={onClose}>Close</button>
          <button className="btn" onClick={ask} disabled={busy}><Sparkles size={17} />{busy ? 'Thinking…' : 'Get suggestion'}</button></div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- shell ---------- */
function Shell({ children }) {
  const nav = useNavigate(), loc = useLocation(), { role, name } = me()
  const [acct, setAcct] = useState(null)
  const [mini, setMini] = useState(() => localStorage.getItem('mini') === '1')
  useEffect(() => localStorage.setItem('mini', mini ? '1' : '0'), [mini])
  return (
    <div className={'app' + (mini ? ' mini' : '')}>
      <aside className="side">
        <div className="brand"><img className="logo-img" src="/logo-transparent.png" alt="" /><span className="lbl">EduNexa</span></div>
        {NAV.filter(n => n[3].includes(role)).map(([to, l, I]) => (
          <NavLink key={to} to={to} end={to === '/'} className="nl" title={l}>
            {({ isActive }) => <>{isActive && <motion.i layoutId="pill" className="pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}<I size={20} /><span className="lbl">{l}</span></>}
          </NavLink>
        ))}
        <button className="nl collapse" onClick={() => setMini(!mini)} aria-label="Collapse sidebar">{mini ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}<span className="lbl">Collapse</span></button>
      </aside>
      <div className="col">
        <header className="top">
          <div><small>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</small><b>{greet()}, {name?.split(' ')[0]}</b></div>
          <div className="tools">
            <Notifications />
            <ThemeToggle />
            <button className="user" title="Account" onClick={() => (DEMO ? toast('Demo accounts have fixed passwords.') : setAcct({}))}><Avatar name={name} size={36} /><div className="who"><b>{name}</b><span>{role}</span></div></button>
            <button className="icon round" aria-label="Sign out" onClick={() => { auth.logout(); nav('/login') }}><LogOut size={19} /></button>
          </div>
        </header>
        <main className="main"><motion.div key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>{children}</motion.div></main>
      </div>
      <TourCard />
      <AnimatePresence>
        {acct && <Modal title="Change password" fields={[{ k: 'old_password', l: 'Current password', t: 'password' }, { k: 'new_password', l: 'New password (min 8 characters)', t: 'password' }]}
          init={acct} onSave={v => run(() => api.changePassword(v), 'Password changed')} onClose={() => setAcct(null)} />}
      </AnimatePresence>
    </div>
  )
}

/* ---------- dashboards ---------- */
const tip = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)' }

function StaffDashboard() {
  const [students] = useRes('students'), [courses] = useRes('courses'), [fees] = useRes('fees'), [notes] = useRes('announcements')
  const data = courses.map(c => ({ name: c.code, marks: avg(students.filter(s => s.course === c.id), 'marks') }))
  const paid = fees.filter(f => f.status === 'paid').reduce((t, f) => t + f.amount, 0)
  const pending = fees.filter(f => f.status === 'pending').reduce((t, f) => t + f.amount, 0)
  const risks = useRisk(), [pick, setPick] = useState(null)
  const atRisk = risks.filter(r => r.level !== 'Low').sort((x, y) => y.score - x.score).slice(0, 4), top = [...students].sort((a, b) => b.marks - a.marks).slice(0, 4)
  const stats = [['Students', students.length, '', Users], ['Courses', courses.length, '', BookOpen], ['Attendance', avg(students, 'attendance'), '%', CalendarCheck],
    ['Average marks', avg(students, 'marks'), '%', Award], ['Fees pending (₹)', pending, '', IndianRupee]]
  return (
    <>
      <motion.section className="heroban" {...rise(0)}>
        <div><h1>{greet()}, {me().name?.split(' ')[0]}</h1><p>Here is what is happening on campus today.</p>
          <div className="row"><Link className="btn sun" to="/attendance"><CalendarCheck size={18} />Mark attendance</Link>
            {can('students') && <Link className="btn glass" to="/students"><Users size={18} />Manage students</Link>}</div></div>
        <i className="orb o1" /><i className="orb o2" />
      </motion.section>
      <div className="stats">
        {stats.map(([l, v, s, I], i) => (
          <motion.div key={l} className="stat" whileHover={{ y: -4 }} {...rise(i + 1)}>
            <span className="sic"><I size={20} /></span><b><Count to={v} suf={s} /></b><span className="slbl">{l}</span>
          </motion.div>
        ))}
      </div>
      <div className="bento">
        <section className="card span2"><h3>Average marks by course</h3>
          <div className="chart"><ResponsiveContainer><BarChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={30} />
            <Tooltip cursor={{ fill: 'var(--line)', opacity: 0.4 }} contentStyle={tip} /><Bar dataKey="marks" fill="var(--bar)" radius={[10, 10, 0, 0]} />
          </BarChart></ResponsiveContainer></div></section>
        <section className="card"><h3>Fee collection</h3>
          <div className="chart donut"><ResponsiveContainer><PieChart>
            <Pie data={[{ name: 'Paid', value: paid }, { name: 'Pending', value: pending }]} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={4} stroke="none">
              <Cell fill="#10b981" /><Cell fill="#f59e0b" /></Pie><Tooltip contentStyle={tip} formatter={v => '₹' + v.toLocaleString('en-IN')} />
          </PieChart></ResponsiveContainer><div className="dmid"><b>{paid + pending ? Math.round(100 * paid / (paid + pending)) : 0}%</b><small>collected</small></div></div></section>
        <section className="card"><h3>Top performers</h3>
          {top.map(s => <div className="li" key={s.id}><span className="who2"><Avatar name={s.name} size={32} /><b>{s.name}</b></span><em className="chip good">{s.marks}%</em></div>)}</section>
        <section className="card"><h3>At-risk students</h3>
          {atRisk.map(r => (
            <button className="li linkrow" key={r.id} onClick={() => setPick(r)}>
              <span className="who2"><Avatar name={r.name} size={32} /><span><b>{r.name}</b><small>{r.reasons[0]}</small></span></span>
              <em className={'chip ' + lvl(r.level)}>{r.level} · {r.score}</em></button>
          ))}
          {!atRisk.length && <p className="sub">No at-risk students right now.</p>}</section>
        <section className="card"><h3>Latest notices</h3>
          {notes.map(n => <div className="li" key={n.id}><span><b>{n.title}</b><small>{n.date}</small></span></div>)}</section>
      </div>
      <AnimatePresence>{pick && <RiskModal r={pick} onClose={() => setPick(null)} />}</AnimatePresence>
    </>
  )
}

function StudentHome() {
  const [st] = useRes('students'), [res] = useRes('results'), [fees] = useRes('fees'), [notes] = useRes('announcements'), [courses] = useRes('courses')
  const s = st[0]
  if (!s) return <Skeleton rows={4} />
  const due = fees.filter(f => f.status === 'pending').reduce((t, f) => t + f.amount, 0)
  const stats = [['Attendance', s.attendance, '%', CalendarCheck], ['Average marks', res.length ? avg(res, 'score') : s.marks, '%', Award], ['Exams taken', res.length, '', ClipboardList], ['Fees due (₹)', due, '', IndianRupee]]
  return (
    <>
      <motion.section className="heroban" {...rise(0)}>
        <div><h1>{me().role === 'parent' ? `Parent view: ${s.name}` : `${greet()}, ${s.name.split(' ')[0]}`}</h1><p>{s.roll_no} · {courses.find(c => c.id === s.course)?.name} · Year {s.year}</p>
          <div className="row"><button className="btn sun" onClick={() => run(() => downloadReport(s), 'Report card downloaded')}><FileText size={18} />Download report card</button></div></div>
        <i className="orb o1" /><i className="orb o2" />
      </motion.section>
      <div className="stats">
        {stats.map(([l, v, x, I], i) => <motion.div key={l} className="stat" whileHover={{ y: -4 }} {...rise(i + 1)}><span className="sic"><I size={20} /></span><b><Count to={v} suf={x} /></b><span className="slbl">{l}</span></motion.div>)}
      </div>
      <div className="bento two">
        <section className="card"><h3>My results</h3>
          {res.map(r => <div className="li" key={r.id}><span><b>{r.subject}</b><small>{r.exam}</small></span><em className={'chip ' + tone(r.score)}>{r.score}%</em></div>)}
          {!res.length && <p className="sub">No results published yet.</p>}</section>
        <section className="card"><h3>Notices</h3>{notes.map(n => <div className="li" key={n.id}><span><b>{n.title}</b><small>{n.date}</small></span></div>)}</section>
      </div>
    </>
  )
}
const Dashboard = () => (isKid() ? <StudentHome /> : <StaffDashboard />)

/* ---------- students & courses ---------- */
function Students() {
  const w = can('students'), [rows, load, ready] = useRes('students'), [courses] = useRes('courses')
  const [q, setQ] = useState(''), [cf, setCf] = useState(''), [m, setM] = useState(null), [pick, setPick] = useState(null), risks = useRisk()
  const rk = id => risks.find(r => r.id === id)
  const cn = id => courses.find(c => c.id === id)?.name || '—'
  const list = rows.filter(s => (!cf || s.course === Number(cf)) && (s.name + s.roll_no + s.email).toLowerCase().includes(q.toLowerCase()))
  const fields = [{ k: 'name', l: 'Full name' }, { k: 'email', l: 'Email', t: 'email' }, { k: 'roll_no', l: 'Roll number' },
    { k: 'course', l: 'Course', options: courses.map(c => ({ v: c.id, t: c.name })) }, { k: 'year', l: 'Year', t: 'number', min: 1, max: 5 }, { k: 'marks', l: 'Marks %', t: 'number', min: 0, max: 100 }]
  const save = v => run(async () => { v.id ? await api.update('students', v.id, v) : await api.create('students', v); await load() }, v.id ? 'Student updated' : 'Student added')
  const del = s => confirm(`Delete ${s.name}?`) && run(async () => { await api.remove('students', s.id); await load() }, 'Student deleted')
  const xl = () => run(() => exportExcel('students', list.map(s => ({ Name: s.name, 'Roll no': s.roll_no, Email: s.email, Course: cn(s.course), Year: s.year, 'Attendance %': s.attendance, 'Marks %': s.marks }))), 'Excel file exported')
  return (
    <>
      <PageHead title="Students" sub={`${list.length} of ${rows.length} shown`}>
        <button className="ghost" onClick={xl}><Download size={17} />Export Excel</button>
        {w && <button className="btn" onClick={() => setM({ year: 1, attendance: 100, marks: 0 })}><Plus size={18} />Add student</button>}
      </PageHead>
      <div className="filters">
        <div className="search"><Search size={18} /><input placeholder="Search name, roll number or email" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select value={cf} onChange={e => setCf(e.target.value)} aria-label="Filter by course"><option value="">All courses</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      {!ready ? <Skeleton /> : (
        <table className="tbl">
          <thead><tr><th>Student</th><th>Roll no</th><th>Course</th><th>Year</th><th>Attendance</th><th>Marks</th><th>Risk</th><th /></tr></thead>
          <tbody>
            {list.map((s, i) => (
              <motion.tr key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <td data-label="Student"><span className="who2"><Avatar name={s.name} /><span><b>{s.name}</b><small>{s.email}</small></span></span></td>
                <td data-label="Roll no">{s.roll_no}</td><td data-label="Course">{cn(s.course)}</td><td data-label="Year">{s.year}</td>
                <td data-label="Attendance"><em className={'chip ' + tone(s.attendance)}>{s.attendance}%</em></td><td data-label="Marks">{s.marks}%</td>
                <td data-label="Risk">{rk(s.id) ? <button className={'chip riskbtn ' + lvl(rk(s.id).level)} onClick={() => setPick(rk(s.id))}>{rk(s.id).level}</button> : '—'}</td>
                <td className="act"><button className="icon" aria-label="Report card" title="Report card" onClick={() => run(() => downloadReport(s), 'Report card downloaded')}><FileText size={17} /></button>
                  {w && <><button className="icon" aria-label="Edit" onClick={() => setM(s)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => del(s)}><Trash2 size={17} /></button></>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
      {ready && !list.length && <p className="sub empty">No students match your filters.</p>}
      <AnimatePresence>{pick && <RiskModal r={pick} onClose={() => setPick(null)} />}</AnimatePresence>
      <AnimatePresence>{m && <Modal title={m.id ? 'Edit student' : 'Add student'} fields={fields} init={m} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}

function Courses() {
  const [rows, load, ready] = useRes('courses'), [students] = useRes('students'), [m, setM] = useState(null), w = can('courses')
  const fields = [{ k: 'name', l: 'Course name' }, { k: 'code', l: 'Code' }, { k: 'credits', l: 'Credits', t: 'number', min: 1, max: 10 }]
  const save = v => run(async () => { v.id ? await api.update('courses', v.id, v) : await api.create('courses', v); await load() }, v.id ? 'Course updated' : 'Course added')
  const del = c => confirm(`Delete ${c.name}?`) && run(async () => { await api.remove('courses', c.id); await load() }, 'Course deleted')
  return (
    <>
      <PageHead title="Courses" sub={`${rows.length} offered`}>{w && <button className="btn" onClick={() => setM({ credits: 3 })}><Plus size={18} />Add course</button>}</PageHead>
      {!ready ? <Skeleton rows={3} /> : (
        <div className="grid">
          {rows.map((c, i) => {
            const n = students.filter(s => s.course === c.id)
            return (
              <motion.div key={c.id} className="card course" whileHover={{ y: -5 }} {...rise(i)}>
                <small>{c.code} · {c.credits} credits</small><h3>{c.name}</h3>
                <p><b>{n.length}</b> students · avg marks <b>{avg(n, 'marks')}%</b></p>
                <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: avg(n, 'marks') + '%' }} transition={{ duration: 0.9, delay: 0.2 }} /></div>
                {w && <div className="row end"><button className="icon" aria-label="Edit" onClick={() => setM(c)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => del(c)}><Trash2 size={17} /></button></div>}
              </motion.div>
            )
          })}
        </div>
      )}
      <AnimatePresence>{m && <Modal title={m.id ? 'Edit course' : 'Add course'} fields={fields} init={m} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}

/* ---------- generic table pages ---------- */
function Crud({ res, title, noun, fields, cols, init, extra, xl }) {
  const [rows, load, ready] = useRes(res), [students] = useRes('students'), [m, setM] = useState(null), w = can(res)
  const sn = id => students.find(s => s.id === id)?.name || '—'
  const fl = fields.map(f => (f.opt ? { ...f, options: students.map(s => ({ v: s.id, t: s.name })) } : f))
  const save = v => run(async () => { v.id ? await api.update(res, v.id, v) : await api.create(res, v); await load() }, v.id ? `${noun} updated` : `${noun} added`)
  const del = r => confirm('Delete this record?') && run(async () => { await api.remove(res, r.id); await load() }, `${noun} deleted`)
  return (
    <>
      <PageHead title={title} sub={`${rows.length} records`}>
        {xl && <button className="ghost" onClick={() => run(() => exportExcel(res, rows.map(r => xl(r, sn))), 'Excel file exported')}><Download size={17} />Export Excel</button>}
        {w && <button className="btn" onClick={() => setM(init)}><Plus size={18} />Add {noun.toLowerCase()}</button>}
      </PageHead>
      {!ready ? <Skeleton /> : (
        <table className="tbl">
          <thead><tr>{cols.map(c => <th key={c.h}>{c.h}</th>)}<th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                {cols.map(c => <td key={c.h} data-label={c.h}>{c.f(r, sn)}</td>)}
                <td className="act">{extra?.(r)}{w && <><button className="icon" aria-label="Edit" onClick={() => setM(r)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => del(r)}><Trash2 size={17} /></button></>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
      {ready && !rows.length && <p className="sub empty">Nothing here yet.</p>}
      <AnimatePresence>{m && <Modal title={(m.id ? 'Edit ' : 'Add ') + noun.toLowerCase()} fields={fl} init={m} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}
const Teachers = () => (
  <Crud res="teachers" title="Teachers" noun="Teacher" init={{}} xl={r => ({ Name: r.name, Email: r.email, Subject: r.subject, Phone: r.phone })}
    fields={[{ k: 'name', l: 'Full name' }, { k: 'email', l: 'Email', t: 'email' }, { k: 'subject', l: 'Subject' }, { k: 'phone', l: 'Phone' }]}
    cols={[{ h: 'Name', f: r => <span className="who2"><Avatar name={r.name} /><span><b>{r.name}</b><small>{r.email}</small></span></span> }, { h: 'Subject', f: r => r.subject }, { h: 'Phone', f: r => r.phone }]} />
)
const Fees = () => (
  <Crud res="fees" title="Fees" noun="Fee" init={{ status: 'pending' }} xl={(r, sn) => ({ Student: sn(r.student), 'Amount (INR)': r.amount, 'Due date': r.due_date, Status: r.status })}
    fields={[{ k: 'student', l: 'Student', opt: 1 }, { k: 'amount', l: 'Amount (₹)', t: 'number', min: 0 }, { k: 'due_date', l: 'Due date', t: 'date' },
      { k: 'status', l: 'Status', options: [{ v: 'pending', t: 'Pending' }, { v: 'paid', t: 'Paid' }] }]}
    extra={r => r.status === 'paid' && <button className="icon" aria-label="Download receipt" title="Download receipt" onClick={() => run(() => downloadReceipt(r), 'Receipt downloaded')}><Receipt size={17} /></button>}
    cols={[{ h: 'Student', f: (r, sn) => <b>{sn(r.student)}</b> }, { h: 'Amount', f: r => '₹' + r.amount.toLocaleString('en-IN') }, { h: 'Due date', f: r => r.due_date },
      { h: 'Status', f: r => <em className={'chip ' + (r.status === 'paid' ? 'good' : 'mid')}>{r.status}</em> }]} />
)
const Exams = () => (
  <Crud res="results" title="Exam results" noun="Result" init={{ exam: 'Midterm' }} xl={(r, sn) => ({ Student: sn(r.student), Exam: r.exam, Subject: r.subject, 'Score %': r.score })}
    fields={[{ k: 'student', l: 'Student', opt: 1 }, { k: 'exam', l: 'Exam' }, { k: 'subject', l: 'Subject' }, { k: 'score', l: 'Score %', t: 'number', min: 0, max: 100 }]}
    cols={[{ h: 'Student', f: (r, sn) => <b>{sn(r.student)}</b> }, { h: 'Exam', f: r => r.exam }, { h: 'Subject', f: r => r.subject }, { h: 'Score', f: r => <em className={'chip ' + tone(r.score)}>{r.score}%</em> }]} />
)
const Notices = () => (
  <Crud res="announcements" title="Notices" noun="Notice" init={{}}
    fields={[{ k: 'title', l: 'Title' }, { k: 'date', l: 'Date', t: 'date' }, { k: 'body', l: 'Message' }]}
    cols={[{ h: 'Title', f: r => <b>{r.title}</b> }, { h: 'Date', f: r => r.date }, { h: 'Message', f: r => r.body }]} />
)

function Attendance() {
  const [students] = useRes('students'), [recs, load, ready] = useRes('attendance'), [d, setD] = useState(new Date().toISOString().slice(0, 10))
  const rec = id => recs.find(r => r.student === id && r.date === d)
  const put = async (s, present) => { const r = rec(s.id); r ? await api.update('attendance', r.id, { ...r, present }) : await api.create('attendance', { student: s.id, date: d, present }) }
  const mark = (s, p) => run(async () => { await put(s, p); await load() }, `${s.name.split(' ')[0]} marked ${p ? 'present' : 'absent'}`)
  const all = () => run(async () => { for (const s of students) if (rec(s.id)?.present !== true) await put(s, true); await load() }, 'Everyone marked present')
  const here = students.filter(s => rec(s.id)?.present).length, pct = students.length ? Math.round(100 * here / students.length) : 0
  return (
    <>
      <PageHead title="Attendance" sub="Mark daily attendance. Student percentages update automatically.">
        <label className="date">Date<input type="date" value={d} onChange={e => setD(e.target.value)} /></label>
        <button className="btn" onClick={all}><CheckCircle2 size={18} />Mark all present</button>
      </PageHead>
      <div className="card prog"><div><b>{here}</b> of {students.length} present</div><div className="bar"><motion.i animate={{ width: pct + '%' }} /></div><b>{pct}%</b></div>
      {!ready ? <Skeleton /> : (
        <div className="card">
          {students.map(s => {
            const r = rec(s.id)
            return (
              <div className="li att" key={s.id}>
                <span className="who2"><Avatar name={s.name} /><span><b>{s.name}</b><small>{s.roll_no} · overall {s.attendance}%</small></span></span>
                <div className="seg"><button className={r?.present === true ? 'on yes' : ''} onClick={() => mark(s, true)}>Present</button><button className={r?.present === false ? 'on no' : ''} onClick={() => mark(s, false)}>Absent</button></div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}


/* ---------- timetable ---------- */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const hue = s => [...s].reduce((t, c) => t + c.charCodeAt(0), 0) % 360
function Timetable() {
  const w = can('timetable'), kid = isKid(), [rows, load, ready] = useRes('timetable'), [courses] = useRes('courses'), [cf, setCf] = useState(''), [m, setM] = useState(null)
  useEffect(() => { if (!cf && courses.length) setCf(String(courses[0].id)) }, [courses])
  const list = rows.filter(r => kid || String(r.course) === cf)
  const fields = [{ k: 'course', l: 'Course', options: courses.map(c => ({ v: c.id, t: c.name })) }, { k: 'day', l: 'Day', options: DAYS.map((d, i) => ({ v: i, t: d })) },
    { k: 'start', l: 'Starts', t: 'time' }, { k: 'end', l: 'Ends', t: 'time' }, { k: 'subject', l: 'Subject' }, { k: 'teacher', l: 'Teacher' }, { k: 'room', l: 'Room' }]
  const save = v => run(async () => { v.id ? await api.update('timetable', v.id, v) : await api.create('timetable', v); await load() }, v.id ? 'Class updated' : 'Class added')
  const del = r => confirm('Delete this class?') && run(async () => { await api.remove('timetable', r.id); await load() }, 'Class deleted')
  return (
    <>
      <PageHead title="Timetable" sub={kid ? 'Your weekly class schedule' : 'Weekly schedule by course'}>
        {!kid && <select value={cf} onChange={e => setCf(e.target.value)} aria-label="Course">{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
        {w && <button className="btn" onClick={() => setM({ course: Number(cf) || '', day: 0 })}><Plus size={18} />Add class</button>}
      </PageHead>
      {!ready ? <Skeleton rows={3} /> : (
        <div className="week">
          {DAYS.map((d, i) => (
            <div className="day" key={d}><h3>{d}</h3>
              {list.filter(r => r.day === i).sort((x, y) => x.start.localeCompare(y.start)).map((r, k) => (
                <motion.div key={r.id} className="slot" style={{ '--h': hue(r.subject) }} whileHover={{ y: -3 }} {...rise(k)} onClick={() => w && setM(r)}>
                  <small>{r.start.slice(0, 5)} – {r.end.slice(0, 5)}</small><b>{r.subject}</b><small>{r.teacher}{r.room && ` · ${r.room}`}</small>
                  {w && <button className="icon" aria-label="Delete class" onClick={e => { e.stopPropagation(); del(r) }}><Trash2 size={15} /></button>}
                </motion.div>
              ))}
              {!list.some(r => r.day === i) && <p className="sub">No classes</p>}
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>{m && <Modal title={m.id ? 'Edit class' : 'Add class'} fields={fields} init={m} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}

/* ---------- assignments ---------- */
function GradeRow({ s, name, onSaved }) {
  const [g, setG] = useState(s.grade ?? ''), [f, setF] = useState(s.feedback || '')
  const save = () => run(async () => { await api.update('submissions', s.id, { ...s, grade: g, feedback: f }); await onSaved() }, 'Grade saved')
  return (
    <div className="grade">
      <div className="who2"><Avatar name={name} size={32} /><span><b>{name}</b><small>{s.answer}</small></span></div>
      <div className="row"><input type="number" min="0" max="100" placeholder="Grade /100" value={g} onChange={e => setG(e.target.value)} />
        <input placeholder="Feedback" value={f} onChange={e => setF(e.target.value)} /><button className="btn" onClick={save}>Save</button></div>
    </div>
  )
}
function Assignments() {
  const { role, student: sid } = me(), staff = role === A || role === T, canEdit = can('assignments'), today = new Date().toISOString().slice(0, 10)
  const [rows, load, ready] = useRes('assignments'), [subs, loadS] = useRes('submissions'), [students] = useRes('students'), [courses] = useRes('courses')
  const [m, setM] = useState(null), [view, setView] = useState(null), [sm, setSm] = useState(null)
  const cn = id => courses.find(c => c.id === id)?.name || '—'
  const mine = a => subs.find(s => s.assignment === a.id && s.student === sid)
  const status = a => { const s = mine(a); return s ? (s.grade != null ? ['good', `Graded ${s.grade}/100`] : ['mid', 'Submitted']) : a.due_date < today ? ['bad', 'Overdue'] : ['mid', 'Pending'] }
  const fields = [{ k: 'course', l: 'Course', options: courses.map(c => ({ v: c.id, t: c.name })) }, { k: 'title', l: 'Title' }, { k: 'description', l: 'Description' }, { k: 'due_date', l: 'Due date', t: 'date' }]
  const save = v => run(async () => { v.id ? await api.update('assignments', v.id, v) : await api.create('assignments', v); await load() }, v.id ? 'Assignment updated' : 'Assignment added')
  const del = a => confirm(`Delete ${a.title}?`) && run(async () => { await api.remove('assignments', a.id); await load() }, 'Assignment deleted')
  const submit = a => v => run(async () => { v.id ? await api.update('submissions', v.id, v) : await api.create('submissions', v); await loadS() }, 'Submitted successfully')
  return (
    <>
      <PageHead title="Assignments" sub={staff ? `${rows.length} assignments` : 'Your coursework and grades'}>
        {canEdit && <button className="btn" onClick={() => setM({})}><Plus size={18} />Add assignment</button>}
      </PageHead>
      {!ready ? <Skeleton rows={3} /> : (
        <div className="grid">
          {rows.map((a, i) => {
            const done = subs.filter(s => s.assignment === a.id).length, total = students.filter(s => s.course === a.course).length, st = status(a)
            return (
              <motion.div key={a.id} className="card course" whileHover={{ y: -5 }} {...rise(i)}>
                <small>{cn(a.course)} · due {a.due_date}</small><h3>{a.title}</h3><p className="sub">{a.description}</p>
                {staff ? (
                  <>
                    <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: (total ? 100 * done / total : 0) + '%' }} transition={{ duration: 0.8 }} /></div>
                    <small>{done} of {total} submitted</small>
                    <div className="row end"><button className="ghost" onClick={() => setView(a)}>Submissions</button>
                      {canEdit && <><button className="icon" aria-label="Edit" onClick={() => setM(a)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => del(a)}><Trash2 size={17} /></button></>}</div>
                  </>
                ) : (
                  <div className="row"><em className={'chip ' + st[0]}>{st[1]}</em>
                    {role === S && <button className="btn" onClick={() => setSm(a)}>{mine(a) ? 'Resubmit' : 'Submit'}</button>}</div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
      {ready && !rows.length && <p className="sub empty">No assignments yet.</p>}
      <AnimatePresence>
        {m && <Modal title={m.id ? 'Edit assignment' : 'Add assignment'} fields={fields} init={m} onSave={save} onClose={() => setM(null)} />}
        {sm && <Modal title={sm.title} fields={[{ k: 'answer', l: 'Your answer or link' }]} init={mine(sm) || { assignment: sm.id, student: sid }} onSave={submit(sm)} onClose={() => setSm(null)} />}
        {view && (
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView(null)}>
            <motion.div className="sheet" onClick={e => e.stopPropagation()} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
              <h2>{view.title}</h2><p className="sub">Grade submissions and leave feedback</p>
              {subs.filter(s => s.assignment === view.id).map(s => <GradeRow key={s.id} s={s} name={students.find(x => x.id === s.student)?.name || '—'} onSaved={loadS} />)}
              {!subs.some(s => s.assignment === view.id) && <p className="sub empty">No submissions yet.</p>}
              <div className="row end"><button className="ghost" onClick={() => setView(null)}>Close</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


/* ---------- notifications ---------- */
const ago = d => { const n = Math.round((Date.now() - new Date(d)) / 864e5); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 0 ? 'upcoming' : `${n} days ago` }
function Notifications() {
  const [list, setList] = useState([]), [open, setOpen] = useState(false)
  const load = () => api.notifications().then(setList).catch(() => {})
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])
  const unread = list.filter(n => !n.read).length
  const one = async n => { if (!n.read) { await api.readNotification(n.id); load() } }
  const all = async () => { await api.readAllNotifications(); load() }
  return (
    <div className="bellwrap">
      <button className="icon round" aria-label={`Notifications, ${unread} unread`} onClick={() => setOpen(!open)}>
        <BellIcon size={19} />{unread > 0 && <motion.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} key={unread}>{unread}</motion.span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="nback" onClick={() => setOpen(false)} />
            <motion.div className="notif" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}>
              <div className="nhead"><b>Notifications</b><button className="link" onClick={all} disabled={!unread}>Mark all read</button></div>
              <div className="nlist">
                {list.slice(0, 10).map(n => (
                  <button key={n.id} className={'nitem' + (n.read ? '' : ' unread')} onClick={() => one(n)}>
                    <i className="dot" /><span><b>{n.title}</b><small>{n.body}</small><small>{ago(n.created_at)}</small></span>
                  </button>
                ))}
                {!list.length && <p className="sub empty">You are all caught up.</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- library ---------- */
const addDays = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
function Library() {
  const w = can('books'), kid = isKid(), today = addDays(0)
  const [books, loadB, rb] = useRes('books'), [loans, loadL] = useRes('loans'), [students] = useRes('students')
  const [tab, setTab] = useState(kid ? 'loans' : 'catalog'), [q, setQ] = useState(''), [m, setM] = useState(null), [iss, setIss] = useState(null)
  const bn = id => books.find(b => b.id === id)?.title || '—', sn = id => students.find(s => s.id === id)?.name || '—'
  const shown = books.filter(b => (b.title + b.author).toLowerCase().includes(q.toLowerCase()))
  const reload = () => Promise.all([loadB(), loadL()])
  const status = l => (l.returned_on ? ['good', 'Returned'] : l.due_on < today ? ['bad', `Overdue · ₹${l.fine}`] : ['mid', 'On loan'])
  const saveBook = v => run(async () => { v.id ? await api.update('books', v.id, v) : await api.create('books', v); await reload() }, v.id ? 'Book updated' : 'Book added')
  const delBook = b => confirm(`Delete ${b.title}?`) && run(async () => { await api.remove('books', b.id); await reload() }, 'Book deleted')
  const issue = v => run(async () => { await api.create('loans', v); await reload() }, 'Book issued')
  const giveBack = l => run(async () => { await api.update('loans', l.id, { ...l, returned_on: today }); await reload() }, l.fine ? `Returned. Fine collected: ₹${l.fine}` : 'Book returned')
  return (
    <>
      <PageHead title="Library" sub={`${books.length} titles · ${loans.filter(l => !l.returned_on).length} on loan`}>
        <div className="seg">{[['catalog', 'Catalog'], ['loans', kid ? 'My books' : 'Loans']].map(([k, l]) => <button key={k} className={tab === k ? 'on pick' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        {w && <button className="btn" onClick={() => setM({ copies: 1 })}><Plus size={18} />Add book</button>}
      </PageHead>
      {tab === 'catalog' ? (
        <>
          <div className="filters"><div className="search"><Search size={18} /><input placeholder="Search title or author" value={q} onChange={e => setQ(e.target.value)} /></div></div>
          {!rb ? <Skeleton rows={3} /> : (
            <div className="grid">
              {shown.map((b, i) => (
                <motion.div key={b.id} className="card course" whileHover={{ y: -5 }} {...rise(i)}>
                  <small>{b.author}</small><h3>{b.title}</h3>
                  <div className="row"><em className={'chip ' + (b.available > 0 ? 'good' : 'bad')}>{b.available > 0 ? `${b.available} of ${b.copies} available` : 'Unavailable'}</em>
                    {w && <><button className="ghost" disabled={b.available < 1} onClick={() => setIss({ book: b.id, issued_on: today, due_on: addDays(14) })}>Issue</button>
                      <button className="icon" aria-label="Edit" onClick={() => setM(b)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => delBook(b)}><Trash2 size={17} /></button></>}</div>
                </motion.div>
              ))}
            </div>
          )}
          {rb && !shown.length && <p className="sub empty">No books match your search.</p>}
        </>
      ) : (
        <table className="tbl">
          <thead><tr><th>Book</th>{!kid && <th>Student</th>}<th>Issued</th><th>Due</th><th>Status</th><th /></tr></thead>
          <tbody>
            {loans.map((l, i) => (
              <motion.tr key={l.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <td data-label="Book"><b>{bn(l.book)}</b></td>{!kid && <td data-label="Student">{sn(l.student)}</td>}
                <td data-label="Issued">{l.issued_on}</td><td data-label="Due">{l.due_on}</td>
                <td data-label="Status"><em className={'chip ' + status(l)[0]}>{status(l)[1]}</em></td>
                <td className="act">{w && !l.returned_on && <button className="ghost" onClick={() => giveBack(l)}>Return</button>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'loans' && !loans.length && <p className="sub empty">No loans yet.</p>}
      <AnimatePresence>
        {m && <Modal title={m.id ? 'Edit book' : 'Add book'} fields={[{ k: 'title', l: 'Title' }, { k: 'author', l: 'Author' }, { k: 'copies', l: 'Copies', t: 'number', min: 1, max: 50 }]} init={m} onSave={saveBook} onClose={() => setM(null)} />}
        {iss && <Modal title={`Issue: ${bn(iss.book)}`} fields={[{ k: 'student', l: 'Student', options: students.map(s => ({ v: s.id, t: s.name })) }, { k: 'due_on', l: 'Due date', t: 'date' }]} init={iss} onSave={issue} onClose={() => setIss(null)} />}
      </AnimatePresence>
    </>
  )
}

/* ---------- hall tickets ---------- */
function HallTickets() {
  const kid = isKid(), w = can('examschedule')
  const [rows, load, ready] = useRes('examschedule'), [courses] = useRes('courses'), [students] = useRes('students'), [m, setM] = useState(null), [elig, setElig] = useState([])
  useEffect(() => { api.eligibility().then(setElig).catch(() => {}) }, [])
  const cn = id => courses.find(c => c.id === id)?.name || '—'
  const fields = [{ k: 'course', l: 'Course', options: courses.map(c => ({ v: c.id, t: c.name })) }, { k: 'exam', l: 'Exam' }, { k: 'subject', l: 'Subject' },
    { k: 'date', l: 'Date', t: 'date' }, { k: 'start', l: 'Starts', t: 'time' }, { k: 'end', l: 'Ends', t: 'time' }, { k: 'hall', l: 'Hall' }]
  const save = v => run(async () => { v.id ? await api.update('examschedule', v.id, v) : await api.create('examschedule', v); await load() }, v.id ? 'Exam updated' : 'Exam added')
  const del = r => confirm('Delete this exam?') && run(async () => { await api.remove('examschedule', r.id); await load() }, 'Exam deleted')
  const dl = e => run(() => downloadHallTicket(students.find(s => s.id === e.id) || e), 'Hall ticket downloaded')
  return (
    <>
      <PageHead title="Hall tickets" sub="Exam schedule and eligibility. Hall tickets need clear fees and 75% attendance.">
        {w && <button className="btn" onClick={() => setM({})}><Plus size={18} />Add exam</button>}
      </PageHead>
      {!ready ? <Skeleton rows={3} /> : (
        <table className="tbl">
          <thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Course</th><th>Hall</th><th /></tr></thead>
          <tbody>
            {[...rows].sort((x, y) => x.date.localeCompare(y.date)).map((r, i) => (
              <motion.tr key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <td data-label="Date"><b>{r.date}</b></td><td data-label="Time">{r.start.slice(0, 5)} – {r.end.slice(0, 5)}</td><td data-label="Subject">{r.subject}</td>
                <td data-label="Course">{cn(r.course)}</td><td data-label="Hall">{r.hall}</td>
                <td className="act">{w && <><button className="icon" aria-label="Edit" onClick={() => setM(r)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => del(r)}><Trash2 size={17} /></button></>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
      <h3 className="sechead">{kid ? 'My hall ticket' : 'Student eligibility'}</h3>
      <div className="grid">
        {elig.map((e, i) => (
          <motion.div key={e.id} className="card" whileHover={{ y: -4 }} {...rise(i)}>
            <div className="who2"><Avatar name={e.name} /><span><b>{e.name}</b><small>{e.eligible ? 'Ready to download' : e.reasons.join(' · ')}</small></span></div>
            <div className="row sp"><em className={'chip ' + (e.eligible ? 'good' : 'bad')}>{e.eligible ? 'Eligible' : 'Blocked'}</em>
              <button className="ghost" disabled={!e.eligible} onClick={() => dl(e)}><Ticket size={17} />Download</button></div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>{m && <Modal title={m.id ? 'Edit exam' : 'Add exam'} fields={fields} init={m} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}


/* ---------- leave requests ---------- */
const lstat = s => ({ pending: 'mid', approved: 'good', rejected: 'bad' }[s])
function Leave() {
  const staff = !isKid(), sid = me().student
  const [rows, load, ready] = useRes('leaves'), [students] = useRes('students'), [m, setM] = useState(null)
  const sn = id => students.find(s => s.id === id)?.name || '—'
  const fields = [{ k: 'from_date', l: 'From', t: 'date' }, { k: 'to_date', l: 'To', t: 'date' }, { k: 'reason', l: 'Reason' }]
  const save = v => run(async () => { v.id ? await api.update('leaves', v.id, v) : await api.create('leaves', { ...v, student: sid }); await load() }, v.id ? 'Request updated' : 'Leave request sent')
  const withdraw = l => confirm('Withdraw this request?') && run(async () => { await api.remove('leaves', l.id); await load() }, 'Request withdrawn')
  const decide = (l, status) => run(async () => { await api.update('leaves', l.id, { ...l, status, note: status === 'approved' ? 'Approved' : 'Not approved' }); await load() }, `Leave ${status}`)
  return (
    <>
      <PageHead title="Leave requests" sub={staff ? `${rows.filter(r => r.status === 'pending').length} waiting for a decision` : 'Request leave and track its status'}>
        {!staff && <button className="btn" onClick={() => setM({})}><Plus size={18} />Request leave</button>}
      </PageHead>
      {!ready ? <Skeleton /> : (
        <table className="tbl">
          <thead><tr>{staff && <th>Student</th>}<th>Dates</th><th>Reason</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((l, i) => (
              <motion.tr key={l.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                {staff && <td data-label="Student"><span className="who2"><Avatar name={sn(l.student)} size={32} /><b>{sn(l.student)}</b></span></td>}
                <td data-label="Dates">{l.from_date} → {l.to_date}</td><td data-label="Reason">{l.reason}</td>
                <td data-label="Status"><em className={'chip ' + lstat(l.status)}>{l.status}</em>{l.note && <small>{l.note}</small>}</td>
                <td className="act">
                  {staff && l.status === 'pending' && <><button className="icon ok" aria-label="Approve" title="Approve" onClick={() => decide(l, 'approved')}><Check size={18} /></button>
                    <button className="icon no" aria-label="Reject" title="Reject" onClick={() => decide(l, 'rejected')}><XCircle size={18} /></button></>}
                  {!staff && l.status === 'pending' && <><button className="icon" aria-label="Edit" onClick={() => setM(l)}><Pencil size={17} /></button><button className="icon" aria-label="Withdraw" onClick={() => withdraw(l)}><Trash2 size={17} /></button></>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
      {ready && !rows.length && <p className="sub empty">No leave requests.</p>}
      <AnimatePresence>{m && <Modal title={m.id ? 'Edit request' : 'Request leave'} fields={fields} init={m} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}

/* ---------- parent-teacher messages ---------- */
function Messages() {
  const { uid } = me(), mine = x => String(x) === String(uid), endRef = useRef(null)
  const [msgs, setMsgs] = useState([]), [contacts, setContacts] = useState([]), [sel, setSel] = useState(null), [text, setText] = useState('')
  const load = () => api.list('messages').then(setMsgs).catch(() => {})
  useEffect(() => { api.contacts().then(setContacts).catch(() => {}); load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])
  const other = x => (mine(x.sender) ? x.recipient : x.sender)
  const thread = sel == null ? [] : msgs.filter(x => String(other(x)) === String(sel))
  const lastOf = id => msgs.filter(x => String(other(x)) === String(id)).at(-1)
  const unread = id => msgs.filter(x => String(x.sender) === String(id) && !x.read).length
  const ordered = [...contacts].sort((x, y) => (lastOf(y.id)?.created_at || '').localeCompare(lastOf(x.id)?.created_at || ''))
  const person = contacts.find(c => String(c.id) === String(sel))
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.length, sel])
  const open = async id => { setSel(id); if (unread(id)) { await api.markRead(id); load() } }
  const send = async e => {
    e.preventDefault()
    if (!text.trim()) return
    if (await run(() => api.create('messages', { recipient: sel, body: text.trim() }))) { setText(''); load() }
  }
  return (
    <>
      <PageHead title="Messages" sub="Parents, students and teachers can talk here. Parents and students cannot message each other." />
      <div className={'chat card' + (sel != null ? ' open' : '')}>
        <div className="clist">
          {ordered.map(c => {
            const l = lastOf(c.id), n = unread(c.id)
            return (
              <button key={c.id} className={'citem' + (String(sel) === String(c.id) ? ' on' : '')} onClick={() => open(c.id)}>
                <Avatar name={c.name} /><span className="ctext"><b>{c.name}</b><small>{l ? l.body : c.role}</small></span>{n > 0 && <i className="cbadge">{n}</i>}
              </button>
            )
          })}
          {!contacts.length && <p className="sub empty">No contacts yet.</p>}
        </div>
        <div className="cthread">
          {sel == null ? <p className="sub empty">Select a conversation to start chatting.</p> : (
            <>
              <div className="cbar"><button className="icon back" aria-label="Back" onClick={() => setSel(null)}>←</button><Avatar name={person?.name} size={34} /><b>{person?.name}</b><em className="chip mid">{person?.role}</em></div>
              <div className="cmsgs">
                {thread.map(x => <motion.div key={x.id} className={'bub' + (mine(x.sender) ? ' me' : '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{x.body}<small>{new Date(x.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small></motion.div>)}
                {!thread.length && <p className="sub empty">No messages yet. Say hello.</p>}
                <div ref={endRef} />
              </div>
              <form className="csend" onSubmit={send}><input placeholder="Type a message" value={text} onChange={e => setText(e.target.value)} /><button className="btn" aria-label="Send"><Send size={18} /></button></form>
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ---------- transport ---------- */
function Transport() {
  const w = can('busroutes'), kid = isKid()
  const [routes, loadR, rr] = useRes('busroutes'), [passes, loadP] = useRes('buspasses'), [students] = useRes('students'), [m, setM] = useState(null), [pm, setPm] = useState(null)
  const sn = id => students.find(s => s.id === id)?.name || '—', rn = id => routes.find(r => r.id === id)?.name || '—'
  const mine = kid ? passes[0] : null, myRoute = mine && routes.find(r => r.id === mine.route)
  const reload = () => Promise.all([loadR(), loadP()])
  const routeFields = [{ k: 'name', l: 'Route name' }, { k: 'vehicle_no', l: 'Vehicle number' }, { k: 'driver', l: 'Driver' }, { k: 'driver_phone', l: 'Driver phone' },
    { k: 'morning_time', l: 'Morning pickup', t: 'time' }, { k: 'evening_time', l: 'Evening drop', t: 'time' }, { k: 'stops', l: 'Stops (comma separated)' }]
  const passFields = [{ k: 'student', l: 'Student', options: students.filter(s => !passes.some(p => p.student === s.id && p.id !== pm?.id)).map(s => ({ v: s.id, t: s.name })) },
    { k: 'route', l: 'Route', options: routes.map(r => ({ v: r.id, t: r.name })) }, { k: 'stop', l: 'Stop' }]
  const saveRoute = v => run(async () => { v.id ? await api.update('busroutes', v.id, v) : await api.create('busroutes', v); await reload() }, v.id ? 'Route updated' : 'Route added')
  const savePass = v => run(async () => { v.id ? await api.update('buspasses', v.id, v) : await api.create('buspasses', v); await reload() }, 'Bus pass saved')
  const delRoute = r => confirm(`Delete ${r.name}?`) && run(async () => { await api.remove('busroutes', r.id); await reload() }, 'Route deleted')
  const delPass = p => confirm('Remove this bus pass?') && run(async () => { await api.remove('buspasses', p.id); await reload() }, 'Bus pass removed')
  const stops = r => r.stops.split(',').map(x => x.trim()).filter(Boolean)
  return (
    <>
      <PageHead title="Transport" sub={kid ? 'Your college bus' : `${routes.length} routes · ${passes.length} students using the bus`}>
        {w && <><button className="ghost" onClick={() => setPm({})}><Plus size={17} />Assign student</button><button className="btn" onClick={() => setM({})}><Plus size={18} />Add route</button></>}
      </PageHead>
      {kid && (mine && myRoute ? (
        <motion.section className="heroban" {...rise(0)}>
          <div><h1>{myRoute.name}</h1><p>{myRoute.vehicle_no} · Driver {myRoute.driver} ({myRoute.driver_phone})</p>
            <div className="row"><span className="btn glass"><Bus size={17} />Pickup {myRoute.morning_time.slice(0, 5)}</span><span className="btn glass">Drop {myRoute.evening_time.slice(0, 5)}</span><span className="btn sun">Your stop: {mine.stop}</span></div></div>
          <i className="orb o1" /><i className="orb o2" />
        </motion.section>
      ) : <p className="sub empty">No bus pass assigned yet. Contact the transport office.</p>)}
      {!rr ? <Skeleton rows={3} /> : (
        <div className="grid">
          {routes.map((r, i) => (
            <motion.div key={r.id} className="card course" whileHover={{ y: -5 }} {...rise(i)}>
              <small>{r.vehicle_no} · {r.morning_time.slice(0, 5)} / {r.evening_time.slice(0, 5)}</small><h3>{r.name}</h3>
              <div className="stops">{stops(r).map(x => <span key={x} className={'stop' + (mine && mine.route === r.id && mine.stop === x ? ' me' : '')}>{x}</span>)}</div>
              <p className="sub">Driver {r.driver} · {r.driver_phone}</p>
              {w && <div className="row sp"><small>{passes.filter(p => p.route === r.id).length} students</small><span><button className="icon" aria-label="Edit" onClick={() => setM(r)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => delRoute(r)}><Trash2 size={17} /></button></span></div>}
            </motion.div>
          ))}
        </div>
      )}
      {w && (
        <>
          <h3 className="sechead">Bus passes</h3>
          <table className="tbl">
            <thead><tr><th>Student</th><th>Route</th><th>Stop</th><th /></tr></thead>
            <tbody>{passes.map(p => <tr key={p.id}><td data-label="Student"><b>{sn(p.student)}</b></td><td data-label="Route">{rn(p.route)}</td><td data-label="Stop">{p.stop}</td>
              <td className="act"><button className="icon" aria-label="Edit" onClick={() => setPm(p)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => delPass(p)}><Trash2 size={17} /></button></td></tr>)}</tbody>
          </table>
        </>
      )}
      <AnimatePresence>
        {m && <Modal title={m.id ? 'Edit route' : 'Add route'} fields={routeFields} init={m} onSave={saveRoute} onClose={() => setM(null)} />}
        {pm && <Modal title="Assign bus pass" fields={passFields} init={pm} onSave={savePass} onClose={() => setPm(null)} />}
      </AnimatePresence>
    </>
  )
}

/* ---------- hostel ---------- */
function Hostel() {
  const w = can('hostelrooms'), kid = isKid(), today = addDays(0)
  const [rooms, loadR, rr] = useRes('hostelrooms'), [stay, loadS] = useRes('hostelstay'), [students] = useRes('students'), [m, setM] = useState(null), [al, setAl] = useState(null)
  const sn = id => students.find(s => s.id === id)?.name || '—', reload = () => Promise.all([loadR(), loadS()])
  const mine = kid ? stay[0] : null, myRoom = mine && rooms.find(r => r.id === mine.room)
  const free = students.filter(s => !stay.some(a => a.student === s.id))
  const saveRoom = v => run(async () => { v.id ? await api.update('hostelrooms', v.id, v) : await api.create('hostelrooms', v); await reload() }, v.id ? 'Room updated' : 'Room added')
  const allocate = v => run(async () => { await api.create('hostelstay', v); await reload() }, 'Student allocated')
  const delRoom = r => confirm(`Delete room ${r.block}-${r.number}?`) && run(async () => { await api.remove('hostelrooms', r.id); await reload() }, 'Room deleted')
  const vacate = a => confirm(`Vacate ${sn(a.student)}?`) && run(async () => { await api.remove('hostelstay', a.id); await reload() }, 'Student vacated')
  return (
    <>
      <PageHead title="Hostel" sub={kid ? 'Your hostel room' : `${rooms.reduce((t, r) => t + r.occupied, 0)} of ${rooms.reduce((t, r) => t + r.capacity, 0)} beds occupied`}>
        {w && <button className="btn" onClick={() => setM({ capacity: 2 })}><Plus size={18} />Add room</button>}
      </PageHead>
      {kid && (mine && myRoom ? (
        <motion.section className="heroban" {...rise(0)}>
          <div><h1>Block {myRoom.block} · Room {myRoom.number}</h1><p>Sharing with up to {myRoom.capacity - 1} roommate{myRoom.capacity > 2 ? 's' : ''} · Joined {mine.joined_on}</p></div>
          <i className="orb o1" /><i className="orb o2" />
        </motion.section>
      ) : <p className="sub empty">No hostel room allocated.</p>)}
      {!kid && (!rr ? <Skeleton rows={3} /> : (
        <div className="grid">
          {rooms.map((r, i) => {
            const res = stay.filter(a => a.room === r.id), left = r.capacity - r.occupied
            return (
              <motion.div key={r.id} className="card course" whileHover={{ y: -5 }} {...rise(i)}>
                <small>Block {r.block}</small><h3>Room {r.number}</h3>
                <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: (100 * r.occupied / r.capacity) + '%' }} transition={{ duration: 0.8 }} /></div>
                <div className="row"><em className={'chip ' + (left ? 'good' : 'bad')}>{left ? `${left} bed${left > 1 ? 's' : ''} free` : 'Full'}</em><small>{r.occupied}/{r.capacity}</small></div>
                {res.map(a => <div className="li" key={a.id}><span className="who2"><Avatar name={sn(a.student)} size={28} /><b>{sn(a.student)}</b></span>
                  {w && <button className="icon" aria-label="Vacate" title="Vacate" onClick={() => vacate(a)}><XCircle size={17} /></button>}</div>)}
                {w && <div className="row end"><button className="ghost" disabled={!left || !free.length} onClick={() => setAl({ room: r.id, joined_on: today })}>Allocate</button>
                  <button className="icon" aria-label="Edit" onClick={() => setM(r)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => delRoom(r)}><Trash2 size={17} /></button></div>}
              </motion.div>
            )
          })}
        </div>
      ))}
      <AnimatePresence>
        {m && <Modal title={m.id ? 'Edit room' : 'Add room'} fields={[{ k: 'block', l: 'Block' }, { k: 'number', l: 'Room number' }, { k: 'capacity', l: 'Beds', t: 'number', min: 1, max: 8 }]} init={m} onSave={saveRoom} onClose={() => setM(null)} />}
        {al && <Modal title="Allocate student" fields={[{ k: 'student', l: 'Student', options: free.map(s => ({ v: s.id, t: s.name })) }, { k: 'joined_on', l: 'Joining date', t: 'date' }]} init={al} onSave={allocate} onClose={() => setAl(null)} />}
      </AnimatePresence>
    </>
  )
}


/* ---------- user accounts (admin only, there is no public sign-up) ---------- */
const rname = u => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username
function Accounts() {
  const [rows, load, ready] = useRes('users'), [students] = useRes('students'), [m, setM] = useState(null), edit = !!m?.id
  const sn = id => students.find(s => s.id === id)?.name
  const pending = rows.filter(u => u.is_active === false && u.email_verified !== false), active = rows.filter(u => u.is_active !== false)
  const fields = [{ k: 'username', l: 'Username' }, { k: 'first_name', l: 'First name', optional: true }, { k: 'last_name', l: 'Last name', optional: true },
    { k: 'email', l: 'Email', t: 'email', optional: true }, { k: 'mobile', l: 'Mobile number', optional: true },
    { k: 'password', l: edit ? 'New password (blank keeps current)' : 'Password (min 8 characters)', t: 'password', optional: edit },
    { k: 'role', l: 'Role', options: ['admin', 'teacher', 'student', 'parent'].map(r => ({ v: r, t: r[0].toUpperCase() + r.slice(1) })) },
    { k: 'student', l: 'Linked student (students and parents)', optional: true, options: students.map(s => ({ v: s.id, t: s.name })) }]
  const save = v => run(async () => {
    const { password, ...rest } = v
    const body = DEMO ? rest : v
    v.id ? await api.update('users', v.id, body) : await api.create('users', body); await load()
  }, v.id ? 'Account updated' : 'Account created')
  const approve = u => run(async () => { await api.approveUser(u.id); await load() }, 'Account approved')
  const reject = u => confirm(`Reject the request from ${rname(u)}?`) && run(async () => { await api.rejectUser(u.id); await load() }, 'Request rejected')
  const del = u => confirm(`Delete account "${u.username}"?`) && run(async () => { await api.remove('users', u.id); await load() }, 'Account deleted')
  return (
    <>
      <PageHead title="User accounts" sub="There is no public sign-up. Create accounts for teachers, students and parents here.">
        <button className="btn" onClick={() => setM({ role: 'teacher' })}><Plus size={18} />Add account</button>
      </PageHead>
      {pending.length > 0 && (
        <section className="card pend"><h3>Waiting for approval ({pending.length})</h3>
          {pending.map(u => (
            <div className="li" key={u.id}>
              <span className="who2"><Avatar name={rname(u)} /><span><b>{rname(u)}</b> <em className="chip mid">{u.role}</em><small>{u.email} · {u.mobile}{u.student ? ` · child/student: ${sn(u.student) || '#' + u.student}` : ''}</small></span></span>
              <span className="row"><button className="btn" onClick={() => approve(u)}><Check size={16} />Approve</button><button className="ghost" onClick={() => reject(u)}>Reject</button></span>
            </div>
          ))}
        </section>
      )}
      {!ready ? <Skeleton /> : (
        <table className="tbl">
          <thead><tr><th>Account</th><th>Contact</th><th>Role</th><th>Linked student</th><th /></tr></thead>
          <tbody>
            {active.map((u, i) => (
              <motion.tr key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <td data-label="Account"><span className="who2"><Avatar name={rname(u)} /><span><b>{rname(u)}</b><small>@{u.username}</small></span></span></td>
                <td data-label="Contact">{u.email || '—'}<small>{u.mobile}</small></td>
                <td data-label="Role"><em className="chip mid">{u.role}</em></td><td data-label="Linked student">{u.student ? sn(u.student) || `#${u.student}` : '—'}</td>
                <td className="act"><button className="icon" aria-label="Edit" onClick={() => setM(u)}><Pencil size={17} /></button><button className="icon" aria-label="Delete" onClick={() => del(u)}><Trash2 size={17} /></button></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
      <AnimatePresence>{m && <Modal title={edit ? 'Edit account' : 'Add account'} fields={fields} init={{ ...m, password: '' }} onSave={save} onClose={() => setM(null)} />}</AnimatePresence>
    </>
  )
}

/* ---------- login & routing ---------- */
const DEMOS = [['Admin', 'admin', 'admin123'], ['Teacher', 'teacher', 'teacher123'], ['Student', 'student', 'student123'], ['Parent', 'parent', 'parent123']]
function Login() {
  const showDemo = DEMO || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true'
  const nav = useNavigate(), [u, setU] = useState(''), [p, setP] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const go = async e => {
    e.preventDefault(); setBusy(true)
    try { await auth.login(u, p); nav('/') } catch (ex) { const d = ex?.response?.data?.detail; setErr(typeof d === 'string' && (d.includes('approval') || d.includes('verify your email')) ? d : 'Wrong email or password. Check them and try again.') } finally { setBusy(false) }
  }
  return (
    <div className="login">
      <div className="theme"><ThemeToggle /></div>
      <div className="hero-pane">
        <div className="brand"><img className="logo-img" src="/logo-transparent.png" alt="" /><span>EduNexa</span></div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>One Platform. Every Institution.</motion.h1>
        <p>Smart School &amp; College Management System</p>
        <ul className="pills"><li>Attendance</li><li>Marks</li><li>Fees</li><li>Report cards</li><li>Analytics</li></ul>
        <span className="float f1">Attendance 92%</span><span className="float f2">Receipt ready</span><span className="float f3">3 roles</span>
      </div>
      <form className="login-form" onSubmit={go}>
        <h2>Welcome back</h2>
        <p className="sub">{showDemo ? 'Demo mode: pick a role to fill its login.' : 'Sign in with the account your institution gave you.'}</p>
        {showDemo && <div className="seg roles">{DEMOS.map(([r, a, b]) => <button type="button" key={r} className={u === a ? 'on pick' : ''} onClick={() => { setU(a); setP(b) }}>{r}</button>)}</div>}
        <label>Email or username<input required autoComplete="username" placeholder="you@school.edu" value={u} onChange={e => setU(e.target.value)} /></label>
        <label>Password<input required type="password" value={p} onChange={e => setP(e.target.value)} /></label>
        {err && <p className="err">{err}</p>}
        {err.includes('verify your email') && <p className="sub"><Link to={`/register?verify=${encodeURIComponent(u)}`}>Enter your verification code</Link></p>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="sub center">New here? <Link to="/register">Create an account</Link> · <Link to="/tour">Recruiter preview</Link></p>
      </form>
    </div>
  )
}


/* ---------- register ---------- */
const ROLE_CARDS = [['student', 'Student', GraduationCap, 'Marks, fees and assignments'], ['parent', 'Parent', Users, "Your child's progress"],
  ['teacher', 'Teacher', BookOpen, 'Attendance and grading'], ['admin', 'Admin', ShieldCheck, 'Run the institution']]
const strength = p => (p.length >= 8) + (/[A-Z]/.test(p) && /[a-z]/.test(p)) + /\d/.test(p) + /[^A-Za-z0-9]/.test(p)
function Register() {
  const nav = useNavigate(), [params] = useSearchParams(), vemail = params.get('verify')
  const [step, setStep] = useState(vemail ? 'otp' : 'form'), [otp, setOtp] = useState(''), [cool, setCool] = useState(0)
  const [f, setF] = useState({ role: 'student', first_name: '', last_name: '', email: vemail || '', mobile: '', password: '', confirm: '', roll_no: '' })
  const [show, setShow] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false)
  const set = (k, v) => { setF({ ...f, [k]: v }); setErr('') }
  const kid = f.role === 'student' || f.role === 'parent', st = strength(f.password)
  const submit = async e => {
    e.preventDefault()
    if (f.mobile.length !== 10) return setErr('Enter a 10 digit mobile number.')
    if (f.password.length < 8) return setErr('Use at least 8 characters for the password.')
    if (f.password !== f.confirm) return setErr('The two passwords do not match.')
    setBusy(true)
    try {
      const res = await api.register({ role: f.role, first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim(), mobile: '+91' + f.mobile, password: f.password, roll_no: f.roll_no.trim() })
      if (res?.verify) { setStep('otp'); setCool(60) } else setDone(true)
    } catch (ex) { setErr(errMsg(ex)) } finally { setBusy(false) }
  }
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t) }, [cool])
  const verify = async e => {
    e.preventDefault()
    if (otp.length !== 6) return setErr('Enter the 6 digit code.')
    setBusy(true)
    try {
      const res = await api.verifyEmail({ email: f.email.trim(), otp })
      if (res?.demo) { toast('Demo account created. Welcome!'); nav('/') } else setDone(true)
    } catch (ex) { setErr(errMsg(ex)) } finally { setBusy(false) }
  }
  const resend = async () => { try { await api.resendOtp({ email: f.email.trim() }); toast('A new code is on its way'); setCool(60); setErr('') } catch (ex) { setErr(errMsg(ex)) } }
  return (
    <div className="login reg">
      <div className="theme"><ThemeToggle /></div>
      <div className="hero-pane">
        <div className="brand"><img className="logo-img" src="/logo-transparent.png" alt="" /><span>EduNexa</span></div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>Join your institution on EduNexa</motion.h1>
        <p>Smart School &amp; College Management System</p>
        <ul className="perks"><li><CheckCircle2 size={18} />One login for classes, fees, results and messages</li><li><CheckCircle2 size={18} />Parents follow their child's progress live</li><li><CheckCircle2 size={18} />Every new account is approved by an admin</li></ul>
        <span className="float f1">Hall ticket ready</span><span className="float f3">New message</span>
      </div>
      {done ? (
        <motion.div className="login-form done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle2 size={64} /><h2>Request sent</h2>
          <p className="sub">An admin will review your registration. You will be able to sign in with <b>{f.email}</b> once it is approved.</p>
          <Link className="btn" to="/login">Back to sign in</Link>
        </motion.div>
      ) : step === 'otp' ? (
        <form className="login-form otpform" onSubmit={verify}>
          <Mail size={52} className="otpicon" />
          <h2>Check your email</h2>
          <p className="sub">We sent a 6 digit code to <b>{f.email}</b>. It expires in 10 minutes.</p>
          {DEMO && <p className="warn"><ShieldCheck size={16} />Demo mode: no email is sent. Use the code 123456.</p>}
          <input className="otpinput" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······" autoFocus value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErr('') }} />
          {err && <p className="err">{err}</p>}
          <button className="btn" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify email'}</button>
          <p className="sub center">Did not get it? {cool > 0 ? `Resend in ${cool}s` : <button type="button" className="link" onClick={resend}>Resend code</button>}</p>
          <p className="sub center"><button type="button" className="link" onClick={() => { setStep('form'); setErr('') }}>Wrong email? Go back</button></p>
        </form>
      ) : (
        <form className="login-form regform" onSubmit={submit}>
          <h2>Create your account</h2>
          <p className="sub">{DEMO ? 'Demo mode: your account is created instantly in this browser.' : 'An admin approves every new account before you can sign in.'}</p>
          <div className="rolecards">
            {ROLE_CARDS.map(([r, l, I, d]) => (
              <button type="button" key={r} className={'rcard' + (f.role === r ? ' on' : '')} onClick={() => set('role', r)}>
                <I size={22} /><b>{l}</b><small>{d}</small>{f.role === r && <Check size={16} className="tick" />}
              </button>
            ))}
          </div>
          {f.role === 'admin' && <p className="warn"><ShieldCheck size={16} />Admin requests are checked carefully by an existing admin.</p>}
          <div className="two2"><label>First name<input required value={f.first_name} onChange={e => set('first_name', e.target.value)} /></label>
            <label>Last name<input value={f.last_name} onChange={e => set('last_name', e.target.value)} /></label></div>
          <label>Email<span className="ifield"><Mail size={17} /><input required type="email" autoComplete="email" placeholder="you@school.edu" value={f.email} onChange={e => set('email', e.target.value)} /></span></label>
          <label>Mobile number<span className="ifield"><Phone size={17} /><i className="pre">+91</i><input required inputMode="numeric" maxLength={10} placeholder="98400 12345" value={f.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} /></span></label>
          {kid && <label>{f.role === 'student' ? 'Your roll number' : "Your child's roll number"}<input required placeholder={DEMO ? 'In this demo try R2400' : 'For example R2400'} value={f.roll_no} onChange={e => set('roll_no', e.target.value)} /></label>}
          <label>Password<span className="ifield"><Lock size={17} /><input required type={show ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={e => set('password', e.target.value)} />
            <button type="button" className="icon eye" aria-label="Show or hide password" onClick={() => setShow(!show)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <div className="meter"><i className={'s' + st} style={{ width: st * 25 + '%' }} /></div><small>{['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][st]}</small>
          <label>Confirm password<input required type={show ? 'text' : 'password'} autoComplete="new-password" value={f.confirm} onChange={e => set('confirm', e.target.value)} /></label>
          {err && <p className="err">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : DEMO ? 'Create account' : 'Request account'}</button>
          <p className="sub center">Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      )}
    </div>
  )
}


/* ---------- recruiter preview ---------- */
const TOUR = [
  ['/', 'Dashboard', 'Live stats, a fee collection chart and an at-risk student list scored from attendance, marks, score trend and fees.'],
  ['/students', 'Students', 'Search and filter, risk badges, PDF report cards and Excel export. Click a Risk badge to see why.'],
  ['/attendance', 'Attendance', 'Mark daily attendance. Each student percentage recalculates automatically.'],
  ['/assignments', 'Assignments', 'Teachers grade submissions. A student can never grade their own work, the server enforces it.'],
  ['/fees', 'Fees', 'Paid fees give a PDF receipt. Pending fees also block hall tickets.'],
  ['/hall-tickets', 'Hall tickets', 'Hall tickets are blocked unless fees are clear and attendance is at least 75%.'],
  ['/messages', 'Messages', 'Parent-teacher chat. Parents and students cannot message each other.'],
  ['/users', 'Users', 'Admins approve self-registrations (after an email code) and manage roles.'],
]
function TourCard() {
  const nav = useNavigate()
  const [i, setI] = useState(() => Number(localStorage.getItem('tour') ?? -1))
  if (i < 0 || i >= TOUR.length) return null
  const go = n => {
    if (n < 0) return
    if (n >= TOUR.length) { localStorage.setItem('tour', '-1'); setI(-1); return nav('/tour') }
    localStorage.setItem('tour', String(n)); setI(n); nav(TOUR[n][0])
  }
  const end = () => { localStorage.setItem('tour', '-1'); setI(-1) }
  return (
    <motion.aside className="tourcard" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} key={i}>
      <small>Recruiter tour · step {i + 1} of {TOUR.length}</small>
      <h3>{TOUR[i][1]}</h3><p>{TOUR[i][2]}</p>
      <div className="dots">{TOUR.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}</div>
      <div className="row sp"><button className="link" onClick={end}>End tour</button>
        <span className="row"><button className="ghost" disabled={i === 0} onClick={() => go(i - 1)}>Back</button><button className="btn" onClick={() => go(i + 1)}>{i === TOUR.length - 1 ? 'Finish' : 'Next'}</button></span></div>
    </motion.aside>
  )
}
const FEATURES = [[Users, '4 roles, one platform', 'Admin, teacher, student and parent logins with permissions enforced on the server'],
  [ShieldCheck, 'Secure sign-up', 'Email OTP, admin approval, JWT with refresh tokens and rate limiting'], [Award, 'Live dashboards', 'Charts, fee collection and an explainable at-risk student score'],
  [CalendarCheck, 'Attendance that adds up', 'Daily marking recalculates every percentage automatically'], [FileText, 'PDF and Excel', 'Report cards, fee receipts, hall tickets and exports'],
  [Ticket, 'Rule-based hall tickets', 'Blocked until fees are clear and attendance is 75% or more'], [MessageSquare, 'Private messaging', 'Parent-teacher chat with privacy rules built in'],
  [BellIcon, 'Notifications and email', 'Signal-driven alerts plus emails for verification and approval'], [LibraryIcon, 'Library, hostel, transport', 'Availability, fines, room capacity and bus routes'],
  [Moon, 'Dark mode, responsive', 'Animated UI that works from phone to desktop']]
const TECH = ['React 18', 'Vite', 'Framer Motion', 'Recharts', 'Django REST Framework', 'PostgreSQL', 'JWT (SimpleJWT)', 'Swagger / OpenAPI', 'Docker', 'GitHub Actions', 'ReportLab PDFs', 'Transactional email API']
function TourPage() {
  const nav = useNavigate(), demoUrl = (import.meta.env.VITE_DEMO_URL || '').replace(/\/$/, ''), gh = import.meta.env.VITE_GITHUB_URL
  const docs = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') + '/api/docs/' : null
  const start = async () => { await auth.login('admin', 'x'); localStorage.setItem('tour', '0'); nav('/') }
  const asRole = async r => { await auth.login(r, 'x'); nav('/') }
  return (
    <div className="tourpage">
      <header className="tophead"><div className="brand"><img className="logo-img" src="/logo-transparent.png" alt="" /><span>EduNexa</span></div><div className="row"><ThemeToggle /><Link className="ghost" to="/login">Sign in</Link></div></header>
      <section className="heroban big">
        <div>
          <small className="eyebrow">Built for recruiters and reviewers</small>
          <h1>EduNexa: one platform for every school and college</h1>
          <p>A full-stack management system with admin, teacher, student and parent portals. Take the two minute tour or try each role yourself.</p>
          <div className="row">
            {DEMO ? <button className="btn sun" onClick={start}><Rocket size={18} />Start the guided tour</button>
              : demoUrl ? <a className="btn sun" href={demoUrl + '/tour'}><Rocket size={18} />Open the live demo tour</a> : <Link className="btn sun" to="/login">Sign in</Link>}
            {gh && <a className="btn glass" href={gh} target="_blank" rel="noreferrer"><ExternalLink size={17} />Source code</a>}
            {docs && <a className="btn glass" href={docs} target="_blank" rel="noreferrer"><ExternalLink size={17} />API docs</a>}
          </div>
        </div>
        <i className="orb o1" /><i className="orb o2" />
      </section>
      <div className="stats">{[['16+', 'modules'], ['4', 'user roles'], ['30+', 'automated API tests'], ['JWT', 'with refresh rotation']].map(([b, l], i) => <motion.div key={l} className="stat" {...rise(i)}><b>{b}</b><span className="slbl">{l}</span></motion.div>)}</div>
      {DEMO && <section className="card"><h3>Try it as</h3><div className="row">{[['admin', 'Admin'], ['teacher', 'Teacher'], ['student', 'Student'], ['parent', 'Parent']].map(([r, l]) => <button key={r} className="ghost" onClick={() => asRole(r)}>{l}</button>)}</div>
        <p className="sub">Demo mode: everything stays in your browser, nothing is shared with other visitors.</p></section>}
      <h3 className="sechead">What is inside</h3>
      <div className="grid">{FEATURES.map(([I, t, d], i) => <motion.div key={t} className="card course" whileHover={{ y: -4 }} {...rise(i % 6)}><span className="sic"><I size={20} /></span><h3>{t}</h3><p className="sub">{d}</p></motion.div>)}</div>
      <h3 className="sechead">Tech stack</h3>
      <div className="stops">{TECH.map(t => <span className="stop" key={t}>{t}</span>)}</div>
    </div>
  )
}

const PAGES = { '/': Dashboard, '/students': Students, '/courses': Courses, '/attendance': Attendance, '/timetable': Timetable, '/assignments': Assignments, '/leave': Leave, '/messages': Messages, '/transport': Transport, '/hostel': Hostel, '/library': Library, '/hall-tickets': HallTickets, '/exams': Exams, '/fees': Fees, '/teachers': Teachers, '/users': Accounts, '/notices': Notices }
const Guard = ({ to, children }) => {
  if (!auth.ok()) return <Navigate to="/login" />
  if (!NAV.find(n => n[0] === to)[3].includes(me().role)) return <Navigate to="/" />
  return <Shell>{children}</Shell>
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tour" element={<TourPage />} />
        {Object.entries(PAGES).map(([to, Page]) => <Route key={to} path={to} element={<Guard to={to}><Page /></Guard>} />)}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toasts />
    </BrowserRouter>
  )
}
