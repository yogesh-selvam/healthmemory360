import { Appointment, Condition, HealthAlert, HealthMetric, Medication, MedicalRecord, Notification, Reminder, User } from '../models';

export type VitalItem = {
  label: string;
  value: string;
  unit?: string;
};

export type FollowUpResult = {
  followUpDate: Date | null;
  followUpType: 'confirmed-appointment' | 'interval-estimate' | 'manual';
  label: string;
  leadTimeDays: number;
};

export function calculatePatientAge(dateOfBirth?: string | Date): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function parseFollowUpFromRecord(record: any): FollowUpResult | null {
  const recordDate = record?.recordDate ? new Date(record.recordDate) : new Date();
  const source: any = record?.extractedData || {};
  const explicit = source.followUp?.date || source.followUpDate || source.followUp?.followUpDate;
  if (explicit) {
    const date = new Date(explicit);
    if (!Number.isNaN(date.getTime())) {
      return { followUpDate: date, followUpType: 'confirmed-appointment', label: 'Confirmed appointment from record', leadTimeDays: 7 };
    }
  }

  const value = Number(source.followUp?.value ?? source.followUpValue ?? source.followUp?.amount ?? 0);
  const unit = String(source.followUp?.unit || source.followUpUnit || '').toLowerCase();
  if (value > 0 && unit) {
    const next = new Date(recordDate);
    if (unit.startsWith('day')) next.setDate(next.getDate() + value);
    else if (unit.startsWith('week')) next.setDate(next.getDate() + value * 7);
    else if (unit.startsWith('month')) next.setMonth(next.getMonth() + value);
    else if (unit.startsWith('year')) next.setFullYear(next.getFullYear() + value);
    if (!Number.isNaN(next.getTime())) {
      return { followUpDate: next, followUpType: 'interval-estimate', label: 'Record-derived estimate', leadTimeDays: 7 };
    }
  }

  const text = String(record?.extractedText || record?.summary || '').toLowerCase();
  const followRegex = /follow[- ]up\s+(?:on|after|in|for)\s+(?:\d+\s+(?:days?|weeks?|months?|years?)|(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})|(?:\d{1,2}[-/ ]\d{1,2}[-/ ]\d{2,4}))/i;
  if (followRegex.test(text)) {
    const match = text.match(/follow[- ]up\s+(?:on|after|in|for)\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)/i);
    if (match) {
      const amount = Number(match[1]);
      const unitName = String(match[2]).toLowerCase();
      const next = new Date(recordDate);
      if (unitName.startsWith('day')) next.setDate(next.getDate() + amount);
      else if (unitName.startsWith('week')) next.setDate(next.getDate() + amount * 7);
      else if (unitName.startsWith('month')) next.setMonth(next.getMonth() + amount);
      else if (unitName.startsWith('year')) next.setFullYear(next.getFullYear() + amount);
      if (!Number.isNaN(next.getTime())) {
        return { followUpDate: next, followUpType: 'interval-estimate', label: 'Record-derived estimate', leadTimeDays: 7 };
      }
    }
  }

  return null;
}

function isDuplicateAlert(existing: any[], alertType: string, sourceRecordId?: string | null, followUpDate?: Date | null) {
  return existing.some((alert: any) => {
    const alertSource = alert.sourceRecordId ? String(alert.sourceRecordId) : null;
    const candidateDate = followUpDate ? new Date(followUpDate).toISOString().slice(0, 10) : null;
    const alertDate = alert.followUpDate ? new Date(alert.followUpDate).toISOString().slice(0, 10) : null;
    return String(alert.alertType || '').toLowerCase() === String(alertType).toLowerCase()
      && (!sourceRecordId || sourceRecordId === alertSource)
      && (!candidateDate || candidateDate === alertDate)
      && !alert.resolved;
  });
}

function getLatestVitals(metrics: any[]): VitalItem[] {
  const vitals: VitalItem[] = [];
  const map = new Map<string, string>();

  for (const metric of metrics) {
    const name = String(metric.metricType || '').trim();
    const value = typeof metric.value === 'number' ? metric.value : Number(metric.value);
    if (!name || Number.isNaN(value)) continue;
    const label = name.toLowerCase().includes('blood pressure') ? 'BP' : name;
    const unit = metric.unit ? String(metric.unit) : '';
    const text = unit ? `${value} ${unit}`.trim() : String(value);
    if (!map.has(label)) map.set(label, text);
  }

  const preferred = ['BP', 'Glucose', 'Weight', 'SpO2', 'Heart Rate', 'Temperature', 'Cholesterol'];
  for (const label of preferred) {
    const value = map.get(label);
    if (value) vitals.push({ label, value });
  }
  for (const [label, value] of [...map.entries()].filter(([key]) => !preferred.includes(key))) {
    vitals.push({ label, value });
  }
  return vitals.slice(0, 6);
}

export function buildContextualAlert(
  user: any,
  record: any,
  config: {
    alertType: string;
    severity: 'info' | 'warning' | 'urgent';
    title: string;
    message: string;
    reason: string;
    sourceRecordId?: string | null;
    sourceRecordTitle?: string | null;
    sourceRecordDate?: Date | string | null;
    followUpDate?: Date | string | null;
    previousRecords?: any[];
    latestVitals?: VitalItem[];
    relevantMedication?: string | null;
    relevantCondition?: string | null;
    actionUrl?: string;
  }
) {
  const sourceRecordId = config.sourceRecordId || record?._id ? String(record?._id ?? config.sourceRecordId ?? '') : null;
  return {
    patientName: user?.name || 'Patient',
    patientAge: calculatePatientAge(user?.dateOfBirth),
    alertType: config.alertType,
    severity: config.severity,
    title: config.title,
    message: config.message,
    reason: config.reason,
    createdAt: new Date().toISOString(),
    sourceRecordId: sourceRecordId || null,
    sourceRecordTitle: config.sourceRecordTitle || record?.title || 'Medical record',
    sourceRecordDate: config.sourceRecordDate || record?.recordDate || null,
    previousRecords: (config.previousRecords || []).slice(0, 5),
    latestVitals: (config.latestVitals || []).slice(0, 6),
    relevantMedication: config.relevantMedication || null,
    relevantCondition: config.relevantCondition || null,
    followUpDate: config.followUpDate || null,
    actionUrl: config.actionUrl || '/app/alerts',
    read: false,
  };
}

export async function generatePatientAlerts(userId: string) {
  const [user, records, upcomingAppointments, pendingReminders, metrics, medications, conditions] = await Promise.all([
    User.findById(userId).select('name dateOfBirth bloodGroup').lean(),
    MedicalRecord.find({ userId }).sort({ recordDate: -1 }).lean(),
    Appointment.find({ userId, appointmentDate: { $gte: new Date() }, status: { $ne: 'cancelled' } }).sort({ appointmentDate: 1 }).limit(10).lean(),
    Reminder.find({ userId, status: 'pending' }).sort({ reminderDate: 1 }).limit(25).lean(),
    HealthMetric.find({ userId }).sort({ recordedAt: -1 }).lean(),
    Medication.find({ userId, status: { $ne: 'inactive' } }).sort({ startDate: -1 }).limit(10).lean(),
    Condition.find({ userId, status: { $ne: 'inactive' } }).sort({ diagnosedDate: -1 }).limit(10).lean(),
  ]);

  const existing = await HealthAlert.find({ userId, resolved: { $ne: true } }).lean();
  const generated: any[] = [];

  const createIfNeeded = async (input: any) => {
    const key = `${input.alertType}:${input.sourceRecordId || 'manual'}:${input.followUpDate ? new Date(input.followUpDate).toISOString().slice(0, 10) : 'none'}`;
    if (isDuplicateAlert(existing, input.alertType, input.sourceRecordId || null, input.followUpDate ? new Date(input.followUpDate) : null)) {
      return null;
    }
    const alert = await HealthAlert.create({
      userId,
      patientName: input.patientName,
      patientAge: input.patientAge,
      alertType: input.alertType,
      severity: input.severity,
      title: input.title,
      message: input.message,
      reason: input.reason,
      sourceRecordId: input.sourceRecordId || null,
      sourceRecordTitle: input.sourceRecordTitle || 'Medical record',
      sourceRecordDate: input.sourceRecordDate || null,
      previousRecords: input.previousRecords || [],
      latestVitals: input.latestVitals || [],
      relevantMedication: input.relevantMedication || null,
      relevantCondition: input.relevantCondition || null,
      followUpDate: input.followUpDate || null,
      actionUrl: input.actionUrl || '/app/alerts',
      read: false,
      resolved: false,
      metadata: { generatedBy: 'healthAlertsService', key },
    });
    await Notification.create({
      userId,
      type: 'alert',
      title: alert.title,
      message: alert.message,
      read: false,
      actionUrl: alert.actionUrl,
      metadata: { alertId: String(alert._id), sourceRecordId: alert.sourceRecordId ? String(alert.sourceRecordId) : null },
    });
    generated.push(alert.toObject());
    return alert;
  };

  if (upcomingAppointments[0]) {
    const appointment = upcomingAppointments[0];
    const appointmentDate = new Date(appointment.appointmentDate as Date | string);
    if (!Number.isNaN(appointmentDate.getTime())) {
      const record = records.find((item) => item.recordDate && new Date(item.recordDate) <= appointmentDate && new Date(item.recordDate) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) || records[0] || null;
      await createIfNeeded(buildContextualAlert(user, record, {
        alertType: 'Upcoming Checkup',
        severity: 'info',
        title: 'Upcoming checkup',
        message: `${appointment.doctor || 'Your healthcare provider'} is scheduled for ${appointmentDate.toLocaleDateString()}.`,
        reason: 'An upcoming appointment was found in the patient calendar and is linked to the relevant medical record context.',
        sourceRecordId: record?._id ? String(record._id) : null,
        sourceRecordTitle: record?.title || 'Medical record',
        sourceRecordDate: record?.recordDate || null,
        followUpDate: appointment.appointmentDate,
        previousRecords: records.slice(0, 5).map((item) => ({ title: item.title, recordDate: item.recordDate, summary: item.summary })),
        latestVitals: getLatestVitals(metrics),
        relevantMedication: medications[0]?.name || null,
        relevantCondition: conditions[0]?.name || null,
        actionUrl: '/app/reminders',
      }));
    }
  }

  for (const reminder of pendingReminders) {
    const relatedRecord = reminder.sourceRecordId ? records.find((record) => String(record._id) === String(reminder.sourceRecordId)) : records.find((record) => String(record.title || '').toLowerCase().includes(String(reminder.title || '').toLowerCase().split(':')[0] || '')) || records[0] || null;
    const followUpDate = reminder.followUpDate || reminder.reminderDate;
    await createIfNeeded(buildContextualAlert(user, relatedRecord, {
      alertType: 'Follow-up Due',
      severity: reminder.followUpType === 'confirmed-appointment' ? 'warning' : 'info',
      title: reminder.title || 'Follow-up due',
      message: `${reminder.title || 'Follow-up'} is scheduled for ${new Date(followUpDate).toLocaleDateString()}.`,
      reason: reminder.note || 'This reminder was triggered by the patient record or reminder workflow.',
      sourceRecordId: reminder.sourceRecordId ? String(reminder.sourceRecordId) : relatedRecord?._id ? String(relatedRecord._id) : null,
      sourceRecordTitle: relatedRecord?.title || reminder.sourceRecordTitle || 'Medical record',
      sourceRecordDate: relatedRecord?.recordDate || reminder.sourceRecordDate || null,
      followUpDate,
      previousRecords: records.slice(0, 5).map((item) => ({ title: item.title, recordDate: item.recordDate, summary: item.summary })),
      latestVitals: getLatestVitals(metrics),
      relevantMedication: medications[0]?.name || null,
      relevantCondition: conditions[0]?.name || null,
      actionUrl: '/app/reminders',
    }));
  }

  const recordWithFollowUp = records.find((record) => parseFollowUpFromRecord(record));
  if (recordWithFollowUp) {
    const parsed = parseFollowUpFromRecord(recordWithFollowUp);
    if (parsed?.followUpDate) {
      await createIfNeeded(buildContextualAlert(user, recordWithFollowUp, {
        alertType: 'Record-derived Reminder',
        severity: 'warning',
        title: 'Follow-up checkup is approaching',
        message: `${recordWithFollowUp.title || 'Your recent record'} contains a follow-up recommendation for ${new Date(parsed.followUpDate).toLocaleDateString()}.`,
        reason: 'A follow-up was recommended based on the patient medical record.',
        sourceRecordId: String(recordWithFollowUp._id),
        sourceRecordTitle: recordWithFollowUp.title || 'Medical record',
        sourceRecordDate: recordWithFollowUp.recordDate || null,
        followUpDate: parsed.followUpDate,
        previousRecords: records.slice(0, 5).map((item) => ({ title: item.title, recordDate: item.recordDate, summary: item.summary })),
        latestVitals: getLatestVitals(metrics),
        relevantMedication: medications[0]?.name || null,
        relevantCondition: conditions[0]?.name || null,
        actionUrl: '/app/records/' + String(recordWithFollowUp._id),
      }));
    }
  }

  return generated;
}
