export interface PersonaSummary {
  id: string;
  label: string;
  segment: 'A' | 'D';
}

export async function fetchPersonas(): Promise<PersonaSummary[]> {
  const res = await fetch('/api/personas');
  return res.json();
}

export async function submitDecision(applicantId: string): Promise<any> {
  const res = await fetch('/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_id: applicantId }),
  });
  return res.json();
}
