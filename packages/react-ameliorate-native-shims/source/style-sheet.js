"use strict";

import { flattenStyle } from './shim-utils';

export const StyleSheet = new (class StyleSheetPolyfill {
  constructor() {}

  create(sheet) {
    return sheet;
  }

  flatten(sheet) {
    return flattenStyle(sheet);
  }
})();
