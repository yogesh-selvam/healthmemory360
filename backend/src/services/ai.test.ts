import test from 'node:test';
import assert from 'node:assert/strict';
import { inferIntent } from './ai';

test('inferIntent recognizes record and comparison prompts', () => {
  assert.equal(inferIntent('When was my last blood test?'), 'record_lookup');
  assert.equal(inferIntent('What changed between my last two blood tests?'), 'report_comparison');
  assert.equal(inferIntent('When is my next checkup?'), 'appointment_lookup');
  assert.equal(inferIntent('Why did I get this reminder?'), 'reminder_explanation');
});

test('inferIntent flags unsupported diagnosis requests', () => {
  assert.equal(inferIntent('Do I have diabetes?'), 'unsupported_medical_request');
});
