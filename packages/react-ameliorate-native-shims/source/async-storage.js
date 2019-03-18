"use strict";

export const AsyncStorage = new (class AsyncStoragePolyfill {
  constructor() {}

  getItem(key, cb, _type) {
    var type = (_type) ? (_type + 'Storage') : 'localStorage';
    return new Promise(function(resolve, reject) {
      try {
        var val = window[type][key];

        if (typeof cb === 'function')
          cb(null, val);

        resolve(val);
      } catch (e) {
        if (typeof cb === 'function')
          cb(e, null);

        reject(e);
      }
    });
  }

  setItem(key, val, cb, _type) {
    var type = (_type) ? (_type + 'Storage') : 'localStorage';
    return new Promise(function(resolve, reject) {
      try {
        if (val === undefined)
          delete window[type][key];
        else
          window[type][key] = val;

        if (typeof cb === 'function')
          cb(null);

        resolve();
      } catch (e) {
        if (typeof cb === 'function')
          cb(e);

        reject(e);
      }
    });
  }

  removeItem(key, cb, _type) {
    return this.setItem(key, undefined, cb, _type);
  }

  clear(cb, _type) {
    var type = (_type) ? (_type + 'Storage') : 'localStorage';
    return new Promise(function(resolve, reject) {
      try {
        var keys = Object.keys(window.localStorage);
        for (var i = 0, il = keys.length; i < il; i++) {
          var key = keys[i];
          delete window[type][key];
        }

        if (typeof cb === 'function')
          cb(null);

        resolve();
      } catch (e) {
        if (typeof cb === 'function')
          cb(e);

        reject(e);
      }
    });
  }
})();
