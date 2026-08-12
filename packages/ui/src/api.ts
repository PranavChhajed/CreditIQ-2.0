import type { Decision } from '@creditiq/shared';

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
