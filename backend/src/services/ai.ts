import fs from 'fs/promises';
import { MedicalRecord, Medication, HealthMetric, Condition, FitnessRecord, NutritionRecord, MentalWellnessRecord, Appointment, User, Reminder } from '../models';

export type Source = { id: string; title: string; date?: string; type: string };

export interface HealthContext {
  user: any;
  records: any[];
  medications: any[];
  conditions: any[];
  metrics: any[];
  fitness: any[];
  nutrition: any[];
  wellness: any[];
  appointments: any[];
  reminders: any[];
}

export interface AIProvider {
  chat(prompt: string, context: string): Promise<string>;
  extract?(file: { data: Buffer; mimeType: string; fileName: string }, hint?: string): Promise<any>;
}

const clean = (v: any) => String(v ?? '').trim();
const dateText = (v: any) => v ? new Date(v).toISOString().slice(0, 10) : '';
const normalize = (v: string) => clean(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function values(record: any): any[] {
  return Array.isArray(record?.extractedData?.values) ? record.extractedData.values : [];
}

function buildSources(ctx: HealthContext): Source[] {
  return ctx.records.slice(0, 8).map(r => ({
    id: String(r._id),
    title: r.title || 'Medical record',
    date: dateText(r.recordDate),
    type: r.recordType || 'Medical record',
  }));
}

export async function contextFor(userId: string): Promise<HealthContext> {
  const [user, records, medications, conditions, metrics, fitness, nutrition, wellness, appointments, reminders] = await Promise.all([
    User.findById(userId).select('name dateOfBirth gender height weight bloodGroup').lean(),
    MedicalRecord.find({ userId }).sort({ recordDate: -1 }).limit(20).lean(),
    Medication.find({ userId }).sort({ startDate: -1 }).limit(20).lean(),
    Condition.find({ userId }).sort({ diagnosedDate: -1 }).limit(20).lean(),
    HealthMetric.find({ userId }).sort({ recordedAt: -1 }).limit(50).lean(),
    FitnessRecord.find({ userId }).sort({ recordedAt: -1 }).limit(14).lean(),
    NutritionRecord.find({ userId }).sort({ recordedAt: -1 }).limit(14).lean(),
    MentalWellnessRecord.find({ userId }).sort({ recordedAt: -1 }).limit(14).lean(),
    Appointment.find({ userId }).sort({ appointmentDate: 1 }).limit(10).lean(),
    Reminder.find({ userId, status: 'pending' }).sort({ reminderDate: 1 }).limit(20).lean(),
  ]);
  return { user, records, medications, conditions, metrics, fitness, nutrition, wellness, appointments, reminders };
}

function contextText(ctx: HealthContext): string {
  const safe = {
    profile: ctx.user,
    medicalRecords: ctx.records.map(r => ({
      id: r._id, title: r.title, type: r.recordType, date: dateText(r.recordDate), hospital: r.hospital,
      doctor: r.doctor, summary: r.summary, values: values(r), extractedText: r.extractedText?.slice(0, 2500),
    })),
    medications: ctx.medications,
    conditions: ctx.conditions,
    recentMetrics: ctx.metrics,
    recentFitness: ctx.fitness,
    recentNutrition: ctx.nutrition,
    recentWellness: ctx.wellness,
    appointments: ctx.appointments,
    reminders: ctx.reminders,
  };
  return JSON.stringify(safe, null, 2);
}

function latestRecord(ctx: HealthContext) {
  return ctx.records[0];
}

function compareLatest(ctx: HealthContext) {
  if (ctx.records.length < 2) return [];
  const latest = values(ctx.records[0]);
  const previous = values(ctx.records[1]);
  const prev = new Map(previous.map(v => [normalize(v.name), v]));
  return latest.map(v => {
    const p = prev.get(normalize(v.name));
    if (!p || typeof p.value !== 'number' || typeof v.value !== 'number') return null;
    const change = v.value - p.value;
    const percent = p.value !== 0 ? (change / p.value) * 100 : null;
    return { metric: v.name, previous: p.value, latest: v.value, change, percent, unit: v.unit || p.unit || '' };
  }).filter(Boolean) as any[];
}

function addMonthsLocal(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function parseReminderRequest(prompt: string, ctx: HealthContext) {
  const q = normalize(prompt);
  if (!/(remind|reminder|schedule|set.*alert|checkup|check up|follow up|follow-up)/.test(q)) return null;
  if (!/(remind|reminder|schedule|set.*alert)/.test(q) && !/checkup|check up|follow up|follow-up/.test(q)) return null;

  const now = new Date();
  let date: Date | null = null;
  let recurrence = 'none';

  const inMatch = q.match(/(?:in|after)\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)/);
  if (inMatch) {
    const n = Number(inMatch[1]);
    const unit = inMatch[2];
    date = new Date(now);
    if (unit.startsWith('day')) date.setDate(date.getDate() + n);
    else if (unit.startsWith('week')) date.setDate(date.getDate() + n * 7);
    else if (unit.startsWith('month')) date.setMonth(date.getMonth() + n);
    else date.setFullYear(date.getFullYear() + n);
  }

  const monthMatch = q.match(/(?:on|for)\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/);
  if (!date && monthMatch) {
    const months: Record<string, number> = {january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
    const year = Number(monthMatch[3] || now.getFullYear());
    date = new Date(year, months[monthMatch[2]], Number(monthMatch[1]), 9, 0, 0, 0);
    if (!monthMatch[3] && date < now) date.setFullYear(year + 1);
  }

  if (/tomorrow/.test(q)) { date = new Date(now); date.setDate(date.getDate() + 1); date.setHours(9,0,0,0); }
  if (/next week/.test(q)) { date = new Date(now); date.setDate(date.getDate() + 7); date.setHours(9,0,0,0); }

  const recurring = q.match(/every\s+(month|3\s+months|quarter|6\s+months|half year|year|12\s+months)/);
  if (recurring) {
    const unit = recurring[1];
    if (unit === 'month') { recurrence = 'monthly'; date = addMonthsLocal(now, 1); }
    else if (unit.includes('3') || unit === 'quarter') { recurrence = 'quarterly'; date = addMonthsLocal(now, 3); }
    else if (unit.includes('6') || unit === 'half') { recurrence = 'half-yearly'; date = addMonthsLocal(now, 6); }
    else { recurrence = 'yearly'; date = addMonthsLocal(now, 12); }
    date.setHours(9,0,0,0);
  }

  // If the user asks for a routine check-up without a date, anchor it to the latest stored medical record.
  if (!date && /checkup|check up|routine review|health review/.test(q)) {
    const latest = ctx.records[0]?.recordDate ? new Date(ctx.records[0].recordDate) : now;
    date = addMonthsLocal(latest, 6);
    if (date <= now) date = addMonthsLocal(now, 1);
    date.setHours(9,0,0,0);
  }

  if (!date || Number.isNaN(date.getTime())) return null;

  let title = /checkup|check up|routine review|health review/.test(q) ? 'Routine health check-up' : 'HealthMemory reminder';
  if (/medication|medicine/.test(q)) title = 'Medication reminder';
  if (/blood test|lab test/.test(q)) title = 'Blood/lab test reminder';
  if (/doctor|appointment|visit/.test(q)) title = 'Doctor visit reminder';

  const note = /checkup|check up|routine review|health review/.test(q)
    ? 'Suggested from your stored health history. Confirm the timing with your healthcare professional.'
    : `Created from your HealthMemory assistant request: “${prompt.trim()}”`;
  return { title, note, reminderDate: date, recurrence };
}

export async function createReminderFromPrompt(userId: string, prompt: string) {
  const ctx = await contextFor(userId);
  const parsed = parseReminderRequest(prompt, ctx);
  if (!parsed) return null;
  const reminder = await Reminder.create({ userId, ...parsed, source: 'ai-assistant', status: 'pending' });
  return reminder.toObject();
}

function localAnswer(prompt: string, ctx: HealthContext): string {
  const q = normalize(prompt);
  const latest = latestRecord(ctx);
  const changes = compareLatest(ctx);

  if (/last blood test|latest blood test|when.*blood test/.test(q)) {
    const blood = ctx.records.find(r => /blood|lab|panel/i.test(`${r.title} ${r.recordType}`));
    return blood
      ? `Your latest stored blood/lab record is “${blood.title || 'Blood test'}” dated ${dateText(blood.recordDate)}. I’m reporting the date stored in your HealthMemory record, not interpreting the result.`
      : 'I could not find a stored blood-test or lab record in your current HealthMemory.';
  }

  if (/what changed|compare|change.*report|latest report/.test(q)) {
    if (!changes.length) return ctx.records.length < 2 ? 'I need at least two stored reports with shared extracted values to calculate changes.' : 'I found the reports, but there are no shared numeric values available to compare.';
    const lines = changes.map(x => `• ${x.metric}: ${x.previous} → ${x.latest} ${x.unit} (${x.change >= 0 ? '+' : ''}${x.change.toFixed(1)})`);
    return `Between your two most recent stored reports (${dateText(ctx.records[1].recordDate)} → ${dateText(ctx.records[0].recordDate)}), the recorded values changed as follows:\n\n${lines.join('\n')}\n\nThese are descriptive changes in stored records, not a medical interpretation.`;
  }

  if (/summarize.*history|health history|overall history/.test(q)) {
    const parts = [
      `You have ${ctx.records.length} stored medical records, ${ctx.medications.length} medication entries, and ${ctx.conditions.length} condition entries.`,
      latest ? `Most recent medical record: ${latest.title || 'Medical record'} on ${dateText(latest.recordDate)}.` : 'No medical record is currently stored.',
      ctx.fitness[0] ? `Latest fitness entry: ${ctx.fitness[0].steps ?? 0} steps and ${ctx.fitness[0].exerciseMinutes ?? 0} exercise minutes.` : '',
      ctx.wellness[0] ? `Latest wellness check-in: mood ${ctx.wellness[0].mood || 'not recorded'}, stress ${ctx.wellness[0].stress || 'not recorded'}.` : '',
      ctx.nutrition[0] ? `Latest nutrition entry: ${ctx.nutrition[0].water ?? 0} L water and ${ctx.nutrition[0].calories ?? 0} kcal recorded.` : '',
    ].filter(Boolean);
    return parts.join('\n');
  }

  if (/doctor|discuss|appointment|visit/.test(q)) {
    const questions: string[] = [];
    if (changes.length) questions.push(`Review the recorded changes between ${dateText(ctx.records[1]?.recordDate)} and ${dateText(ctx.records[0]?.recordDate)}.`);
    if (ctx.medications.length) questions.push(`Confirm the current medication list and whether any entries need updating.`);
    if (ctx.conditions.length) questions.push(`Confirm that the condition/history entries in the record are still current.`);
    if (!questions.length) questions.push('Which parts of my stored health history should I bring to the visit?');
    return `Based only on your stored information, useful discussion prompts are:\n\n${questions.map(x => `• ${x}`).join('\n')}\n\nA clinician should provide the medical interpretation and treatment advice.`;
  }

  if (/medication|medicine|drug/.test(q)) {
    if (!ctx.medications.length) return 'There are no medication entries stored in your HealthMemory.';
    return `Stored medications:\n\n${ctx.medications.map(m => `• ${m.name || 'Unnamed'} — ${m.dosage || 'dose not recorded'} — ${m.frequency || 'frequency not recorded'} — ${m.status || 'status not recorded'}`).join('\n')}`;
  }

  if (/reminder|remind|upcoming|due|checkup|check up/.test(q)) {
    if (!ctx.reminders.length) return 'You do not have any pending HealthMemory reminders. You can say “remind me for a check-up in 30 days” or “remind me every 6 months for a check-up”.';
    return `Your pending HealthMemory reminders:\n\n${ctx.reminders.slice(0, 8).map(r => `• ${r.title || 'Reminder'} — ${dateText(r.reminderDate)}${r.note ? ` — ${r.note}` : ''}`).join('\n')}`;
  }

  if (/fitness|steps|sleep|exercise/.test(q)) {
    const f = ctx.fitness[0];
    return f ? `Your latest stored fitness entry records ${f.steps ?? 0} steps, ${f.exerciseMinutes ?? 0} exercise minutes, ${f.sleep ?? 'not recorded'} hours of sleep, and ${f.heartRate ?? 'not recorded'} bpm heart rate.` : 'No fitness entries are currently stored.';
  }

  return `I searched your stored HealthMemory records. I found ${ctx.records.length} medical records, ${ctx.metrics.length} health measurements, ${ctx.fitness.length} fitness entries, ${ctx.nutrition.length} nutrition entries, and ${ctx.wellness.length} wellness entries.\n\nFor a more precise answer, ask about a specific record, date, measurement, medication, trend, or comparison. I only use the information stored in your account for this assistant.`;
}

class MockProvider implements AIProvider {
  async chat(prompt: string, context: string) {
    const parsed = JSON.parse(context);
    return localAnswer(prompt, parsed);
  }
}

class GeminiProvider implements AIProvider {
  private key = process.env.AI_API_KEY || '';
  private model = process.env.AI_MODEL || 'gemini-2.5-flash';
  async chat(prompt: string, context: string) {
    const system = `You are HealthMemory 360, a record-grounded personal health memory assistant. Use ONLY the supplied user context. Never diagnose, prescribe, infer a disease, or invent missing values. Clearly distinguish stored facts from general guidance. If the answer is not in the context, say that. For medical safety, encourage the user to discuss important concerns with a qualified clinician. Be concise, structured, and cite record titles/dates in plain text when relevant.\n\nUSER HEALTH CONTEXT:\n${context}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.key)}`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${system}\n\nQUESTION:\n${prompt}` }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 900 } }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Gemini request failed (${res.status})`);
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('')?.trim() || 'The AI provider returned an empty response.';
  }

  async extract(file: { data: Buffer; mimeType: string; fileName: string }, hint = '') {
    const prompt = `Extract structured facts from this medical document. Return ONLY valid JSON, no markdown. Schema: {"title":string,"recordType":"Report"|"Prescription"|"Scan"|"Visit Note"|"Other","recordDate":"YYYY-MM-DD|null","hospital":"string|null","doctor":"string|null","summary":"string","values":[{"name":string,"value":number|string,"unit":string,"uncertain":boolean}],"medications":[{"name":string,"dosage":string,"frequency":string}],"conditions":[{"name":string,"status":string}],"warnings":[string]}. Do not invent values. If a field is unreadable, use null/empty and mark the related value uncertain. This is information extraction, not diagnosis. User hint: ${hint}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.key)}`;
    const body = { contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: file.mimeType, data: file.data.toString('base64') } }] }], generationConfig: { temperature: 0, maxOutputTokens: 1400, responseMimeType: 'application/json' } };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Gemini extraction failed (${res.status})`);
    const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('')?.trim() || '{}';
    try { return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()); }
    catch { throw new Error('AI returned invalid extraction JSON. Please retry the upload.'); }
  }
}

class OpenAIProvider implements AIProvider {
  private key = process.env.AI_API_KEY || '';
  private model = process.env.AI_MODEL || 'gpt-4o-mini';
  async chat(prompt: string, context: string) {
    const system = `You are HealthMemory 360, a record-grounded personal health memory assistant. Use only the supplied health context. Never diagnose, prescribe, or invent missing data. Say when information is unavailable. Keep answers concise and source-grounded. Context:\n${context}`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.key}` }, body: JSON.stringify({ model: this.model, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `OpenAI request failed (${res.status})`);
    return data?.choices?.[0]?.message?.content?.trim() || 'The AI provider returned an empty response.';
  }
}

function provider(): AIProvider {
  const p = clean(process.env.AI_PROVIDER).toLowerCase();
  if (p === 'gemini' && process.env.AI_API_KEY) return new GeminiProvider();
  if (p === 'openai' && process.env.AI_API_KEY) return new OpenAIProvider();
  return new MockProvider();
}

export async function ask(userId: string, prompt: string) {
  const ctx = await contextFor(userId);
  const createdReminder = await createReminderFromPrompt(userId, prompt);
  const p = provider();
  let answer: string;
  try { answer = await p.chat(prompt, contextText(ctx)); }
  catch (error: any) {
    answer = `${localAnswer(prompt, ctx)}\n\nAI provider note: ${error?.message || 'The configured AI provider was unavailable, so I used the local record-grounded assistant.'}`;
  }
  if (createdReminder) {
    const when = new Date(createdReminder.reminderDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    answer = `Done — I created a HealthMemory reminder for **${createdReminder.title}** on ${when}.\n\n${createdReminder.note || ''}\n\nYou’ll see it in your Reminders and notification panel while this app is open.`;
  }
  return { answer, sources: buildSources(ctx), action: createdReminder ? { type: 'reminder-created', reminder: createdReminder } : null };
}

function fallbackExtract(fileName: string, hint = '') {
  return {
    title: hint || fileName.replace(/\.[^.]+$/, '') || 'Uploaded medical record',
    recordType: /prescription/i.test(fileName) ? 'Prescription' : /scan|xray|mri|ct/i.test(fileName) ? 'Scan' : 'Report',
    recordDate: null,
    hospital: null,
    doctor: null,
    summary: 'Document uploaded. AI extraction is not enabled, so fields require manual review.',
    values: [], medications: [], conditions: [], warnings: ['AI extraction is disabled. Review this record manually before relying on extracted fields.'],
  };
}

export async function extractDocument(filePath: string, mimeType: string, fileName: string, hint = '') {
  const data = await fs.readFile(filePath);
  const p = provider();
  if (p.extract) {
    try { return await p.extract({ data, mimeType, fileName }, hint); }
    catch (error: any) { return { ...fallbackExtract(fileName, hint), warnings: [error?.message || 'AI extraction failed.'] }; }
  }
  return fallbackExtract(fileName, hint);
}

export async function doctorBrief(userId: string, questions: string[] = []) {
  const ctx = await contextFor(userId);
  const recent = ctx.records.slice(0, 5);
  const changes = compareLatest(ctx);
  const base = {
    summary: `Record-based summary for ${ctx.user?.name || 'the user'}, using ${recent.length} recent medical records and current stored health entries.`,
    keyConditions: ctx.conditions.filter(c => c.status !== 'inactive').map(c => c.name).filter(Boolean),
    medications: ctx.medications.filter(m => m.status !== 'inactive').map(m => `${m.name || 'Unnamed'} — ${m.dosage || 'dose not recorded'} — ${m.frequency || 'frequency not recorded'}`),
    recentReports: recent.map(r => `${r.title || 'Medical record'} — ${dateText(r.recordDate)}`),
    changes,
    questions: questions.length ? questions : [
      ...(changes.length ? ['What should I discuss about the recorded changes between my recent reports?'] : []),
      'Are my stored medication and condition entries up to date?',
      'Which parts of my health history should we review at this visit?',
    ],
  };
  if (process.env.AI_PROVIDER === 'gemini' || process.env.AI_PROVIDER === 'openai') {
    try {
      const p = provider();
      const prompt = `Create a concise doctor-visit preparation brief from the supplied records. Return ONLY JSON with keys summary, keyConditions, medications, recentReports, questions. Do not diagnose. Keep questions as discussion prompts.\n${JSON.stringify(base)}`;
      const text = await p.chat(prompt, contextText(ctx));
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      return { ...base, ...parsed, changes };
    } catch { /* deterministic brief remains available */ }
  }
  return base;
}
