import { useSyncExternalStore } from 'react';
import { getDraft, subscribe } from './draftStore';

export function useOnboardingDraft() {
  return useSyncExternalStore(subscribe, getDraft, getDraft);
}
