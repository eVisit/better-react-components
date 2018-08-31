import React from 'react';
import {
  bindPrototypeFuncs,
  areObjectsEqualShallow
} from './utils';

export default class ReactComponentBase extends React.Component {
  constructor(InstanceClass, ...args) {
    if (typeof InstanceClass !== 'function')
      throw new TypeError('ReactComponentBase expected a class/function as the last constructor argument but didn\'t receive one');

    super(...args);

    var instance = new InstanceClass(this);
    bindPrototypeFuncs.call(instance, InstanceClass.prototype);

    Object.defineProperties(this, {
      '_componentInstance': {
        enumerable: false,
        configurable: true,
        get: () => instance,
        set: () => {}
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // Props have changed... update componentInstance
    var propsDiffer = !areObjectsEqualShallow(prevProps, this.props),
        statesDiffer = !areObjectsEqualShallow(prevState, this.state);

    if (propsDiffer || statesDiffer)
      this._componentInstance._initiateResolveState(prevProps, prevState, propsDiffer, statesDiffer);
  }

  render() {
    return this._componentInstance._renderInterceptor();
  }
}
