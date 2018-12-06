import React                          from 'react';
import {
  areObjectsEqualShallow,
  copyPrototypeFuncs,
  RAContext
}                                     from './utils';

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
      },
      '_providedContext': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      }
    });

    instance._construct();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const handleUpdate = () => {
      // Props have changed... update componentInstance
      var propsDiffer = !areObjectsEqualShallow(nextProps, this.props),
          statesDiffer = !areObjectsEqualShallow(nextState, this.state);

      if (!propsDiffer && !statesDiffer)
        return false;

      if (propsDiffer)
        this._propUpdateCounter++;

      if (statesDiffer)
        this._stateUpdateCounter++;

      return this._componentInstance._invokeResolveState(propsDiffer, statesDiffer, false, nextProps, this.props);
    };

    var shouldUpdate = handleUpdate(),
        shouldUserUpdate = this._componentInstance.shouldComponentUpdate.apply(this._componentInstance, arguments);

    return (shouldUserUpdate === false || shouldUserUpdate === true) ? shouldUserUpdate : shouldUpdate;
  }

  componentDidMount() {
    this._mounted = true;
    this._componentInstance._raIsMounted = true;
    this._componentInstance._invokeComponentDidMount();
  }

  componentWillUnmount() {
    this._componentInstance._invokeComponentWillUnmount();
    this._componentInstance._raIsMounted = false;
    this._mounted = false;
  }

  // The context object reference must stay the same or React
  // will continually re-render the component tree.
  // So instead of delivering a new object we clear out the same
  // object and add the new context keys to it
  _getComponentContext() {
    var baseContext = this._componentInstance.context,
        instanceProvidedContext = this._componentInstance.provideContext() || {},
        providedContext = this._providedContext,
        keys = Object.keys(providedContext);

    // Clear the context object
    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      delete providedContext[key];
    }

    Object.assign(providedContext, baseContext, instanceProvidedContext);
    return providedContext;
  }

  render() {
    const doRender = () => {
      this._componentInstance._invalidateRenderCache();
      var elements = this._componentInstance._renderInterceptor(renderID);

      if (typeof this._componentInstance.provideContext === 'function') {
        return (
          <RAContext.Provider value={this._getComponentContext()}>
            {elements}
          </RAContext.Provider>
        );
      } else {
        return elements;
      }
    };

    var renderID = `${this._propUpdateCounter}/${this._stateUpdateCounter}`,
        elems = doRender();

    this._componentInstance._raPreviousRenderID = renderID;
    this._renderCount++;

    return elems;
  }
}
