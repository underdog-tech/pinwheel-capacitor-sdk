import { registerPlugin } from '@capacitor/core';

import type { PinwheelOpenOptions, PinwheelPlugin } from './definitions';
import { PINWHEEL_CAPACITOR_WRAPPER_VERSION } from './version';
import { PinwheelWeb } from './web';

const RawPinwheel = registerPlugin<PinwheelPlugin>('Pinwheel', {
  web: () => new PinwheelWeb(),
});

// Always forward the bundled wrapper version (sourced from package.json via
// scripts/write-version.mjs) so Pinwheel Link receives the published Capacitor
// wrapper version even if the caller forgets to pass `sdkVersion`.
// A caller-supplied value still wins.
const open = (options: PinwheelOpenOptions): Promise<void> =>
  RawPinwheel.open({
    sdkVersion: PINWHEEL_CAPACITOR_WRAPPER_VERSION,
    ...options,
  });

export const Pinwheel: PinwheelPlugin = new Proxy(RawPinwheel, {
  get(target, prop, receiver) {
    if (prop === 'open') return open;
    return Reflect.get(target, prop, receiver);
  },
});

export * from './definitions';
export { PINWHEEL_CAPACITOR_WRAPPER_VERSION };
