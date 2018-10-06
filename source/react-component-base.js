import React                                          from 'react';
import { areObjectsEqualShallow, bindPrototypeFuncs } from './utils';

const ComponentContext = React.createContext(() => {
  return {};
});

export default class ReactComponentBase extends React.Component {
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

    var instance = new InstanceClass(props, this),
        state = this.state = {};

    bindPrototypeFuncs.call(instance, InstanceClass.prototype, instance);
    bindPrototypeFuncs.call(instance, InstanceClass.prototype, this, (...args) => {
      if (typeof this.constructor.proxyComponentInstanceMethod === 'function')
        return this.constructor.proxyComponentInstanceMethod(...args);

      return true;
    });

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
      },
      '_cachedPropUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_cachedStateUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      }
    });

    var context;
    this._getContext((_context) => {
      context = _context;
    });

    instance._construct(InstanceClass, instance, props, state, context);
  }

  shouldComponentUpdate(prevProps, prevState) {
    // Props have changed... update componentInstance
    var propsDiffer = !areObjectsEqualShallow(prevProps, this.props),
        statesDiffer = !areObjectsEqualShallow(prevState, this.state);

    if (!propsDiffer && !statesDiffer)
      return false;

    if (propsDiffer)
      this._propUpdateCounter++;

    if (statesDiffer)
      this._stateUpdateCounter++;

    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    var propsDiffer = (this._propUpdateCounter !== this._cachedPropUpdateCounter),
        statesDiffer = (this._stateUpdateCounter !== this._cachedStateUpdateCounter);

    if (propsDiffer) {
      this._cachedPropUpdateCounter = this._propUpdateCounter;
      this._componentInstance._invokeResolveState(this.props, this.state, prevProps, prevState);
    }

    if (statesDiffer) {
      this._cachedStateUpdateCounter = this._stateUpdateCounter;
    }
  }

  componentDidMount() {
    this._mounted = true;
    this._componentInstance._invokeComponentDidMount();
  }

  componentWillUnmount() {
    this._mounted = false;
    this._componentInstance._invokeComponentWillUnmount();
  }

  _getContext(callback) {
    return React.createElement(ComponentContext.Consumer, {}, (contextFunc) => {
      var context = contextFunc(this._componentInstance) || {};
      return callback.call(this, context);
    });
  }

  _setContext(context) {
    var currentContext = this._componentInstance._getContext();
    if (areObjectsEqualShallow(context, currentContext))
      return false;

    this._componentInstance._setContext(context);

    return true;
  }

  _provideContext(children, _context) {
    if (!('provideContext' in this._componentInstance))
      return children;

    var context = _context || {};
    return React.createElement(ComponentContext.Provider, { value: (instance) => {
      return Object.assign({}, context, this._componentInstance.provideContext(instance));
    }}, children);
  }

  _captureContext(renderID) {
    return this._getContext((context) => {
      this._setContext(context);

      var children = this._componentInstance._renderInterceptor(renderID);
      return this._provideContext((children === undefined) ? null : children, context);
    });
  }

  render() {
    var renderID = `${this._propUpdateCounter}/${this._stateUpdateCounter}`,
        elems = this._captureContext(renderID);

    this._componentInstance._previousRenderID = renderID;
    this._renderCount++;

    return elems;
  }
}
