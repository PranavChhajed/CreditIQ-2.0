import { useState } from 'react';
import { PersonaPicker } from './components/PersonaPicker.js';
import { DecisionPanel } from './components/DecisionPanel.js';
import { ReasonCodesList } from './components/ReasonCodesList.js';
import { WaterfallTrace } from './components/WaterfallTrace.js';
import { submitDecision } from './api.js';

export default function App() {
  const [decision, setDecision] = useState<any>(null);

  async function handleSelect(id: string) {
    const result = await submitDecision(id);
    setDecision(result);
  }

  return (
    <main>
      <h1>CreditIQ — Underwriter</h1>
      <PersonaPicker onSelect={handleSelect} />
      {decision && (
        <>
          <DecisionPanel decision={decision} />
          <ReasonCodesList decision={decision} />
          <WaterfallTrace decision={decision} />
        </>
      )}
    </main>
  );
}
