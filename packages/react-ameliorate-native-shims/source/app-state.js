"use strict";

export const AppState = new (class AppStatePolyfill {
  constructor() {
    window.addEventListener('beforeunload', (event) => {
      var listeners = this._listeners;
      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];
        listener.callback('background');
      }

      if (!global._raAppHasPendingChanges || !global._raAppHasPendingChanges.length)
        return;

      global._raAppHasPendingChanges.forEach((obj) => {
        if (obj && typeof obj.onBeforeUnload === 'function')
          obj.onBeforeUnload(obj);
      });

      var dialogText = 'Changes in progress may not be saved. Are you sure you wish to leave this site?';
      event.returnValue = dialogText;
      return dialogText;
    }, true);

    Object.defineProperty(this, '_listeners', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: []
    });
  }

  addEventListener(name, callback) {
    this._listeners.push({
      name,
      callback
    });
  }

  removeEventListener(name, callback) {
    var index = this._listeners.findIndex((listener) => (listener.name === name && listener.callback === callback));
    if (index >= 0)
      this._listeners.splice(index, 1);
  }
})();

