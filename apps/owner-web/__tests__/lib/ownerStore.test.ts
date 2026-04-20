import {
  clearOwnerStore,
  declareTemporaryUnlock,
  finalizeUnlock,
  getMarkerEntry,
  setEligibleFinalAtInPast,
} from '../../lib/owner/store';

describe('owner marker store', () => {
  beforeEach(() => {
    clearOwnerStore();
  });

  it('shares marker state across temporary and final unlock operations', () => {
    const code = 'ABC123';

    const declaration = declareTemporaryUnlock(code);
    expect(declaration.status).toBe('temporary');
    expect(getMarkerEntry(code).report.status).toBe('temporary');

    setEligibleFinalAtInPast(code);
    const result = finalizeUnlock(code);

    expect(result.status).toBe('resolved');
    expect(getMarkerEntry(code).report.status).toBe('resolved');
    expect(getMarkerEntry(code).declaration?.status).toBe('finalized');
  });
});
