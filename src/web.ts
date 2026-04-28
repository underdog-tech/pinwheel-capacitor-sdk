import { WebPlugin } from '@capacitor/core';

import type { PinwheelOpenOptions, PinwheelPlugin } from './definitions';

const WEB_ERROR =
  'This package is for iOS and Android only. ' +
  'For web apps use the Web SDK (https://docs.pinwheelapi.com/public/docs/web) ' +
  'or the React SDK (https://docs.pinwheelapi.com/public/docs/react).';

export class PinwheelWeb extends WebPlugin implements PinwheelPlugin {
  async open(_options: PinwheelOpenOptions): Promise<void> {
    void _options;
    throw new Error(WEB_ERROR);
  }

  async close(): Promise<void> {
    throw new Error(WEB_ERROR);
  }
}
