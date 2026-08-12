import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { EmployerCategory, LoanPurpose, RawApplicant, Segment } from '@creditiq/shared';
import { fetchPersonas, type PersonaSummary } from '../api.js';

const LOAN_PURPOSES: LoanPurpose[] = [
  'debt_consolidation', 'medical', 'education', 'home_improvement',
  'business_expansion', 'working_capital', 'other',
];

const EMPLOYER_CATEGORIES: EmployerCategory[] = [
  'govt_psu_listed', 'mid_size', 'small_unlisted', 'unverifiable',
];

/** A middle-of-the-road salaried applicant — a neutral starting point to edit from. */
function blankApplicant(): RawApplicant {
  return {
    applicant_id: `manual-${Date.now()}`,
    applicant_age_years: 32,
    segment: 'A',
    requested_product: 'personal_loan',
    bureau_score: 740,
    num_tradelines: 4,
    credit_history_age_months: 60,
    live_overdue_amount: 0,
    max_dpd_12m: 0,
    suit_filed: false,
    settlement_last_24m: false,
    num_enquiries_30d: 1,
    num_distinct_lenders_30d: 1,
    credit_utilization_pct_current: 30,
    credit_utilization_pct_3m_ago: 32,
    delinquency_events: [],
    existing_monthly_obligations: 5000,
    avg_monthly_bank_inflow_6m: 80000,
    bank_inflow_volatility_pct: 8,
    insufficient_funds_bounce_count_6m: 0,
    technical_bounce_count_6m: 0,
    signature_mismatch_bounce_count_6m: 0,
    epfo_employment_vintage_months: 48,
    employer_category: 'mid_size',
    salary_inflow_profile: { avg_monthly_credit: 80000, stability_pct: 95 },
    gst_registration_vintage_months: null,
    gst_filing_profile: null,
    declared_annual_turnover: null,
    business_inflow_profile: null,
    requested_amount: 500000,
    requested_tenure_months: 36,
    loan_purpose: 'other',
  };
}


function Num({ label, value, onChange, hint, min, max, step }: {
  label: string; value: number; onChange: (n: number) => void; hint?: string;
  min?: number; max?: number; step?: number;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}{hint && <em className="field-hint"> · {hint}</em>}</span>
      <input
        type="number" value={value} min={min} max={max} step={step ?? 1} className="input"
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </label>
  );
}

function Bool({ label, value, onChange }: { label: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Select<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly T[]; onChange: (v: T) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} className="input" onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="group">
      <legend className="group-legend">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ApplicantForm({ onEvaluate, submitting }: {
  onEvaluate: (raw: RawApplicant) => void;
  submitting: boolean;
}) {
  const [a, setA] = useState<RawApplicant>(blankApplicant);
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);

  useEffect(() => {
    fetchPersonas().then(setPersonas).catch(() => setPersonas([]));
  }, []);

  function set<K extends keyof RawApplicant>(key: K, value: RawApplicant[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }

  /** Switching segment also swaps which segment-specific block is populated and which product applies (F4). */
  function setSegment(segment: Segment) {
    setA((prev) => segment === 'A'
      ? {
        ...prev, segment, requested_product: 'personal_loan',
        epfo_employment_vintage_months: prev.epfo_employment_vintage_months ?? 48,
        employer_category: prev.employer_category ?? 'mid_size',
        salary_inflow_profile: prev.salary_inflow_profile ?? { avg_monthly_credit: 80000, stability_pct: 95 },
        gst_registration_vintage_months: null, gst_filing_profile: null,
        declared_annual_turnover: null, business_inflow_profile: null,
      }
      : {
        ...prev, segment, requested_product: 'business_loan',
        epfo_employment_vintage_months: null, employer_category: null, salary_inflow_profile: null,
        gst_registration_vintage_months: prev.gst_registration_vintage_months ?? 48,
        gst_filing_profile: prev.gst_filing_profile ?? { late_filings_12m: 0, total_filings_12m: 12 },
        declared_annual_turnover: prev.declared_annual_turnover ?? 1500000,
        business_inflow_profile: prev.business_inflow_profile ?? { avg_monthly_inflow: 100000, volatility_pct: 15 },
      });
  }

  function prefill(id: string) {
    const persona = personas.find((p) => p.id === id);
    if (persona) setA({ ...persona.raw, applicant_id: `manual-${Date.now()}` });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onEvaluate(a);
  }

  return (
    <form onSubmit={handleSubmit} className="panel">
      <h2 className="panel-title">Enter a borrower&rsquo;s details</h2>
      <div className="row" style={{ marginBottom: 18 }}>
        <label className="field" style={{ minWidth: 300 }}>
          <span className="field-label">Start from an example, then edit</span>
          <select defaultValue="" className="input" onChange={(e) => e.target.value && prefill(e.target.value)}>
            <option value="">Blank applicant…</option>
            {personas.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <button type="button" className="btn" onClick={() => setA(blankApplicant())}>
          Reset
        </button>
      </div>

      <Group title="Applicant and product">
        <div className="grid">
          <label className="field">
            <span className="field-label">Reference ID</span>
            <input value={a.applicant_id} className="input" onChange={(e) => set('applicant_id', e.target.value)} />
          </label>
          <Num label="Age (years)" value={a.applicant_age_years} min={18} max={100} onChange={(n) => set('applicant_age_years', n)} />
          <label className="field">
            <span className="field-label">Segment</span>
            <select value={a.segment} className="input" onChange={(e) => setSegment(e.target.value as Segment)}>
              <option value="A">A — Salaried</option>
              <option value="D">D — MSME</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Product <em className="field-hint">· set by segment</em></span>
            <input value={a.requested_product.replace(/_/g, ' ')} readOnly className="input" />
          </label>
        </div>
      </Group>

      <Group title="Credit bureau">
        <div className="grid">
          <label className="field">
            <span className="field-label">Bureau score <em className="field-hint">· 300–900</em></span>
            <input
              type="number" min={300} max={900} className="input"
              value={a.bureau_score ?? ''} placeholder="No bureau hit"
              onChange={(e) => set('bureau_score', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
          <Num label="Tradelines" value={a.num_tradelines} min={0} onChange={(n) => set('num_tradelines', n)} />
          <Num label="Credit history age (months)" value={a.credit_history_age_months} min={0} onChange={(n) => set('credit_history_age_months', n)} />
          <Num label="Live overdue (₹)" value={a.live_overdue_amount} min={0} hint="gate above 500" onChange={(n) => set('live_overdue_amount', n)} />
          <Num label="Max DPD in 12m" value={a.max_dpd_12m} min={0} hint="gate at 90+" onChange={(n) => set('max_dpd_12m', n)} />
          <Num label="Enquiries (30d)" value={a.num_enquiries_30d} min={0} onChange={(n) => set('num_enquiries_30d', n)} />
          <Num label="Distinct lenders (30d)" value={a.num_distinct_lenders_30d} min={0} hint="gate above 6" onChange={(n) => set('num_distinct_lenders_30d', n)} />
          <Num label="Utilisation now (%)" value={a.credit_utilization_pct_current} min={0} max={100} onChange={(n) => set('credit_utilization_pct_current', n)} />
          <Num label="Utilisation 3m ago (%)" value={a.credit_utilization_pct_3m_ago} min={0} max={100} onChange={(n) => set('credit_utilization_pct_3m_ago', n)} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <Bool label="Suit filed" value={a.suit_filed} onChange={(b) => set('suit_filed', b)} />
          <Bool label="Settlement in last 24m" value={a.settlement_last_24m} onChange={(b) => set('settlement_last_24m', b)} />
        </div>
      </Group>

      <Group title="Delinquency events">
        {a.delinquency_events.length === 0 && (
          <p style={{ fontSize: 12.5, color: '#666', margin: '0 0 10px' }}>No events recorded. Add one to see recency weighting change the score.</p>
        )}
        {a.delinquency_events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 8 }}>
            <Num
              label="Months ago" value={ev.months_ago} min={0}
              onChange={(n) => set('delinquency_events', a.delinquency_events.map((x, j) => j === i ? { ...x, months_ago: n } : x))}
            />
            <Num
              label="Days past due" value={ev.dpd} min={0}
              onChange={(n) => set('delinquency_events', a.delinquency_events.map((x, j) => j === i ? { ...x, dpd: n } : x))}
            />
            <button
              type="button" className="btn"
              onClick={() => set('delinquency_events', a.delinquency_events.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button" className="btn"
          onClick={() => set('delinquency_events', [...a.delinquency_events, { months_ago: 6, dpd: 30 }])}
        >
          Add event
        </button>
      </Group>

      <Group title="Banking conduct">
        <div className="grid">
          <Num label="Existing monthly obligations (₹)" value={a.existing_monthly_obligations} min={0} onChange={(n) => set('existing_monthly_obligations', n)} />
          <Num label="Avg monthly inflow, 6m (₹)" value={a.avg_monthly_bank_inflow_6m} min={0} onChange={(n) => set('avg_monthly_bank_inflow_6m', n)} />
          <Num label="Inflow volatility (%)" value={a.bank_inflow_volatility_pct} min={0} onChange={(n) => set('bank_inflow_volatility_pct', n)} />
          <Num label="Insufficient-funds bounces (6m)" value={a.insufficient_funds_bounce_count_6m} min={0} hint="only these are scored" onChange={(n) => set('insufficient_funds_bounce_count_6m', n)} />
          <Num label="Technical bounces (6m)" value={a.technical_bounce_count_6m} min={0} hint="not scored" onChange={(n) => set('technical_bounce_count_6m', n)} />
          <Num label="Signature-mismatch bounces (6m)" value={a.signature_mismatch_bounce_count_6m} min={0} hint="not scored" onChange={(n) => set('signature_mismatch_bounce_count_6m', n)} />
        </div>
      </Group>

      {a.segment === 'A' ? (
        <Group title="Employment — Segment A">
          <div className="grid">
            <Num
              label="EPFO vintage (months)" value={a.epfo_employment_vintage_months ?? 0} min={0} hint="gate under 12"
              onChange={(n) => set('epfo_employment_vintage_months', n)}
            />
            <Select
              label="Employer category" value={a.employer_category ?? 'mid_size'} options={EMPLOYER_CATEGORIES}
              onChange={(v) => set('employer_category', v)}
            />
            <Num
              label="Avg monthly salary credit (₹)" value={a.salary_inflow_profile?.avg_monthly_credit ?? 0} min={0}
              onChange={(n) => set('salary_inflow_profile', { avg_monthly_credit: n, stability_pct: a.salary_inflow_profile?.stability_pct ?? 95 })}
            />
            <Num
              label="Salary stability (%)" value={a.salary_inflow_profile?.stability_pct ?? 0} min={0} max={100}
              onChange={(n) => set('salary_inflow_profile', { avg_monthly_credit: a.salary_inflow_profile?.avg_monthly_credit ?? 0, stability_pct: n })}
            />
          </div>
        </Group>
      ) : (
        <Group title="Business — Segment D">
          <div className="grid">
            <Num
              label="GST vintage (months)" value={a.gst_registration_vintage_months ?? 0} min={0} hint="gate under 24"
              onChange={(n) => set('gst_registration_vintage_months', n)}
            />
            <Num
              label="Late GST filings (of 12)" value={a.gst_filing_profile?.late_filings_12m ?? 0} min={0} max={12} hint="heaviest D factor"
              onChange={(n) => set('gst_filing_profile', { late_filings_12m: n, total_filings_12m: a.gst_filing_profile?.total_filings_12m ?? 12 })}
            />
            <Num
              label="Total GST filings (of 12)" value={a.gst_filing_profile?.total_filings_12m ?? 12} min={0} max={12}
              onChange={(n) => set('gst_filing_profile', { late_filings_12m: a.gst_filing_profile?.late_filings_12m ?? 0, total_filings_12m: n })}
            />
            <Num
              label="Declared annual turnover (₹)" value={a.declared_annual_turnover ?? 0} min={0} hint="not scored"
              onChange={(n) => set('declared_annual_turnover', n)}
            />
            <Num
              label="Avg monthly business inflow (₹)" value={a.business_inflow_profile?.avg_monthly_inflow ?? 0} min={0}
              onChange={(n) => set('business_inflow_profile', { avg_monthly_inflow: n, volatility_pct: a.business_inflow_profile?.volatility_pct ?? 15 })}
            />
            <Num
              label="Business inflow volatility (%)" value={a.business_inflow_profile?.volatility_pct ?? 0} min={0}
              onChange={(n) => set('business_inflow_profile', { avg_monthly_inflow: a.business_inflow_profile?.avg_monthly_inflow ?? 0, volatility_pct: n })}
            />
          </div>
        </Group>
      )}

      <Group title="Loan request">
        <div className="grid">
          <Num label="Requested amount (₹)" value={a.requested_amount} min={1} onChange={(n) => set('requested_amount', n)} />
          <Num label="Tenure (months)" value={a.requested_tenure_months} min={1} hint="age + tenure must stay under 60y" onChange={(n) => set('requested_tenure_months', n)} />
          <Select label="Purpose" value={a.loan_purpose} options={LOAN_PURPOSES} onChange={(v) => set('loan_purpose', v)} />
        </div>
      </Group>

      <button
        type="submit" disabled={submitting}
        className="btn btn-primary"
      >
        {submitting ? 'Evaluating…' : 'Evaluate applicant'}
      </button>
    </form>
  );
}
