"use strict";

export const Linking = new (class LinkingPolyfill {
  constructor() {}

  addEventListener(listener) {
    // TODO: Add back event handler
  }

  removeEventListener(listener) {
    // TODO: Add back event handler
  }

  async getInitialURL() {
    if (typeof window === 'undefined')
      return '';

    if (!window.location || !window.location.href)
      return '';

    return window.location.href;
  }

  openURL(url) {
    window.open(url, '_blank');
  }

  canOpenURL() {
    return true;
  }
})();
