import React from 'react';
import {
  bindPrototypeFuncs
} from './utils';

export default class ReactComponentBase extends React.Component {
  constructor(...args) {
    var InstanceClass = args[args.length - 1];
    if (typeof InstanceClass !== 'function')
      throw new TypeError('ReactComponentBase expected a class/function as the last constructor argument but didn\'t receive one');

    super(...args);

    var instance = new InstanceClass();
    bindPrototypeFuncs.call(instance, InstanceClass.prototype);
  }
}
