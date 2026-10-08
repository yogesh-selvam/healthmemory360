import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth, AuthRequest } from './middleware/auth';
import { User, MedicalRecord, HealthMetric, Medication, Condition, Appointment, FitnessRecord, NutritionRecord, MentalWellnessRecord, DoctorBrief, Reminder, HealthAlert, Notification, EmergencyProfile, EmergencyEvent, HealthSpherePost, HealthSphereComment, HealthSphereFollow } from './models';
import { ask, extractDocument, doctorBrief } from './services/ai';
import { generatePatientAlerts, parseFollowUpFromRecord } from './services/healthAlerts';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = new Set([
  CLIENT_URL,
  'https://healthmemory360.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);
const isAllowedVercelOrigin = (origin: string) => /^https:\/\/healthmemory360(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin);

let mongoConnectPromise: Promise<typeof mongoose> | null = null;

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI is not set; database-backed routes will be unavailable until configured.');
    return null;
  }

  if (mongoose.connection.readyState === 1) return mongoose;

  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
    }).then(() => mongoose);
  }

  try {
    return await mongoConnectPromise;
  } catch (error) {
    mongoConnectPromise = null;
    throw error;
  }
}

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isAllowedVercelOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '4mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 180 }));

const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(null, /^(application\/pdf|image\/(png|jpeg|jpg))$/.test(f.mimetype)),
});

const sign = (id: string) => jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
const cleanEmail = (email: string) => String(email || '').trim().toLowerCase();
const uid = (req: AuthRequest) => req.userId!;

app.get('/api/health', (_q, r) => r.json({ ok: true, service: 'HealthMemory 360', aiProvider: process.env.AI_PROVIDER || 'mock' }));

// Demo-safe endpoint used by the exact Stitch UI. It does not diagnose or prescribe.
app.post('/api/demo/assistant', (req, r) => {
  const q = String(req.body?.question || '').toLowerCase();
  let answer = 'I can help you navigate your stored health memory. For the hackathon demo, ask about your last blood test, follow-up, records, timeline, reminders, or what changed.';
  if (q.includes('blood test')) answer = 'Your latest demo Blood Test is dated 12 Aug 2026. It includes glucose 108 mg/dL, cholesterol 212 mg/dL and hemoglobin 12.4 g/dL. Source: Blood Test — Demo Health Center.';
  else if (q.includes('checkup') || q.includes('follow')) answer = 'A stored Blood Test contains a follow-up interval of 3 months. That gives an expected follow-up around 12 Nov 2026 in the demo dataset; this is a record-derived estimate, not a confirmed appointment.';
  else if (q.includes('change')) answer = 'Compared with the earlier demo Blood Test, glucose moved from 118 to 108 mg/dL and cholesterol moved from 230 to 212 mg/dL. These are record comparisons, not a diagnosis.';
  else if (q.includes('reminder')) answer = 'Your demo reminder is tied to the follow-up workflow. You can review Smart Reminders for the source record and expected date.';
  r.json({ answer, grounded: true, sources: ['Blood Test — 12 Aug 2026','Previous Blood Test — 12 Jun 2026','Health Timeline'] });
});

app.post('/api/auth/register', async (req, r) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || password.length < 8) return r.status(400).json({ message: 'Name, email and 8+ character password required' });
    const normalized = cleanEmail(email);
    if (await User.findOne({ email: normalized })) return r.status(409).json({ message: 'Email already registered' });
    const u = await User.create({ name: String(name).trim(), email: normalized, passwordHash: await bcrypt.hash(password, 12) });
    r.status(201).json({ token: sign(u.id), user: { id: u.id, name: u.name, email: u.email } });
  } catch { r.status(500).json({ message: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req, r) => {
  try {
    const { email, password } = req.body || {};
    const u = await User.findOne({ email: cleanEmail(email) });
    if (!u || !(await bcrypt.compare(password || '', u.passwordHash))) return r.status(401).json({ message: 'Invalid email or password' });
    r.json({ token: sign(u.id), user: { id: u.id, name: u.name, email: u.email } });
  } catch { r.status(500).json({ message: 'Login failed' }); }
});

app.get('/api/auth/me', auth, async (req: AuthRequest, r) => {
  const u = await User.findById(uid(req)).select('-passwordHash');
  u ? r.json(u) : r.status(404).json({ message: 'User not found' });
});

app.get('/api/dashboard', auth, async (req: AuthRequest, r) => {
  try {
    const id = uid(req);
    const [metrics, fitness, nutrition, wellness, records, meds, conditions, appointments] = await Promise.all([
      HealthMetric.find({ userId: id }).sort({ recordedAt: -1 }).limit(50).lean(),
      FitnessRecord.find({ userId: id }).sort({ recordedAt: -1 }).limit(14).lean(),
      NutritionRecord.find({ userId: id }).sort({ recordedAt: -1 }).limit(14).lean(),
      MentalWellnessRecord.find({ userId: id }).sort({ recordedAt: -1 }).limit(14).lean(),
      MedicalRecord.find({ userId: id }).sort({ recordDate: -1 }).limit(10).lean(),
      Medication.find({ userId: id, status: { $ne: 'inactive' } }).sort({ startDate: -1 }).limit(20).lean(),
      Condition.find({ userId: id, status: { $ne: 'inactive' } }).sort({ diagnosedDate: -1 }).limit(20).lean(),
      Appointment.find({ userId: id }).sort({ appointmentDate: 1 }).limit(10).lean(),
    ]);
    const latestBy = (type: string) => metrics.find(m => String(m.metricType || '').toLowerCase() === type.toLowerCase());
    const latestFitness = fitness[0];
    const latestNutrition = nutrition[0];
    const latestWellness = wellness[0];
    const healthOverviewScore = Math.max(0, Math.min(100, Math.round(
      50 + (latestFitness ? Math.min(15, (latestFitness.steps || 0) / 700) : 0) +
      (latestNutrition ? Math.min(10, (latestNutrition.water || 0) * 4) : 0) +
      (latestWellness?.mood === 'Great' || latestWellness?.mood === 'Good' ? 10 : 5) +
      Math.min(15, records.length * 2)
    )));
    r.json({ metrics, fitness, nutrition, wellness, records, meds, conditions, appointments, healthOverviewScore, latest: { weight: latestBy('Weight'), bloodPressure: latestBy('Blood Pressure'), glucose: latestBy('Glucose'), spo2: latestBy('SpO2'), fitness: latestFitness, nutrition: latestNutrition, wellness: latestWellness } });
  } catch { r.status(500).json({ message: 'Could not load dashboard' }); }
});

app.get('/api/records', auth, async (req: AuthRequest, r) => r.json(await MedicalRecord.find({ userId: uid(req) }).sort({ recordDate: -1 }).lean()));
app.post('/api/records', auth, async (req: AuthRequest, r) => r.status(201).json(await MedicalRecord.create({ ...req.body, userId: uid(req) })));
app.get('/api/records/:id', auth, async (req: AuthRequest, r) => {
  const x = await MedicalRecord.findOne({ _id: req.params.id, userId: uid(req) }).lean();
  x ? r.json(x) : r.status(404).json({ message: 'Record not found' });
});
app.delete('/api/records/:id', auth, async (req: AuthRequest, r) => { await MedicalRecord.deleteOne({ _id: req.params.id, userId: uid(req) }); r.json({ ok: true }); });

app.post('/api/records/upload', auth, upload.single('file'), async (req: AuthRequest, r) => {
  if (!req.file) return r.status(400).json({ message: 'Valid PDF/JPG/PNG file required' });
  try {
    const extracted = await extractDocument(req.file.path, req.file.mimetype, req.file.originalname, req.body?.title || '');
    const recordDate = extracted.recordDate ? new Date(extracted.recordDate) : new Date();
    const rec = await MedicalRecord.create({
      userId: uid(req),
      title: extracted.title || req.body?.title || req.file.originalname,
      recordType: extracted.recordType || 'Report',
      recordDate,
      hospital: extracted.hospital || undefined,
      doctor: extracted.doctor || undefined,
      fileUrl: `/uploads/${req.file.filename}`,
      extractedText: req.body?.text || '',
      summary: extracted.summary || 'Document uploaded and structured for review.',
      extractedData: { ...extracted, sourceFile: req.file.originalname, extractedAt: new Date().toISOString() },
    });
    for (const m of extracted.medications || []) {
      if (m?.name) await Medication.create({ userId: uid(req), name: m.name, dosage: m.dosage, frequency: m.frequency, startDate: recordDate, status: 'active' });
    }
    for (const c of extracted.conditions || []) {
      if (c?.name) await Condition.create({ userId: uid(req), name: c.name, diagnosedDate: recordDate, status: c.status || 'recorded', notes: 'Extracted from uploaded record; review for accuracy.' });
    }
    r.status(201).json({ record: rec, extraction: extracted, aiEnabled: ['gemini', 'openai'].includes(String(process.env.AI_PROVIDER).toLowerCase()) && Boolean(process.env.AI_API_KEY) });
  } catch (e: any) {
    r.status(500).json({ message: e?.message || 'Upload processing failed' });
  }
});

app.get('/api/timeline', auth, async (req: AuthRequest, r) => {
  const id = uid(req);
  const [records, meds, fitness, nutrition, wellness, appointments, reminders, alerts] = await Promise.all([
    MedicalRecord.find({ userId: id }).sort({ recordDate: -1 }).lean(),
    Medication.find({ userId: id }).sort({ startDate: -1 }).lean(),
    FitnessRecord.find({ userId: id }).sort({ recordedAt: -1 }).lean(),
    NutritionRecord.find({ userId: id }).sort({ recordedAt: -1 }).lean(),
    MentalWellnessRecord.find({ userId: id }).sort({ recordedAt: -1 }).lean(),
    Appointment.find({ userId: id }).sort({ appointmentDate: -1 }).lean(),
    Reminder.find({ userId: id, status: { $ne: 'dismissed' } }).sort({ reminderDate: -1 }).lean(),
    HealthAlert.find({ userId: id }).sort({ createdAt: -1 }).lean(),
  ]);
  const events = [
    ...records.map(x => ({ date: x.recordDate, type: 'Medical', title: x.title, description: x.summary, source: 'Medical Record', id: String(x._id) })),
    ...meds.map(x => ({ date: x.startDate, type: 'Medication', title: x.name, description: `${x.dosage || ''} ${x.frequency || ''}`.trim(), source: 'Medication', id: String(x._id) })),
    ...fitness.filter(x => x.recordedAt).map(x => ({ date: x.recordedAt, type: 'Fitness', title: 'Fitness activity', description: `${x.steps || 0} steps • ${x.exerciseMinutes || 0} min`, source: 'Fitness', id: String(x._id) })),
    ...nutrition.filter(x => x.recordedAt).map(x => ({ date: x.recordedAt, type: 'Nutrition', title: 'Nutrition entry', description: `${x.calories || 0} kcal • ${x.water || 0} L water`, source: 'Nutrition', id: String(x._id) })),
    ...wellness.filter(x => x.recordedAt).map(x => ({ date: x.recordedAt, type: 'Wellness', title: `Mood: ${x.mood || 'Check-in'}`, description: `Stress: ${x.stress || 'not recorded'}`, source: 'Mental Wellness', id: String(x._id) })),
    ...appointments.filter(x => x.appointmentDate).map(x => ({ date: x.appointmentDate, type: 'Appointment', title: `Appointment with ${x.doctor || 'provider'}`, description: x.reason || 'Scheduled visit', source: 'Appointment', id: String(x._id) })),
    ...reminders.filter(x => x.followUpDate || x.reminderDate).map(x => ({ date: x.followUpDate || x.reminderDate, type: 'Follow-up', title: x.title, description: x.note || 'Follow-up reminder', source: x.source || 'Reminder', id: String(x._id) })),
    ...alerts.filter(x => x.followUpDate || x.sourceRecordDate).map(x => ({ date: x.followUpDate || x.sourceRecordDate, type: 'Alert', title: x.title, description: x.message || 'Health alert', source: 'Health Alert', id: String(x._id) })),
  ].sort((a, b) => +new Date(b.date as any) - +new Date(a.date as any));
  r.json(events);
});

function crud(pathName: string, model: any) {
  app.get('/api/' + pathName, auth, async (req: AuthRequest, r) => r.json(await model.find({ userId: uid(req) }).sort({ recordedAt: -1, createdAt: -1 }).lean()));
  app.post('/api/' + pathName, auth, async (req: AuthRequest, r) => r.status(201).json(await model.create({ ...req.body, userId: uid(req) })));
}
crud('fitness', FitnessRecord);
crud('nutrition', NutritionRecord);
crud('mental-wellness', MentalWellnessRecord);
crud('physical-health', HealthMetric);
crud('medications', Medication);
crud('conditions', Condition);
crud('appointments', Appointment);

// -------------------- Reminders & patient alerts --------------------
function patientAge(dateOfBirth?: string | Date) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age--;
  return age;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

app.get('/api/reminders', auth, async (req: AuthRequest, r) => {
  const reminders = await Reminder.find({ userId: uid(req), status: { $ne: 'dismissed' } }).sort({ reminderDate: 1 }).lean();
  r.json(reminders);
});

app.post('/api/reminders', auth, async (req: AuthRequest, r) => {
  const title = String(req.body?.title || '').trim();
  const reminderDate = new Date(req.body?.reminderDate);
  if (!title || Number.isNaN(reminderDate.getTime())) return r.status(400).json({ message: 'Title and valid reminder date are required' });
  const reminder = await Reminder.create({
    userId: uid(req),
    title,
    note: String(req.body?.note || '').trim(),
    reminderDate,
    recurrence: ['none','monthly','quarterly','half-yearly','yearly'].includes(req.body?.recurrence) ? req.body.recurrence : 'none',
    source: String(req.body?.source || 'user'),
    sourceRecordId: req.body?.sourceRecordId ? req.body.sourceRecordId : undefined,
    sourceRecordTitle: req.body?.sourceRecordTitle || undefined,
    sourceRecordDate: req.body?.sourceRecordDate ? new Date(req.body.sourceRecordDate) : undefined,
    followUpDate: req.body?.followUpDate ? new Date(req.body.followUpDate) : undefined,
    followUpType: req.body?.followUpType || 'manual',
    leadTimeDays: Number(req.body?.leadTimeDays || 7),
    status: 'pending',
  });
  await Notification.create({
    userId: uid(req),
    type: 'reminder',
    title: 'Smart reminder created',
    message: `${title} is scheduled for ${new Date(reminder.reminderDate).toLocaleDateString()}.`,
    actionUrl: '/app/reminders',
    metadata: { reminderId: String(reminder._id), sourceRecordId: reminder.sourceRecordId ? String(reminder.sourceRecordId) : null },
  });
  r.status(201).json(reminder);
});

app.patch('/api/reminders/:id', auth, async (req: AuthRequest, r) => {
  const reminder = await Reminder.findOne({ _id: req.params.id, userId: uid(req) });
  if (!reminder) return r.status(404).json({ message: 'Reminder not found' });
  if (req.body?.status) reminder.status = req.body.status;
  if (req.body?.reminderDate) reminder.reminderDate = new Date(req.body.reminderDate);
  if (req.body?.title) reminder.title = String(req.body.title);
  if (req.body?.note != null) reminder.note = String(req.body.note);
  if (req.body?.followUpDate) reminder.followUpDate = new Date(req.body.followUpDate);
  if (req.body?.followUpType) reminder.followUpType = req.body.followUpType;
  if (req.body?.leadTimeDays) reminder.leadTimeDays = Number(req.body.leadTimeDays);
  await reminder.save();
  r.json(reminder);
});

app.delete('/api/reminders/:id', auth, async (req: AuthRequest, r) => {
  await Reminder.deleteOne({ _id: req.params.id, userId: uid(req) });
  r.json({ ok: true });
});

app.get('/api/alerts', auth, async (req: AuthRequest, r) => {
  const id = uid(req);
  await generatePatientAlerts(id);
  const [user, alerts, latestRecord, previousRecord] = await Promise.all([
    User.findById(id).select('name dateOfBirth bloodGroup').lean(),
    HealthAlert.find({ userId: id }).sort({ createdAt: -1 }).lean(),
    MedicalRecord.findOne({ userId: id }).sort({ recordDate: -1 }).lean(),
    MedicalRecord.find({ userId: id }).sort({ recordDate: -1 }).skip(1).limit(1).lean(),
  ]);
  const safeAlerts = alerts.map((alert: any) => ({
    ...alert,
    type: alert.alertType || alert.type || 'alert',
    date: alert.followUpDate || alert.sourceRecordDate || alert.createdAt,
    patient: { name: alert.patientName || user?.name || 'Patient', age: alert.patientAge ?? patientAge(user?.dateOfBirth) },
  }));
  r.json({
    patient: { name: user?.name || 'Patient', age: patientAge(user?.dateOfBirth), bloodGroup: user?.bloodGroup || 'Not recorded' },
    previous: previousRecord[0] ? { title: previousRecord[0].title, date: previousRecord[0].recordDate, summary: previousRecord[0].summary } : null,
    latest: latestRecord ? { title: latestRecord.title, date: latestRecord.recordDate, summary: latestRecord.summary } : null,
    activeConditions: await Condition.find({ userId: id, status: { $ne: 'inactive' } }).sort({ diagnosedDate: -1 }).limit(10).lean(),
    activeMedications: await Medication.find({ userId: id, status: { $ne: 'inactive' } }).sort({ startDate: -1 }).limit(10).lean(),
    alerts: safeAlerts,
  });
});

app.get('/api/alerts/:id', auth, async (req: AuthRequest, r) => {
  const alert = await HealthAlert.findOne({ _id: req.params.id, userId: uid(req) }).lean();
  if (!alert) return r.status(404).json({ message: 'Alert not found' });
  r.json(alert);
});

app.patch('/api/alerts/:id/read', auth, async (req: AuthRequest, r) => {
  const alert = await HealthAlert.findOneAndUpdate({ _id: req.params.id, userId: uid(req) }, { read: true }, { new: true }).lean();
  if (!alert) return r.status(404).json({ message: 'Alert not found' });
  r.json(alert);
});

app.post('/api/alerts/generate', auth, async (req: AuthRequest, r) => {
  const alerts = await generatePatientAlerts(uid(req));
  r.status(201).json({ alerts });
});

app.post('/api/reports/compare', auth, async (req: AuthRequest, r) => {
  const [a, b] = await Promise.all([
    MedicalRecord.findOne({ _id: req.body.previous, userId: uid(req) }).lean(),
    MedicalRecord.findOne({ _id: req.body.latest, userId: uid(req) }).lean(),
  ]);
  if (!a || !b) return r.status(404).json({ message: 'Select two valid records' });
  const av: any[] = Array.isArray((a.extractedData as any)?.values) ? (a.extractedData as any).values : [];
  const bv: any[] = Array.isArray((b.extractedData as any)?.values) ? (b.extractedData as any).values : [];
  const map = new Map(bv.map(x => [String(x.name || '').trim().toLowerCase(), x]));
  const changes = av.map(x => {
    const y = map.get(String(x.name || '').trim().toLowerCase());
    if (!y || typeof x.value !== 'number' || typeof y.value !== 'number') return null;
    const change = y.value - x.value;
    return { metric: x.name, previous: x.value, latest: y.value, change, percent: x.value ? (change / x.value) * 100 : null, unit: y.unit || x.unit || '' };
  }).filter(Boolean);
  r.json({ previous: a, latest: b, changes, comparedAt: new Date().toISOString() });
});

app.post('/api/ai/ask', auth, async (req: AuthRequest, r) => {
  const message = String(req.body?.message || req.body?.prompt || '').trim();
  if (!message) return r.status(400).json({ message: 'Message required' });
  try {
    const result = await ask(uid(req), message, { conversationId: req.body?.conversationId, context: req.body?.context });
    r.json(result);
  } catch (e: any) { r.status(500).json({ message: e?.message || 'AI request failed' }); }
});

app.post('/api/ai/chat', auth, async (req: AuthRequest, r) => {
  const prompt = String(req.body?.prompt || req.body?.message || '').trim();
  if (!prompt) return r.status(400).json({ message: 'Prompt required' });
  try { r.json(await ask(uid(req), prompt, { conversationId: req.body?.conversationId, context: req.body?.context })); }
  catch (e: any) { r.status(500).json({ message: e?.message || 'AI request failed' }); }
});

app.post('/api/doctor-brief/generate', auth, async (req: AuthRequest, r) => {
  try {
    const brief = await doctorBrief(uid(req), Array.isArray(req.body?.questions) ? req.body.questions : []);
    const saved = await DoctorBrief.create({ userId: uid(req), ...brief, generatedAt: new Date() });
    r.json(saved);
  } catch (e: any) { r.status(500).json({ message: e?.message || 'Could not generate doctor brief' }); }
});



// -------------------- Profile --------------------
app.get('/api/profile', auth, async (req: AuthRequest, r) => {
  const u = await User.findById(uid(req)).select('-passwordHash').lean();
  u ? r.json(u) : r.status(404).json({ message: 'Profile not found' });
});
app.patch('/api/profile', auth, async (req: AuthRequest, r) => {
  const allowed = ['name','dateOfBirth','gender','height','weight','bloodGroup'];
  const patch: any = {};
  for (const k of allowed) if (req.body?.[k] !== undefined) patch[k] = req.body[k];
  const u = await User.findByIdAndUpdate(uid(req), patch, { new: true }).select('-passwordHash').lean();
  u ? r.json(u) : r.status(404).json({ message: 'Profile not found' });
});

// -------------------- Notifications --------------------
app.get('/api/notifications', auth, async (req: AuthRequest, r) => {
  r.json(await Notification.find({ userId: uid(req) }).sort({ createdAt: -1 }).limit(50).lean());
});
app.patch('/api/notifications/:id/read', auth, async (req: AuthRequest, r) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: uid(req) }, { read: true }, { new: true }).lean();
  n ? r.json(n) : r.status(404).json({ message: 'Notification not found' });
});
app.put('/api/notifications/:id/read', auth, async (req: AuthRequest, r) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: uid(req) }, { read: true }, { new: true }).lean();
  n ? r.json(n) : r.status(404).json({ message: 'Notification not found' });
});
app.post('/api/notifications/read-all', auth, async (req: AuthRequest, r) => {
  const result = await Notification.updateMany({ userId: uid(req), read: false }, { $set: { read: true } });
  r.json({ ok: true, modified: result.modifiedCount || 0 });
});

// -------------------- Emergency --------------------
app.get('/api/emergency/profile', auth, async (req: AuthRequest, r) => {
  const profile = await EmergencyProfile.findOne({ userId: uid(req) }).lean();
  r.json(profile || { allergies: [], conditions: [], medications: [], emergencyContacts: [] });
});
app.put('/api/emergency/profile', auth, async (req: AuthRequest, r) => {
  const payload = {
    bloodGroup: String(req.body?.bloodGroup || ''),
    allergies: Array.isArray(req.body?.allergies) ? req.body.allergies.slice(0, 20).map(String) : [],
    conditions: Array.isArray(req.body?.conditions) ? req.body.conditions.slice(0, 20).map(String) : [],
    medications: Array.isArray(req.body?.medications) ? req.body.medications.slice(0, 20).map(String) : [],
    emergencyContacts: Array.isArray(req.body?.emergencyContacts) ? req.body.emergencyContacts.slice(0, 5) : [],
    notes: String(req.body?.notes || ''),
  };
  const p = await EmergencyProfile.findOneAndUpdate({ userId: uid(req) }, { $set: payload, userId: uid(req) }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  r.json(p);
});
app.post('/api/emergency/sos', auth, async (req: AuthRequest, r) => {
  const id = uid(req);
  const [u, p, meds, conditions, latestMetric, latestRecord] = await Promise.all([
    User.findById(id).select('name dateOfBirth bloodGroup').lean(),
    EmergencyProfile.findOne({ userId: id }).lean(),
    Medication.find({ userId: id, status: { $ne: 'inactive' } }).sort({ startDate: -1 }).limit(8).lean(),
    Condition.find({ userId: id, status: { $ne: 'inactive' } }).sort({ diagnosedDate: -1 }).limit(8).lean(),
    HealthMetric.find({ userId: id }).sort({ recordedAt: -1 }).limit(5).lean(),
    MedicalRecord.findOne({ userId: id }).sort({ recordDate: -1 }).lean(),
  ]);
  const eventId = `HM-${Date.now().toString(36).toUpperCase()}`;
  const card = {
    emergencyId: eventId,
    name: u?.name || 'Patient',
    age: patientAge(u?.dateOfBirth),
    bloodGroup: p?.bloodGroup || u?.bloodGroup || 'Not recorded',
    allergies: p?.allergies || [],
    conditions: (p?.conditions?.length ? p.conditions : conditions.map(x => x.name).filter(Boolean)) || [],
    medications: (p?.medications?.length ? p.medications : meds.map(x => `${x.name || 'Medication'}${x.dosage ? ` — ${x.dosage}` : ''}`).filter(Boolean)) || [],
    latestVitals: latestMetric,
    recentMedicalEvent: latestRecord ? { title: latestRecord.title, date: latestRecord.recordDate, summary: latestRecord.summary } : null,
    emergencyContacts: p?.emergencyContacts || [],
    location: req.body?.latitude && req.body?.longitude ? { latitude: Number(req.body.latitude), longitude: Number(req.body.longitude) } : null,
  };
  const event = await EmergencyEvent.create({ userId: id, eventId, status: 'prepared', latitude: card.location?.latitude, longitude: card.location?.longitude, cardSnapshot: card });
  await Notification.create({ userId: id, type: 'emergency', title: 'Emergency card prepared', message: `Emergency information prepared with ID ${eventId}.`, actionUrl: '/app/emergency', metadata: { eventId } });
  r.status(201).json({ event, card, notice: 'Emergency information prepared for sharing. No ambulance dispatch was triggered.' });
});
app.get('/api/emergency/events', auth, async (req: AuthRequest, r) => r.json(await EmergencyEvent.find({ userId: uid(req) }).sort({ createdAt: -1 }).limit(20).lean()));

// -------------------- Health Sphere --------------------
app.get('/api/community/posts', auth, async (_req: AuthRequest, r) => {
  const posts = await HealthSpherePost.find().sort({ createdAt: -1 }).limit(50).lean();
  const userIds = [...new Set(posts.map(p => String(p.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
  const names = new Map(users.map(u => [String(u._id), u.name]));
  r.json(posts.map(p => ({ ...p, author: names.get(String(p.userId)) || 'Community member' })));
});
app.post('/api/community/posts', auth, async (req: AuthRequest, r) => {
  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  const category = ['Health','Fitness','Nutrition','Wellness'].includes(req.body?.category) ? req.body.category : 'Health';
  if (!title || !body) return r.status(400).json({ message: 'Title and body are required' });
  if (title.length > 140 || body.length > 5000) return r.status(400).json({ message: 'Post is too long' });
  const post = await HealthSpherePost.create({ userId: uid(req), title, body, category });
  r.status(201).json(post);
});
app.post('/api/community/posts/:id/like', auth, async (req: AuthRequest, r) => {
  const post = await HealthSpherePost.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true }).lean();
  post ? r.json(post) : r.status(404).json({ message: 'Post not found' });
});
app.get('/api/community/posts/:id/comments', auth, async (req: AuthRequest, r) => {
  const comments = await HealthSphereComment.find({ postId: req.params.id }).sort({ createdAt: 1 }).lean();
  r.json(comments);
});
app.post('/api/community/posts/:id/comments', auth, async (req: AuthRequest, r) => {
  const body = String(req.body?.body || '').trim();
  if (!body) return r.status(400).json({ message: 'Comment required' });
  const comment = await HealthSphereComment.create({ postId: req.params.id, userId: uid(req), body });
  r.status(201).json(comment);
});
app.post('/api/community/follow/:userId', auth, async (req: AuthRequest, r) => {
  if (String(req.params.userId) === String(uid(req))) return r.status(400).json({ message: 'Cannot follow yourself' });
  const existing = await HealthSphereFollow.findOne({ followerId: uid(req), followingId: req.params.userId });
  if (!existing) await HealthSphereFollow.create({ followerId: uid(req), followingId: req.params.userId });
  r.json({ ok: true });
});

// -------------------- Record-derived reminder --------------------
app.post('/api/reminders/from-record/:id', auth, async (req: AuthRequest, r) => {
  const record = await MedicalRecord.findOne({ _id: req.params.id, userId: uid(req) }).lean();
  if (!record) return r.status(404).json({ message: 'Record not found' });

  const match = parseFollowUpFromRecord(record);
  if (!match || !match.followUpDate) return r.status(400).json({ message: 'No follow-up information was detected in this record.' });

  const existing = await Reminder.findOne({
    userId: uid(req),
    sourceRecordId: record._id,
    followUpDate: match.followUpDate,
    status: { $ne: 'completed' },
  });
  if (existing) return r.status(409).json({ message: 'A reminder for this follow-up already exists.', reminder: existing });

  const reminderDate = new Date(match.followUpDate.getTime() - (match.leadTimeDays || 7) * 86400000);
  const reminder = await Reminder.create({
    userId: uid(req),
    title: `Follow-up: ${record.title}`,
    note: `${match.label}. Source: ${record.title} (${new Date(record.recordDate || new Date()).toLocaleDateString()}).`,
    reminderDate,
    source: 'record-derived',
    sourceRecordId: record._id,
    sourceRecordTitle: record.title,
    sourceRecordDate: record.recordDate,
    followUpDate: match.followUpDate,
    followUpType: match.followUpType,
    leadTimeDays: match.leadTimeDays,
    status: 'pending',
  });

  await Notification.create({
    userId: uid(req),
    type: 'reminder',
    title: 'Smart reminder created',
    message: `Your follow-up for ${record.title || 'this record'} is planned for ${new Date(match.followUpDate).toLocaleDateString()}.`,
    actionUrl: '/app/reminders',
    metadata: { recordId: String(record._id), reminderId: String(reminder._id), followUpType: match.followUpType },
  });

  r.status(201).json({ reminder, followUpDate: match.followUpDate, label: match.label, reminderDate });
});

app.use('/uploads', express.static(uploadDir));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled app error:', err?.message || err);
  res.status(500).json({ message: 'Internal server error' });
});
app.use((_q, r) => r.status(404).json({ message: 'Route not found' }));

connectMongo().catch((error) => {
  console.error('MongoDB connection failed:', error instanceof Error ? error.message : String(error));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`HealthMemory 360 API on ${PORT} | CORS: ${CLIENT_URL} | AI: ${process.env.AI_PROVIDER || 'mock'}`);
  });
}

export default app;


