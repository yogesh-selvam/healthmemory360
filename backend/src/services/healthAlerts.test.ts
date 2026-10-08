import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFollowUpFromRecord, calculatePatientAge, buildContextualAlert } from './healthAlerts';

test('parseFollowUpFromRecord resolves explicit dates and interval estimates', () => {
  const explicit = parseFollowUpFromRecord({
    title: 'Blood Test',
    recordDate: '2026-08-12',
    extractedData: { followUp: { date: '2026-10-20' } },
  });
  assert.equal(explicit?.followUpType, 'confirmed-appointment');
  assert.equal(explicit?.followUpDate?.toISOString().slice(0, 10), '2026-10-20');

  const interval = parseFollowUpFromRecord({
    title: 'Blood Test',
    recordDate: '2026-10-07',
    extractedData: { followUp: { value: 3, unit: 'months' } },
  });
  assert.equal(interval?.followUpType, 'interval-estimate');
  assert.equal(interval?.followUpDate?.toISOString().slice(0, 10), '2027-01-07');
});

test('calculatePatientAge and contextual alert use patient details', () => {
  const age = calculatePatientAge('2002-05-12');
  assert.equal(age, 24);

  const alert = buildContextualAlert({
    name: 'Alex Morgan',
    dateOfBirth: '2002-05-12',
  }, {
    _id: 'r1',
    title: 'Blood Test',
    recordDate: '2026-08-12',
    summary: 'Follow-up after 3 months.',
  }, {
    alertType: 'Upcoming Checkup',
    severity: 'warning',
    title: 'Follow-up checkup is approaching',
    message: 'Your recent blood test suggests a follow-up may be due.',
    reason: 'Follow-up was recommended based on the patient record.',
    sourceRecordId: 'r1',
    sourceRecordTitle: 'Blood Test',
    sourceRecordDate: '2026-08-12',
    followUpDate: '2026-10-20',
    previousRecords: [{ title: 'Health Check', recordDate: '2026-07-14' }],
    latestVitals: [{ label: 'BP', value: '128/82' }],
  });
  assert.equal(alert.patientName, 'Alex Morgan');
  assert.equal(alert.patientAge, 24);
  assert.equal(alert.alertType, 'Upcoming Checkup');
  assert.equal(alert.latestVitals[0].label, 'BP');
});
