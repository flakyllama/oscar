import { useSyncExternalStore } from 'react';
import { getStore, type StoreState } from './store';

export function useStoreState(): StoreState {
  const store = getStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
