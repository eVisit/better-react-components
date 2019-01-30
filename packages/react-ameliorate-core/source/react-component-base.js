import {
  areObjectsEqualShallow,
  copyPrototypeFuncs,
  RAContext,
  calculateObjectDifferences
}                                     from '@react-ameliorate/utils';

import React                          from 'react';

export default class ReactComponentBase extends React.Component {
  static proxyComponentInstanceMethod(propName) {
    if (propName in React.Component.prototype)
      return false;

    if (propName in ReactComponentBase.prototype)
      return false;

    return !(/^(UNSAFE_|componentWillMount$|componentDidMount$|componentWillUnmount$|componentWillReceiveProps$|shouldComponentUpdate$|componentWillUpdate$|render$|componentDidUpdate$|componentDidCatch$|constructor$|construct$|getMountState$|measure$)/).test(propName);
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

      if (this.constructor._raDebugRenders) {
        if (propsDiffer !== statesDiffer) {
          var diff = (propsDiffer) ? calculateObjectDifferences(nextProps, this.props, null, 1) : calculateObjectDifferences(nextState, this.state, null, 1),
              whichDiffers = (propsDiffer) ? 'props' : 'state';

          console.log(`----> ${this.constructor.displayName}: Rendering because of ${whichDiffers} updates: `, [ diff, (whichDiffers === 'props') ? nextProps : nextState, (whichDiffers === 'props') ? this.props : this.state ]);
        } else {
          console.log(`----> ${this.constructor.displayName}: Rendering because of props and state updates: `, [ calculateObjectDifferences(nextProps, this.props, null, 1), nextProps, this.props ], [ calculateObjectDifferences(nextState, this.state, null, 1), nextState, this.state ]);
        }
      }

      if (propsDiffer)
        this._propUpdateCounter++;

      if (statesDiffer)
        this._stateUpdateCounter++;

      return this._componentInstance._invokeResolveState.call(this._componentInstance, propsDiffer, statesDiffer, false, nextProps);
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
    var contextProvider = this._componentInstance.provideContext,
        baseContext = this._componentInstance.context,
        providedContext = this._providedContext,
        instanceProvidedContext = (typeof contextProvider === 'function') ? Object.assign({}, baseContext, contextProvider.call(this._componentInstance) || {}) : null;

    if (instanceProvidedContext && !areObjectsEqualShallow(instanceProvidedContext, providedContext))
      this._providedContext = providedContext = Object.assign({}, baseContext, instanceProvidedContext);

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
