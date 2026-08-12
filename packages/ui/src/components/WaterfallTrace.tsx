import { useState } from 'react';

export function WaterfallTrace({ decision }: { decision: any }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : 'Show'} waterfall trace ({decision.trace.length} steps)
      </button>
      {open && (
        <ol>
          {decision.trace.map((step: any) => (
            <li key={step.step}>
              <strong>{step.stage}</strong> — {step.outcome}
              <pre>{JSON.stringify(step.detail, null, 2)}</pre>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
