import { registerPlugin } from '@capacitor/core';

import type { PinwheelPlugin } from './definitions';
import { PinwheelWeb } from './web';

const Pinwheel = registerPlugin<PinwheelPlugin>('Pinwheel', {
  web: () => new PinwheelWeb(),
});

export * from './definitions';
export { Pinwheel };
