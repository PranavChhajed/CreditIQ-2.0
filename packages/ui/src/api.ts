import type { Decision, DecisionOverride, MonitoringSummary, OverrideReasonCode } from '@creditiq/shared';

export interface PersonaSummary {
  id: string;
  label: string;
  segment: 'A' | 'D';
}

export async function fetchPersonas(): Promise<PersonaSummary[]> {
  const res = await fetch('/api/personas');
  if (!res.ok) {
    throw new Error(`Failed to load applicants: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function submitDecision(applicantId: string): Promise<Decision> {
  const res = await fetch('/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_id: applicantId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit decision: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMonitoringSummary(): Promise<MonitoringSummary> {
  const res = await fetch('/api/monitoring/summary');
  if (!res.ok) {
    throw new Error(`Failed to load monitoring summary: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchOverride(applicantId: string): Promise<DecisionOverride | null> {
  const res = await fetch(`/api/decisions/${applicantId}/override`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load override: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface OverrideInput {
  override_outcome: 'approve' | 'reject';
  reason_code: OverrideReasonCode;
  reason_text: string;
  overridden_by: string;
}

export async function submitOverride(applicantId: string, input: OverrideInput): Promise<DecisionOverride> {
  const res = await fetch(`/api/decisions/${applicantId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to submit override: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
