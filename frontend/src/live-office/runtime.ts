// Boots the live office runtime: the host bridge, the agent activity loop and the
// task ledger. Returns a disposer so React effects can tear everything down (no
// timers survive unmount).
//
// Two modes:
//  - simulated (default): a synthetic event stream + mock ledger keep the floor moving
//    with no backend. Good for demos and UI work.
//  - live (NEXT_PUBLIC_LIVE_BACKEND=true): the floor reflects the Airstream backend's
//    real task ledger and WebSocket events; the simulation stays off.

import './i18n';
import { LIVE_BACKEND } from '@/lib/airstream/config';
import { installHostBridge } from './bridge/initCth';
import { startLiveLedger } from './bridge/liveLedger';
import { startMockLedger, stopMockLedger } from './bridge/mockLedger';
import { startMockLoop, stopMockLoop } from './store/mockEvents';

export function startLiveOffice(): () => void {
  installHostBridge();

  if (LIVE_BACKEND) return startLiveLedger();

  startMockLedger();
  startMockLoop();
  return () => {
    stopMockLoop();
    stopMockLedger();
  };
}
