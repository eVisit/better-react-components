import React                          from 'react';
import {
  areObjectsEqualShallow,
  copyPrototypeFuncs
}                                     from './utils';

const RAContext = React.createContext({});

export default class ReactComponentBase extends React.Component {
  static contextType = RAContext;

  static proxyComponentInstanceMethod(propName) {
    if (propName in React.Component.prototype)
      return false;

    if (propName in ReactComponentBase.prototype)
      return false;

    return !(/^(componentWillMount|componentDidMount|componentWillUnmount|componentWillReceiveProps|shouldComponentUpdate|componentWillUpdate|render|componentDidUpdate|componentDidCatch|constructor|construct|getMountState|measure)$/).test(propName);
  }

  constructor(InstanceClass, props, ...args) {
    if (typeof InstanceClass !== 'function')
      throw new TypeError('ReactComponentBase expected a class/function as the last constructor argument but didn\'t receive one');

    super(props, ...args);
    this.state = {};

    var instance = new InstanceClass(props, this);

    copyPrototypeFuncs.call(instance, InstanceClass.prototype, instance, undefined, true);
    copyPrototypeFuncs.call(instance, InstanceClass.prototype, this, (...args) => {
      if (typeof this.constructor.proxyComponentInstanceMethod === 'function')
        return this.constructor.proxyComponentInstanceMethod(...args);

      return true;
    }, true);

    Object.defineProperties(this, {
      '_renderCount': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_componentInstance': {
        enumerable: false,
        configurable: true,
        get: () => instance,
        set: () => {}
      },
      '_mounted': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: false
      },
      '_propUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_stateUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      }
    });

    instance._construct();
  }

  _updateInstanceProps(newProps, newState) {
    this._propUpdateCounter++;
    this._componentInstance._invokeResolveState(false, newProps, this.props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Props have changed... update componentInstance
    var propsDiffer = !areObjectsEqualShallow(nextProps, this.props),
        statesDiffer = !areObjectsEqualShallow(nextState, this.state);

    if (!propsDiffer && !statesDiffer)
      return false;

    if (propsDiffer)
      this._updateInstanceProps(nextProps, nextState);

    if (statesDiffer)
      this._stateUpdateCounter++;

    return true;
  }

  componentDidMount() {
    this._mounted = true;
    this._componentInstance._invokeComponentDidMount();
  }

  componentWillUnmount() {
    this._mounted = false;
    this._componentInstance._invokeComponentWillUnmount();
  }

  render() {
    const doRender = () => {
      this._componentInstance._invalidateRenderCache();
      var elements = this._componentInstance._renderInterceptor(renderID);

      if (typeof this._componentInstance.provideContext === 'function') {
        return (
          <RAContext.Provider value={this._componentInstance.provideContext()}>
            {elements}
          </RAContext.Provider>
        );
      } else {
        return elements;
      }
    };

    var renderID = `${this._propUpdateCounter}/${this._stateUpdateCounter}`,
        elems = doRender();

    this._componentInstance._previousRenderID = renderID;
    this._renderCount++;

    return elems;
  }
}
