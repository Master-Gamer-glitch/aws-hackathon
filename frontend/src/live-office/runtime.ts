// Boots the office runtime for one of its two modes.
//
//  - DEMO ("See how it works"): a synthetic event stream and a mock task ledger keep the floor
//    moving with no backend, so anyone can see what the product does. Nothing here is real.
//  - LIVE: nothing is simulated. The floor shows the real devices, tasks and events of a backend
//    room; see components/office/live/ for that side.
//
// Both return a disposer so React effects can tear everything down (no timers survive unmount).

import './i18n';
import { installHostBridge } from './bridge/initCth';
import { startMockLedger, stopMockLedger } from './bridge/mockLedger';
import { startMockLoop, stopMockLoop } from './store/mockEvents';

/** Simulated office (demo tab). */
export function startDemoOffice(): () => void {
  installHostBridge();
  startMockLedger();
  startMockLoop();
  return () => {
    stopMockLoop();
    stopMockLedger();
  };
}

/** Real office (live tab): only the bridge the scene needs. No simulation is started. */
export function startLiveRuntime(): void {
  installHostBridge();
}
