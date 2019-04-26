"use strict";

import { getPlatform } from '@react-ameliorate/utils';

export const Platform = {};

Object.defineProperties(Platform, {
  'OS': {
    enumerable: true,
    configurable: true,
    get: () => getPlatform(),
    set: () => {}
  }
});
