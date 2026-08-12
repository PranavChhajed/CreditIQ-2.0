import type { RawApplicant, FeatureVector } from '@creditiq/shared';
import { deriveFeatures } from './derive.js';

/** Mock ingestion (v1). In v2 this is the ONLY layer replaced by live bureau/AA/GSTN/EPFO calls (spec §1, §3). */
export function ingest(raw: RawApplicant): FeatureVector {
  return { ...raw, ...deriveFeatures(raw) };
}
