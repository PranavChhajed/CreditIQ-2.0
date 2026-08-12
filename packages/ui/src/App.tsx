import { useState } from 'react';
import type { Decision } from '@creditiq/shared';
import { PersonaPicker } from './components/PersonaPicker.js';
import { DecisionPanel } from './components/DecisionPanel.js';
import { ReasonCodesList } from './components/ReasonCodesList.js';
import { WaterfallTrace } from './components/WaterfallTrace.js';
import { MonitoringPanel } from './components/MonitoringPanel.js';
import { OverridePanel } from './components/OverridePanel.js';
import { submitDecision } from './api.js';

export default function App() {
  const [tab, setTab] = useState<'underwriter' | 'monitoring'>('underwriter');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(id: string) {
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      const result = await submitDecision(id);
      setDecision(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>CreditIQ</h1>
      <nav>
        <button disabled={tab === 'underwriter'} onClick={() => setTab('underwriter')}>Underwriter</button>{' '}
        <button disabled={tab === 'monitoring'} onClick={() => setTab('monitoring')}>Monitoring</button>
      </nav>

      {tab === 'underwriter' && (
        <>
          <PersonaPicker onSelect={handleSelect} />
          {loading && <p>Evaluating application…</p>}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          {decision && !loading && !error && (
            <>
              <DecisionPanel decision={decision} />
              <ReasonCodesList decision={decision} />
              <WaterfallTrace decision={decision} />
              <OverridePanel decision={decision} />
            </>
          )}
        </>
      )}

      {tab === 'monitoring' && <MonitoringPanel />}
    </main>
  );
}
