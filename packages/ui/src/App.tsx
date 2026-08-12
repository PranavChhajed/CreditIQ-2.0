import { useState } from 'react';
import type { Decision, RawApplicant } from '@creditiq/shared';
import { PersonaPicker } from './components/PersonaPicker.js';
import { ApplicantForm } from './components/ApplicantForm.js';
import { DecisionPanel } from './components/DecisionPanel.js';
import { ReasonCodesList } from './components/ReasonCodesList.js';
import { WaterfallTrace } from './components/WaterfallTrace.js';
import { MonitoringPanel } from './components/MonitoringPanel.js';
import { OverridePanel } from './components/OverridePanel.js';
import { submitDecision, evaluateApplicant } from './api.js';

type Tab = 'underwriter' | 'evaluate' | 'monitoring';

export default function App() {
  const [tab, setTab] = useState<Tab>('underwriter');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Both entry points land here: a stored fixture, or a hand-entered applicant. */
  async function run(fetcher: () => Promise<Decision>) {
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      setDecision(await fetcher());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not evaluate this applicant.');
    } finally {
      setLoading(false);
    }
  }

  function switchTab(next: Tab) {
    setTab(next);
    setDecision(null);
    setError(null);
  }

  const result = (
    <>
      {loading && <p className="notice">Evaluating application…</p>}
      {error && <p className="notice error">{error}</p>}
      {decision && !loading && !error && (
        <div className="stack">
          <DecisionPanel decision={decision} />
          <ReasonCodesList decision={decision} />
          <WaterfallTrace decision={decision} />
          <OverridePanel decision={decision} />
        </div>
      )}
    </>
  );

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="wordmark">
          CREDITIQ
          <span>Segment-specific underwriting · every decision auditable</span>
        </h1>
        <nav className="tabs">
          <button disabled={tab === 'underwriter'} onClick={() => switchTab('underwriter')}>Example applicants</button>
          <button disabled={tab === 'evaluate'} onClick={() => switchTab('evaluate')}>Enter an applicant</button>
          <button disabled={tab === 'monitoring'} onClick={() => switchTab('monitoring')}>Monitoring</button>
        </nav>
      </header>

      {tab === 'underwriter' && (
        <>
          <PersonaPicker onSelect={(id) => run(() => submitDecision(id))} />
          {result}
        </>
      )}

      {tab === 'evaluate' && (
        <>
          <ApplicantForm
            submitting={loading}
            onEvaluate={(raw: RawApplicant) => run(() => evaluateApplicant(raw))}
          />
          {result}
        </>
      )}

      {tab === 'monitoring' && <MonitoringPanel />}
    </main>
  );
}
