import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL
export const DEMO = !API_URL
const http = axios.create({ baseURL: API_URL })
http.interceptors.request.use(c => {
  const t = localStorage.getItem('vt')
  if (t && !DEMO) c.headers.Authorization = 'Bearer ' + t
  return c
})
let refreshing = null  // one refresh at a time; the refresh token rotates on every use
http.interceptors.response.use(r => r, async err => {
  const cfg = err.config
  if (DEMO || err.response?.status !== 401 || /\/(token|auth)\//.test(cfg?.url || '') || cfg?._retry || !localStorage.getItem('vf')) return Promise.reject(err)
  cfg._retry = true
  try {
    refreshing = refreshing || axios.post(`${API_URL}/token/refresh/`, { refresh: localStorage.getItem('vf') }).finally(() => { refreshing = null })
    const { data } = await refreshing
    localStorage.setItem('vt', data.access)
    if (data.refresh) localStorage.setItem('vf', data.refresh)
    cfg.headers.Authorization = 'Bearer ' + data.access
    return http(cfg)
  } catch {
    ['vt', 'vr', 'vn', 'vs', 'vu', 'vf'].forEach(k => localStorage.removeItem(k))
    window.location.href = '/login'
    return Promise.reject(err)
  }
})
const NUM = ['course', 'year', 'attendance', 'marks', 'credits', 'student', 'amount', 'score', 'day', 'assignment', 'grade', 'book', 'copies', 'route', 'room', 'capacity']
const clean = b => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, NUM.includes(k) ? (v === '' || v == null ? null : Number(v)) : v]))
const dayStr = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const seed = {
  courses: [
    { id: 1, name: 'B.Sc Mathematics', code: 'MAT101', credits: 4 },
    { id: 2, name: 'Computer Science', code: 'CSE201', credits: 4 },
    { id: 3, name: 'Physics', code: 'PHY110', credits: 3 },
  ],
  students: [
    ['Arun Kumar', 1, 3, 90, 81], ['Divya Lakshmi', 2, 2, 90, 90], ['Karthik Raja', 2, 1, 70, 64],
    ['Meena Sundar', 1, 2, 95, 77], ['Priya Nair', 3, 3, 55, 52], ['Suresh Babu', 3, 1, 85, 72],
    ['Nandhini R', 2, 3, 90, 94],
  ].map(([name, course, year, attendance, marks], i) => ({
    id: i + 1, name, course, year, attendance, marks,
    email: name.split(' ')[0].toLowerCase() + '@college.edu', roll_no: 'R' + (2400 + i),
  })),
  teachers: [
    { id: 1, name: 'Dr. Ravi Shankar', email: 'ravi@college.edu', subject: 'Mathematics', phone: '9840012345' },
    { id: 2, name: 'Prof. Anitha Menon', email: 'anitha@college.edu', subject: 'Computer Science', phone: '9840067890' },
    { id: 3, name: 'Dr. Vikram Iyer', email: 'vikram@college.edu', subject: 'Physics', phone: '9840055555' },
  ],
  fees: [1, 2, 3, 4, 5, 6, 7].map(i => ({ id: i, student: i, amount: 45000, due_date: `2026-11-${String(i + 4).padStart(2, '0')}`, status: i % 3 ? 'paid' : 'pending' })),
  results: [[1, 'Quiz', 'Mathematics', 76], [1, 'Midterm', 'Mathematics', 81], [2, 'Quiz', 'Algorithms', 85], [2, 'Midterm', 'Algorithms', 90],
    [3, 'Quiz', 'Data Structures', 74], [3, 'Midterm', 'Data Structures', 64], [4, 'Quiz', 'Calculus', 72], [4, 'Midterm', 'Calculus', 77],
    [5, 'Quiz', 'Optics', 68], [5, 'Midterm', 'Optics', 58], [7, 'Quiz', 'Databases', 89], [7, 'Midterm', 'Databases', 94]]
    .map(([student, exam, subject, score], i) => ({ id: i + 1, student, exam, subject, score })),
  announcements: [
    { id: 1, title: 'Semester exams begin 10 November', body: 'Hall tickets are available from the office.', date: '2026-10-24' },
    { id: 2, title: 'Fee payment deadline', body: 'Pay pending fees before 5 November to avoid a late charge.', date: '2026-10-20' },
  ],
  timetable: [1, 2, 3].flatMap(c => [[0, '09:00', '10:00'], [1, '10:00', '11:00'], [2, '09:00', '10:00'], [3, '11:00', '12:00'], [4, '10:00', '11:00']].map(([day, start, end], i) => ({
    id: c * 10 + i, course: c, day, start, end, subject: [['Calculus', 'Algebra', 'Statistics'], ['Algorithms', 'Databases', 'Web Dev'], ['Optics', 'Mechanics', 'Thermodynamics']][c - 1][i % 3],
    teacher: ['Dr. Ravi Shankar', 'Prof. Anitha Menon', 'Dr. Vikram Iyer'][c - 1], room: 'R-' + (101 + (c - 1) * 10 + i) }))),
  assignments: [
    { id: 1, course: 1, title: 'Calculus problem set 3', description: 'Solve questions 1-10 from chapter 4.', due_date: '2026-11-02' },
    { id: 2, course: 2, title: 'Build a REST API', description: 'Create a CRUD API with authentication.', due_date: '2026-11-10' },
    { id: 3, course: 3, title: 'Optics lab report', description: 'Write up the lens experiment.', due_date: '2026-10-20' },
  ],
  submissions: [
    { id: 1, assignment: 1, student: 1, answer: 'drive.example/calculus-set-3', grade: 88, feedback: 'Great work' },
    { id: 2, assignment: 2, student: 2, answer: 'github.com/divya/rest-api', grade: null, feedback: '' },
  ],
  books: [['Introduction to Algorithms', 'T. Cormen', 3], ['Clean Code', 'Robert C. Martin', 2], ['Calculus', 'James Stewart', 2], ['Fundamentals of Physics', 'Halliday & Resnick', 1],
    ['Python Crash Course', 'Eric Matthes', 2], ['Discrete Mathematics', 'Kenneth Rosen', 1]].map(([title, author, copies], i) => ({ id: i + 1, title, author, copies })),
  loans: [
    { id: 1, book: 1, student: 2, issued_on: dayStr(-16), due_on: dayStr(-2), returned_on: null },
    { id: 2, book: 3, student: 1, issued_on: dayStr(-6), due_on: dayStr(8), returned_on: null },
    { id: 3, book: 4, student: 5, issued_on: dayStr(-25), due_on: dayStr(-11), returned_on: null },
    { id: 4, book: 2, student: 3, issued_on: dayStr(-40), due_on: dayStr(-26), returned_on: dayStr(-27) },
  ],
  examschedule: [1, 2, 3].flatMap(c => [0, 1].map(k => ({ id: c * 10 + k, course: c, exam: 'Semester', subject: [['Calculus', 'Algebra'], ['Algorithms', 'Databases'], ['Optics', 'Mechanics']][c - 1][k],
    date: dayStr(15 + k * 2), start: '10:00', end: '13:00', hall: 'Hall ' + 'ABC'[c - 1] }))),
  leaves: [
    { id: 1, student: 1, from_date: dayStr(3), to_date: dayStr(4), reason: 'Family function', status: 'pending', note: '' },
    { id: 2, student: 2, from_date: dayStr(-5), to_date: dayStr(-4), reason: 'Fever', status: 'approved', note: 'Get well soon' },
    { id: 3, student: 3, from_date: dayStr(1), to_date: dayStr(1), reason: 'Medical appointment', status: 'pending', note: '' },
  ],
  busroutes: [
    { id: 1, name: 'Route A - Anna Nagar', vehicle_no: 'TN 09 AB 1234', driver: 'Murugan', driver_phone: '9840011111', morning_time: '07:30', evening_time: '17:00', stops: 'Anna Nagar, Koyambedu, Vadapalani, Campus' },
    { id: 2, name: 'Route B - Tambaram', vehicle_no: 'TN 11 CD 5678', driver: 'Selvam', driver_phone: '9840022222', morning_time: '07:15', evening_time: '17:15', stops: 'Tambaram, Chromepet, Guindy, Campus' },
  ],
  buspasses: [{ id: 1, student: 1, route: 1, stop: 'Koyambedu' }, { id: 2, student: 2, route: 2, stop: 'Chromepet' }, { id: 3, student: 3, route: 2, stop: 'Guindy' }],
  hostelrooms: [{ id: 1, block: 'A', number: '101', capacity: 2 }, { id: 2, block: 'A', number: '102', capacity: 3 }, { id: 3, block: 'B', number: '201', capacity: 2 }],
  hostelstay: [{ id: 1, student: 1, room: 1, joined_on: dayStr(-120) }, { id: 2, student: 3, room: 1, joined_on: dayStr(-120) }, { id: 3, student: 2, room: 3, joined_on: dayStr(-90) }],
  users: [
    { id: 1, username: 'admin', email: 'admin@edunexa.demo', mobile: '9840012345', first_name: 'Admin', last_name: '', role: 'admin', student: null, is_active: true },
    { id: 2, username: 'teacher', email: 'teacher@edunexa.demo', mobile: '9840012345', first_name: 'Anitha', last_name: 'Menon', role: 'teacher', student: null, is_active: true },
    { id: 3, username: 'student', email: 'student@edunexa.demo', mobile: '9840012345', first_name: 'Arun', last_name: 'Kumar', role: 'student', student: 1, is_active: true },
    { id: 4, username: 'parent', email: 'parent@edunexa.demo', mobile: '9840012345', first_name: 'Suresh', last_name: 'Kumar', role: 'parent', student: 1, is_active: true },
  ],
  messages: [
    { id: 1, sender: 'teacher', recipient: 'parent', sender_name: 'Prof. Anitha Menon', recipient_name: 'Suresh Kumar', body: 'Hello, Arun is doing well. Please make sure he submits the calculus assignment this week.', created_at: new Date(Date.now() - 5 * 36e5).toISOString(), read: false },
    { id: 2, sender: 'parent', recipient: 'teacher', sender_name: 'Suresh Kumar', recipient_name: 'Prof. Anitha Menon', body: 'Thank you, madam. I will remind him.', created_at: new Date(Date.now() - 4 * 36e5).toISOString(), read: true },
  ],
}
const NAMES = { admin: 'Admin', teacher: 'Prof. Anitha Menon', student: 'Arun Kumar', parent: 'Suresh Kumar' }
const dayAgo = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
seed.attendance = seed.students.flatMap(s => Array.from({ length: 20 }, (_, d) => ({ id: s.id * 100 + d, student: s.id, date: dayAgo(d), present: d < Math.round(s.attendance / 5) })))
// attendance % is derived from the daily records (mirrors the Django signal)
const recalc = (d, id) => {
  const rs = d.attendance.filter(x => x.student === id)
  if (rs.length) d.students = d.students.map(s => (s.id === id ? { ...s, attendance: Math.round(100 * rs.filter(x => x.present).length / rs.length) } : s))
}
const commit = (d, r, sid) => { if (r === 'attendance') recalc(d, sid); write(d) }
const read = () => ({ ...seed, ...JSON.parse(localStorage.getItem('vdb') || '{}') })
const write = d => localStorage.setItem('vdb', JSON.stringify(d))
export const me = () => ({ uid: localStorage.getItem('vu'), role: localStorage.getItem('vr'), name: localStorage.getItem('vn'), student: Number(localStorage.getItem('vs')) || null })
const keep = o => Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, v ?? ''))
export const auth = {
  ok: () => !!localStorage.getItem('vt'),
  logout: () => {
    const f = localStorage.getItem('vf')
    if (f && !DEMO) axios.post(`${API_URL}/auth/logout/`, { refresh: f }).catch(() => {})  // blacklist the refresh token on the server
    ;['vt', 'vr', 'vn', 'vs', 'vu', 'vf'].forEach(k => localStorage.removeItem(k))
  },
  async login(username, password) {
    if (DEMO) {
      const id = username.trim().toLowerCase(), d = read()
      const u = d.users.find(x => x.username.toLowerCase() === id || (x.email || '').toLowerCase() === id)
      const role = u?.role || (/teacher/i.test(id) ? 'teacher' : /student/i.test(id) ? 'student' : /parent/i.test(id) ? 'parent' : 'admin')
      const seeded = { admin: 'Admin', teacher: 'Prof. Anitha Menon', student: 'Arun Kumar', parent: 'Suresh Kumar' }
      const full = u && u.id > 4 ? `${u.first_name} ${u.last_name || ''}`.trim() : seeded[role]
      return keep({ vt: 'demo', vu: role, vr: role, vn: full, vs: role === 'student' || role === 'parent' ? (u?.student ?? 1) : '' })
    }
    const { data } = await http.post('/token/', { username, password })
    keep({ vt: data.access, vf: data.refresh, vu: data.uid, vr: data.role, vn: data.name, vs: data.student })
  },
}
let logoData = null
async function logo() {  // the EduNexa logo as a data URL, for the browser-made PDFs
  if (logoData !== null) return logoData
  try {
    const blob = await (await fetch('/logo.png')).blob()
    logoData = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })
  } catch { logoData = '' }
  return logoData
}
async function addBrand(doc) {
  const lg = await logo(), x = lg ? 44 : 20
  if (lg) doc.addImage(lg, 'PNG', 20, 11, 20, 20)
  doc.setFontSize(24); doc.setTextColor(30, 27, 75); doc.text('EduNexa', x, 23)
  doc.setFontSize(10); doc.setTextColor(110); doc.text('Smart School & College Management System', x, 30)
}
const grade = p => (p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F')
export async function downloadReport(s) {
  if (!DEMO) {
    const { data } = await http.get(`/students/${s.id}/report-card/`, { responseType: 'blob' })
    return saveBlob(data, `report-card-${s.roll_no}.pdf`)
  }
  const d = read(), { jsPDF } = await import('jspdf'), doc = new jsPDF()
  const res = d.results.filter(r => r.student === s.id)
  const score = res.length ? Math.round(res.reduce((t, r) => t + r.score, 0) / res.length) : s.marks
  const due = d.fees.filter(f => f.student === s.id && f.status === 'pending').reduce((t, f) => t + f.amount, 0)
  await addBrand(doc)
  doc.setFontSize(15); doc.setTextColor(0); doc.text('Progress Report Card', 20, 50)
  doc.setFontSize(11)
  doc.text(`Name: ${s.name}`, 20, 62); doc.text(`Roll no: ${s.roll_no}`, 120, 62)
  doc.text(`Course: ${d.courses.find(c => c.id === s.course)?.name || '-'}`, 20, 70); doc.text(`Year: ${s.year}`, 120, 70)
  doc.text(`Attendance: ${s.attendance}%`, 20, 78)
  doc.setFillColor(30, 27, 75); doc.rect(20, 90, 170, 8, 'F'); doc.setTextColor(255)
  ;['Exam', 'Subject', 'Score', 'Grade'].forEach((t, i) => doc.text(t, [22, 60, 130, 160][i], 96))
  doc.setTextColor(0)
  res.forEach((r, i) => [r.exam, r.subject, r.score + '%', grade(r.score)].forEach((t, j) => doc.text(String(t), [22, 60, 130, 160][j], 107 + i * 9)))
  const y = 115 + res.length * 9
  doc.setFontSize(13); doc.text(`Overall: ${score}%   Grade: ${grade(score)}`, 20, y)
  doc.setFontSize(11); doc.text(`Fees pending: Rs. ${due.toLocaleString('en-IN')}`, 20, y + 9)
  doc.save(`report-card-${s.roll_no}.pdf`)
}
// Explainable risk score (mirrors backend api/risk.py so the demo works without a server)
const clamp = x => Math.max(0, Math.min(1, x))
const FIX = { attendance: 'Talk to the student and parents about regular attendance.', marks: 'Arrange extra classes or peer tutoring for weak subjects.',
  trend: 'Review the latest exam paper with the student to find gaps.', fees: 'Ask the accounts office to discuss a payment plan.' }
const ruleAdvice = r => (r.factors.length ? 'Suggested actions: ' + r.factors.map((f, i) => `${i + 1}) ${FIX[f]}`).join(' ') : 'Student is on track. Keep encouraging.')
function scoreOf(s, results, fees) {
  const reasons = [], factors = []; let score = 0
  const add = (pts, f, text) => { if (pts > 0) { score += pts; factors.push(f); reasons.push(text) } }
  add(Math.round(35 * clamp((90 - s.attendance) / 30)), 'attendance', `Attendance is ${s.attendance}%`)
  add(Math.round(30 * clamp((70 - s.marks) / 25)), 'marks', `Average marks are ${s.marks}%`)
  const sc = results.filter(r => r.student === s.id).sort((a, b) => a.id - b.id).map(r => r.score)
  if (sc.length > 1 && sc.at(-2) > sc.at(-1)) { const drop = sc.at(-2) - sc.at(-1); add(Math.round(20 * clamp(drop / 20)), 'trend', `Score fell ${drop} points in the latest exam`) }
  const pending = fees.filter(f => f.student === s.id && f.status === 'pending').reduce((t, f) => t + f.amount, 0)
  add(pending ? 15 : 0, 'fees', `₹${pending.toLocaleString('en-IN')} fees pending`)
  score = Math.min(100, score)
  return { id: s.id, name: s.name, score, level: score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low', reasons, factors }
}
const loanFine = l => Math.max(0, Math.round((new Date(l.returned_on || dayStr(0)) - new Date(l.due_on)) / 864e5)) * 5
function eligOf(s, fees) {
  const reasons = [], pending = fees.filter(f => f.student === s.id && f.status === 'pending').reduce((t, f) => t + f.amount, 0)
  if (pending) reasons.push(`₹${pending.toLocaleString('en-IN')} fees pending`)
  if (s.attendance < 75) reasons.push(`Attendance is ${s.attendance}% (minimum 75%)`)
  return { id: s.id, name: s.name, eligible: !reasons.length, reasons }
}
const nread = () => JSON.parse(localStorage.getItem('nread') || '[]')
function demoNotifs() {  // in demo mode notifications are derived from the data, read state is kept in the browser
  const d = read(), m = me(), kid = m.role === 'student' || m.role === 'parent', out = []
  d.announcements.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).forEach(a => out.push({ id: 'n' + a.id, title: a.title, body: a.body, kind: 'notice', created_at: a.date }))
  if (kid) {
    const s = d.students.find(x => x.id === m.student), e = s && eligOf(s, d.fees)
    d.fees.filter(f => f.student === m.student && f.status === 'pending').forEach(f => out.push({ id: 'f' + f.id, title: `Fee of ₹${f.amount.toLocaleString('en-IN')} is due`, body: `Due on ${f.due_date}`, kind: 'fee', created_at: f.due_date }))
    d.assignments.filter(a => a.course === s?.course && !d.submissions.some(x => x.assignment === a.id && x.student === m.student)).forEach(a => out.push({ id: 'a' + a.id, title: `Assignment: ${a.title}`, body: `Due ${a.due_date}`, kind: 'assignment', created_at: a.due_date }))
    d.submissions.filter(x => x.student === m.student && x.grade != null).forEach(x => out.push({ id: 'g' + x.id, title: 'Assignment graded', body: `Score ${x.grade}/100. ${x.feedback || ''}`, kind: 'grade', created_at: dayStr(0) }))
    if (e && !e.eligible) out.push({ id: 'h1', title: 'Hall ticket blocked', body: e.reasons.join(' · '), kind: 'exam', created_at: dayStr(0) })
  } else {
    const high = d.students.filter(s => scoreOf(s, d.results, d.fees).level === 'High').length, ungraded = d.submissions.filter(x => x.grade == null).length, late = d.loans.filter(l => !l.returned_on && l.due_on < dayStr(0)).length
    if (high) out.push({ id: 'r1', title: `${high} student${high > 1 ? 's' : ''} at high risk`, body: 'Open the dashboard to review reasons.', kind: 'risk', created_at: dayStr(0) })
    if (ungraded) out.push({ id: 's1', title: `${ungraded} submission${ungraded > 1 ? 's' : ''} waiting for grading`, body: 'Open Assignments to grade.', kind: 'assignment', created_at: dayStr(0) })
    if (late) out.push({ id: 'l1', title: `${late} overdue library book${late > 1 ? 's' : ''}`, body: 'Fines apply at ₹5 per day.', kind: 'library', created_at: dayStr(0) })
  }
  const unreadMsgs = d.messages.filter(x => x.recipient === m.uid && !x.read)
  if (unreadMsgs.length) out.push({ id: 'm' + unreadMsgs.at(-1).id, title: `${unreadMsgs.length} new message${unreadMsgs.length > 1 ? 's' : ''}`, body: unreadMsgs.at(-1).body.slice(0, 80), kind: 'message', created_at: dayStr(0) })
  if (kid) d.leaves.filter(l => l.student === m.student && l.status !== 'pending').forEach(l => out.push({ id: 'lv' + l.id, title: `Leave ${l.status}`, body: `${l.from_date} to ${l.to_date}. ${l.note}`, kind: 'leave', created_at: l.from_date }))
  else { const pend = d.leaves.filter(l => l.status === 'pending').length; if (pend) out.push({ id: 'lp' + pend, title: `${pend} leave request${pend > 1 ? 's' : ''} waiting`, body: 'Open Leave to approve or reject.', kind: 'leave', created_at: dayStr(0) }) }
  const seen = nread()
  return out.map(n => ({ ...n, read: seen.includes(n.id) }))
}
export async function downloadHallTicket(s) {
  if (!DEMO) {
    const { data } = await http.get(`/students/${s.id}/hall-ticket/`, { responseType: 'blob' })
    return saveBlob(data, `hall-ticket-${s.roll_no}.pdf`)
  }
  const d = read(), { jsPDF } = await import('jspdf'), doc = new jsPDF(), exams = d.examschedule.filter(e => e.course === s.course).sort((a, b) => a.date.localeCompare(b.date))
  await addBrand(doc)
  doc.setFontSize(15); doc.setTextColor(0); doc.text('Examination Hall Ticket', 20, 50)
  doc.setFontSize(11); doc.text(`Name: ${s.name}`, 20, 62); doc.text(`Roll no: ${s.roll_no}`, 120, 62)
  doc.text(`Course: ${d.courses.find(c => c.id === s.course)?.name || '-'}`, 20, 70); doc.text(`Year: ${s.year}`, 120, 70)
  doc.setFillColor(30, 27, 75); doc.rect(20, 82, 170, 8, 'F'); doc.setTextColor(255)
  ;['Date', 'Time', 'Subject', 'Hall'].forEach((t, i) => doc.text(t, [22, 60, 100, 160][i], 88)); doc.setTextColor(0)
  exams.forEach((e, i) => [e.date, `${e.start} - ${e.end}`, e.subject, e.hall].forEach((t, j) => doc.text(String(t), [22, 60, 100, 160][j], 99 + i * 9)))
  doc.setFontSize(10); doc.text('Carry this hall ticket and your college ID card. Reach the hall 20 minutes early.', 20, 120 + exams.length * 9)
  doc.save(`hall-ticket-${s.roll_no}.pdf`)
}
export const api = {
  async register(b) {
    if (!DEMO) return (await http.post('/auth/register/', b)).data
    const d = read(), email = b.email.trim().toLowerCase()
    if (d.users.some(u => (u.email || '').toLowerCase() === email || u.username.toLowerCase() === email)) throw { response: { data: { email: ['An account with this email already exists.'] } } }
    let student = null
    if (b.role === 'student' || b.role === 'parent') {
      const s = d.students.find(x => x.roll_no.toLowerCase() === (b.roll_no || '').trim().toLowerCase())
      if (!s) throw { response: { data: { roll_no: ['No student found with this roll number. In this demo try R2400.'] } } }
      student = s.id
    }
    sessionStorage.setItem('pendingReg', JSON.stringify({ ...b, student }))  // the demo "email" step asks for the code 123456
    return { verify: true, demo: true, email: b.email }
  },
  async verifyEmail({ email, otp }) {
    if (!DEMO) return (await http.post('/auth/verify-email/', { email, otp })).data
    if (otp !== '123456') throw { response: { data: { detail: 'Wrong code. In this demo the code is 123456.' } } }
    const b = JSON.parse(sessionStorage.getItem('pendingReg') || 'null'), d = read()
    if (!b) throw { response: { data: { detail: 'Please fill in the registration form again.' } } }
    const u = { id: Date.now(), username: b.email.trim().toLowerCase(), email: b.email.trim().toLowerCase(), mobile: b.mobile, first_name: b.first_name, last_name: b.last_name || '', role: b.role, student: b.student, is_active: true }
    d.users = [...d.users, u]; write(d); sessionStorage.removeItem('pendingReg')
    keep({ vt: 'demo', vu: u.role, vr: u.role, vn: `${u.first_name} ${u.last_name}`.trim(), vs: u.student ?? '' })
    return { demo: true }
  },
  async resendOtp({ email }) {
    if (!DEMO) return (await http.post('/auth/resend-otp/', { email })).data
    return { detail: 'A new code has been sent.' }
  },
  async approveUser(id) {
    if (DEMO) { const d = read(); d.users = d.users.map(u => (u.id === id ? { ...u, is_active: true } : u)); return write(d) }
    await http.post(`/users/${id}/approve/`)
  },
  async rejectUser(id) {
    if (DEMO) { const d = read(); d.users = d.users.filter(u => u.id !== id); return write(d) }
    await http.post(`/users/${id}/reject/`)
  },
  async changePassword(b) {
    if (DEMO) throw { response: { data: { detail: ['Demo accounts cannot change passwords.'] } } }
    await http.post('/auth/change-password/', b)
  },
  async eligibility() {
    if (!DEMO) return (await http.get('/students/eligibility/')).data
    const d = read(), list = await this.list('students'); return list.map(s => eligOf(s, d.fees))
  },
  async contacts() {
    if (!DEMO) return (await http.get('/messages/contacts/')).data
    const staff = ['admin', 'teacher'], m = me()
    return Object.keys(NAMES).filter(k => k !== m.uid && (staff.includes(m.role) || staff.includes(k))).map(k => ({ id: k, name: NAMES[k], role: k }))
  },
  async markRead(id) {
    if (!DEMO) return http.post('/messages/mark-read/', { with: id })
    const d = read(), m = me(); d.messages = d.messages.map(x => (x.sender === id && x.recipient === m.uid ? { ...x, read: true } : x)); write(d)
  },
  async notifications() { return DEMO ? demoNotifs() : (await http.get('/notifications/')).data },
  async readNotification(id) { DEMO ? localStorage.setItem('nread', JSON.stringify([...nread(), id])) : await http.post(`/notifications/${id}/read/`) },
  async readAllNotifications() { DEMO ? localStorage.setItem('nread', JSON.stringify(demoNotifs().map(n => n.id))) : await http.post('/notifications/read-all/') },
  async risk() {
    if (!DEMO) return (await http.get('/students/risk/')).data
    const d = read(); return d.students.map(s => scoreOf(s, d.results, d.fees))
  },
  async advice(id) {
    if (!DEMO) return (await http.get(`/students/${id}/advice/`)).data
    const d = read(), r = scoreOf(d.students.find(x => x.id === id), d.results, d.fees)
    return { suggestion: ruleAdvice(r), source: 'rules', risk: r }
  },
  async list(r) {
    if (!DEMO) return (await http.get(`/${r}/`)).data
    let d = read()[r]; const m = me(), all = read()
    if (r === 'books') d = d.map(b => ({ ...b, available: b.copies - all.loans.filter(l => l.book === b.id && !l.returned_on).length }))
    if (r === 'loans') d = d.map(l => ({ ...l, fine: loanFine(l) }))
    if (r === 'hostelrooms') d = d.map(x => ({ ...x, occupied: all.hostelstay.filter(h => h.room === x.id).length }))
    if (r === 'messages') return d.filter(x => x.sender === m.uid || x.recipient === m.uid).sort((a, b) => a.created_at.localeCompare(b.created_at))
    if (m.role === 'student' || m.role === 'parent') {  // parents see only their child, read-only
      const course = read().students.find(x => x.id === m.student)?.course
      if (r === 'students') d = d.filter(x => x.id === m.student)
      else if (['fees', 'results', 'attendance', 'submissions', 'loans', 'leaves', 'buspasses', 'hostelstay'].includes(r)) d = d.filter(x => x.student === m.student)
      else if (['timetable', 'assignments', 'examschedule'].includes(r)) d = d.filter(x => x.course === course)
    }
    return d
  },
  async create(r, b) {
    b = clean(b); if (!DEMO) return http.post(`/${r}/`, b)
    const d = read()
    if (r === 'loans') {
      const bk = d.books.find(x => x.id === b.book)
      if (bk.copies - d.loans.filter(l => l.book === bk.id && !l.returned_on).length <= 0) throw { response: { data: { detail: ['No copies of this book are available.'] } } }
    }
    const m = me(), kid = m.role === 'student' || m.role === 'parent'
    if (r === 'hostelstay' && d.hostelstay.filter(h => h.room === b.room).length >= d.hostelrooms.find(x => x.id === b.room).capacity) throw { response: { data: { detail: ['This room is already full.'] } } }
    let rec = { ...b, id: Date.now() }
    if (r === 'leaves' && kid) rec = { ...rec, student: m.student, status: 'pending', note: '' }
    if (r === 'messages') rec = { ...rec, sender: m.uid, sender_name: NAMES[m.uid], recipient_name: NAMES[b.recipient], created_at: new Date().toISOString(), read: false }
    d[r] = [...d[r], rec]; commit(d, r, b.student)
  },
  async update(r, id, b) {
    b = clean(b); if (!DEMO) return http.put(`/${r}/${id}/`, b)
    const d = read(); d[r] = d[r].map(x => (x.id === id ? { ...x, ...b } : x)); commit(d, r, b.student)
  },
  async remove(r, id) {
    if (!DEMO) return http.delete(`/${r}/${id}/`)
    const d = read(), sid = d[r].find(x => x.id === id)?.student; d[r] = d[r].filter(x => x.id !== id); commit(d, r, sid)
  },
}

const saveBlob = (blob, name) => {  // the link must be attached to the page for every browser to start the download
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.style.display = 'none'
  document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
}
export async function downloadReceipt(f) {
  const no = 'EDU-' + String(f.id).padStart(5, '0')
  if (!DEMO) {
    const { data } = await http.get(`/fees/${f.id}/receipt/`, { responseType: 'blob' })
    return saveBlob(data, `receipt-${no}.pdf`)
  }
  const d = read(), s = d.students.find(x => x.id === f.student), { jsPDF } = await import('jspdf'), doc = new jsPDF()
  await addBrand(doc)
  doc.setFontSize(15); doc.setTextColor(0); doc.text('Fee Receipt', 20, 50)
  doc.setFontSize(12)
  ;[['Receipt no', no], ['Student', s?.name], ['Roll no', s?.roll_no], ['Course', d.courses.find(c => c.id === s?.course)?.name || '-'],
    ['Due date', f.due_date], ['Amount paid', 'Rs. ' + f.amount.toLocaleString('en-IN')], ['Status', 'PAID']]
    .forEach(([k, v], i) => { doc.setTextColor(110); doc.text(k, 20, 66 + i * 11); doc.setTextColor(0); doc.text(String(v), 75, 66 + i * 11) })
  doc.setFontSize(9); doc.setTextColor(120); doc.text('This is a computer-generated receipt and needs no signature.', 20, 66 + 8 * 11)
  doc.save(`receipt-${no}.pdf`)
}
export async function exportExcel(name, rows) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const keys = Object.keys(rows[0] || {})
  const sheet = keys.length ? [keys.map(k => ({ value: k, fontWeight: 'bold' })), ...rows.map(r => keys.map(k => r[k] ?? null))] : [['No data']]
  await writeExcelFile(sheet, { sheet: name.slice(0, 31) }).toFile(`edunexa-${name}.xlsx`)
}
