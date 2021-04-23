import {
  areObjectsEqualShallow,
  copyPrototypeFuncs,
  RAContext,
  calculateObjectDifferences
}                                     from '@react-ameliorate/utils';

import React                          from 'react';

function getContextObject(context) {
  Object.defineProperty(context, 'toString', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: () => ''
  });

  return context;
}

function doRender() {
  try {
    this._componentInstance._isRendering(true);

    var elements = this._componentInstance._doComponentRender(this._propUpdateCounter, this._stateUpdateCounter);

    if (typeof this._componentInstance.provideContext === 'function') {
      return (
        <RAContext.Provider value={this._getComponentContext()}>
          {elements}
        </RAContext.Provider>
      );
    } else {
      return elements;
    }
  } catch (e) {
    throw e;
  } finally {
    this._componentInstance._isRendering(false);
  }
}

export default class ReactComponentBase extends React.Component {
  static proxyComponentInstanceMethod(propName) {
    if (propName in React.Component.prototype)
      return false;

    if (propName in ReactComponentBase.prototype)
      return false;

    return !(/^(UNSAFE_|componentWillMount$|componentDidMount$|componentWillUnmount$|componentWillReceiveProps$|shouldComponentUpdate$|render$|componentWillUpdate$|componentDidUpdate$|componentDidCatch$|constructor$|construct$|getMountState$|measure$)/).test(propName);
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
        value: getContextObject({})
      }
    });

    instance._construct();
  }

  getComponentInstance() {
    return this._componentInstance;
  }

  // alias for React setState
  __setState() {
    return super.setState.apply(this, arguments);
  }

  // alias for React forceUpdate
  __forceUpdate() {
    return super.forceUpdate.apply(this, arguments);
  }

  setState() {
    return this._componentInstance.setState.apply(this._componentInstance, arguments);
  }

  forceUpdate() {
    return this._componentInstance.forceUpdate.apply(this._componentInstance, arguments);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const handleUpdate = () => {
      // Props have changed... update componentInstance
      var propsDiffer = !areObjectsEqualShallow(nextProps, this.props),
          statesDiffer = (this._componentInstance._raStateUpdateCounter > this._stateUpdateCounter);

      if (!propsDiffer && !statesDiffer)
        return false;

      if (__DEV__ && shouldUpdateUser !== false && shouldDebugRender) {
        if (propsDiffer !== statesDiffer) {
          var diff = (propsDiffer) ? calculateObjectDifferences(nextProps, this.props, null, 1) : calculateObjectDifferences(nextState, this.state, null, 1),
              whichDiffers = (propsDiffer) ? 'props' : 'state';

          console.log(`----> ${componentName}${debugRenderGroup}: Rendering because of ${whichDiffers} updates: `, [ diff, (whichDiffers === 'props') ? nextProps : nextState, (whichDiffers === 'props') ? this.props : this.state ]);
        } else {
          console.log(`----> ${componentName}${debugRenderGroup}: Rendering because of props and state updates: `, [ calculateObjectDifferences(nextProps, this.props, null, 1), nextProps, this.props ], [ calculateObjectDifferences(nextState, this.state, null, 1), nextState, this.state ]);
        }
      }

      if (propsDiffer) {
        this._propUpdateCounter++;
        this._componentInstance._invalidateRenderCache();
      }

      if (statesDiffer)
        this._stateUpdateCounter = this._componentInstance._raStateUpdateCounter;

      var shouldUpdate = this._componentInstance._invokeResolveState.call(this._componentInstance, propsDiffer, statesDiffer, false, nextProps);

      if (!shouldUpdate && this._stateUpdateCounter < this._componentInstance._raStateUpdateCounter) {
        this._stateUpdateCounter = this._componentInstance._raStateUpdateCounter;
        shouldUpdate = true;

        if (__DEV__ && shouldUpdateUser !== false && shouldDebugRender) {
          var diff = calculateObjectDifferences(nextState, this.state, null, 1);
          console.log(`----> ${componentName}${debugRenderGroup}: Rendering because of state updates: `, [ diff, nextState, this.state ]);
        }
      }

      if (__DEV__ && !shouldUpdate && shouldUpdateUser !== false && shouldDebugRender) {
        console.log(`----> ${componentName}${debugRenderGroup}: NOT rendering because component state and props are the same`);
      }

      return shouldUpdate;
    };

    var shouldUpdateUser = this._componentInstance.shouldComponentUpdate.call(this._componentInstance, nextProps, nextState),
        shouldUpdate,
        { shouldDebugRender, debugRenderGroup, componentName } = this._componentInstance._shouldDebugRender(nextProps, nextState);

    if (__DEV__ && shouldDebugRender && shouldUpdateUser === false) {
      console.log(`----> ${componentName}${debugRenderGroup}: NOT rendering because component returned 'false' from 'shouldComponentUpdate' method!`);
    }

    shouldUpdate = handleUpdate();

    if (shouldUpdateUser === true || shouldUpdateUser === false)
      return shouldUpdateUser;

    return shouldUpdate;
  }

  componentDidMount() {
    this._mounted = true;
    this._componentInstance._invokeComponentDidMount();
  }

  componentWillUnmount() {
    this._mounted = false;
    this._componentInstance._invokeComponentWillUnmount();
  }

  componentDidUpdate(...args) {
    return this._componentInstance._invokeComponentDidUpdate(...args);
  }

  componentDidCatch(...args) {
    return this._componentInstance._invokeComponentDidCatch(...args);
  }

  // The context object reference must stay the same or React
  // will continually re-render the component tree.
  // So instead of delivering a new object we clear out the same
  // object and add the new context keys to it
  _getComponentContext() {
    var contextProvider = this._componentInstance.provideContext,
        baseContext = this._componentInstance.context,
        providedContext = this._providedContext,
        instanceProvidedContext = null;

    if (typeof contextProvider === 'function') {
      instanceProvidedContext = Object.assign({}, baseContext, contextProvider.call(this._componentInstance) || {});
      if (instanceProvidedContext._raDebugRenders)
        instanceProvidedContext._raDebugRendersGroup = `${this.constructor.displayName}:${this._componentInstance.getComponentID()}`;
    }

    if (instanceProvidedContext && !areObjectsEqualShallow(instanceProvidedContext, providedContext))
      this._providedContext = providedContext = getContextObject(Object.assign({}, baseContext, instanceProvidedContext));

    return providedContext;
  }

  render() {
    // Update my state
    var currentState = this._componentInstance.getState();
    this._stateUpdateCounter = this._componentInstance._raStateUpdateCounter;
    Object.assign(this.state, currentState);

    this._componentInstance._invokeComponentWillUpdate(this.props, currentState);

    return doRender.call(this);
  }
}
