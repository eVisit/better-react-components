"use strict";

export const InteractionManager = new (class InteractionManagerPolyfill {
  constructor() {}

  runAfterInteractions(cb) {
    setTimeout(cb, 1);
  }

  createInteractionHandle() {
    return {};
  }

  clearInteractionHandle() {
  }

  setDeadline() {}
})();
