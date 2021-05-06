import moment                     from 'moment';
import { utils as U, formatters } from 'evisit-js-utils';
import PropTypes                  from '@react-ameliorate/prop-types';
import { Platform }               from '@react-ameliorate/native-shims';
import React                      from 'react';
import {
  CONTEXT_PROVIDER_KEY,
  addComponentReference,
  areObjectsEqualShallow,
  calculateObjectDifferences,
  capitalize,
  cloneComponents,
  createTokenizer,
  filterObjectKeys,
  findAllComponentReferences,
  findComponentReference,
  findDOMNode,
  getComponentReference,
  getComponentReferenceMap,
  getLargestFlag,
  getUniqueComponentID,
  isValidComponent,
  nextTick,
  postRenderProcessChild,
  postRenderProcessChildProps,
  postRenderShouldProcessChildren,
  processElements,
  processRenderedElements,
  removeComponentReference,
  removeDuplicateStrings,
  toNumber
}                                 from '@react-ameliorate/utils';

var logCache = {};

const COMPONENT_FLAGS = {
  FOCUSSED: 0x01,
  HOVERED:  0x02,
  DRAGGING: 0x04,
  DROPPING: 0x08,
  ERROR:    0x10,
  WARNING:  0x20,
  DISABLED: 0x40
};

var globalEventActionHooks = {};

const NOOP = () => {};

export default class ComponentBase {
  static getClassNamePrefix() {
    return 'application';
  }

  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    raTestMode: PropTypes.bool,
    raConstruct: PropTypes.bool,
    raTheme: PropTypes.any
  };

  constructor(props, _reactComponent) {
    var reactComponent = _reactComponent;
    if (!reactComponent) {
      reactComponent = {
        state: {},
        props: props,
        _renderCount: 0,
        _mounted: false,
        _propUpdateCounter: 0,
        _stateUpdateCounter: 0,
        _providedContext: {},
        _mock: true,
        setState: () => {
          reactComponent._stateUpdateCounter++;
          reactComponent.forceUpdate();
        },
        forceUpdate: () => {
          this._doComponentRender(reactComponent._propUpdateCounter, reactComponent._stateUpdateCounter);
        }
      };
    }

    Object.defineProperties(this, {
      '_raID': {
        writable: false,
        enumerable: false,
        configurable: false,
        value: getUniqueComponentID()
      },
      '_raComponent': {
        writable: false,
        enumerable: false,
        configurable: false,
        value: true
      },
      '_raMemoizeCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_raRenderCacheInvalid': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: false
      },
      '_raRenderCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: undefined
      },
      '_raRenderAsyncResult': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: false
      },
      '_raPreviousRenderID': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: undefined
      },
      '_raResolvedPropsCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      '_raInternalState': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_raStateUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_raReactProps': {
        enumerable: false,
        configurable: true,
        get: () => reactComponent.props,
        set: NOOP
      },
      '_raReactComponent': {
        enumerable: false,
        configurable: true,
        get: () => reactComponent,
        set: () => {}
      },
      '_raUpdatesFrozenSemaphore': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_raQueueStateUpdatesSemaphore': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_raIsRenderingSemaphore': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_raQueuedStateUpdates': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: []
      },
      '_raReferenceRetrieveHookCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_raReferenceCaptureHookCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_raCompponentFlagsCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      '_raRefs': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      'props': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: props
      },
      'state': {
        enumerable: false,
        configurable: true,
        get: () => this._raInternalState,
        set: (val) => {
          if (!val)
            return;

          this.setState(val);

          return val;
        }
      },
      'context': {
        enumerable: false,
        configurable: true,
        get: () => this._fetchContext(),
        set: NOOP
      },
      '_raLangTermTokenizer': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: this._createLangTermTokenizer()
      }
    });

    if (props.raConstruct !== false)
      addComponentReference(this);

    // Setup the styleSheet getter to build style-sheets when requested
    this._defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);

    // If there is no React instance, construct now
    if (!_reactComponent && props.raConstruct !== false)
      this._construct();
  }

  _raCreateElement() {
    if ((typeof this._interceptElement === 'function')) {
      var element = arguments[0],
          plainElement = (typeof element === 'string'),
          name = (plainElement) ? element : (element && element.displayName || element.name),
          ret = this._interceptElement(name, (plainElement) ? null : element);

      if (ret) {
        var args = new Array(arguments.length);

        args[0] = ret;
        for (var i = 1, il = arguments.length; i < il; i++)
          args[i] = arguments[i];

        return React.createElement(...args);
      }
    }
    return React.createElement.apply(React, arguments);
  }

  generateUniqueComponentID(prefix) {
    return getUniqueComponentID(prefix);
  }

  getComponentID() {
    return this._raID;
  }

  getComponentInternalName() {
    return this.constructor.getComponentInternalName();
  }

  getComponentName() {
    return this.constructor.getComponentName();
  }

  _destruct() {
    this.destruct();
  }

  destruct() {
  }

  _construct() {
    const InstanceClass = this.constructor;
    if (InstanceClass.propTypes && !this.props.raTestMode) {
      try {
        PropTypes.checkPropTypes(InstanceClass.propTypes, this.props, 'propType', this.getComponentName(), () => {
          var propTypes = InstanceClass.propTypes,
              props = this.props;

          var error = new Error();
          return error.stack;
        });
      } catch (e) {
        console.error(e);
      }
    }

    this.construct();

    // Call mixin "construct" initializers
    var mixins = InstanceClass._raMixins;
    if (mixins && mixins.length) {
      for (var i = 0, il = mixins.length; i < il; i++) {
        var mixin = mixins[i],
            constructFunc = mixin.prototype['construct'];

        if (typeof constructFunc === 'function')
          constructFunc.call(this);
      }
    }

    this._invokeResolveState(false, false, true, this._raReactProps);
    this._invokeComponentWillMount();
  }

  construct() {

  }

  _renderCount() {
    return this._raReactComponent._renderCount;
  }

  _getReactComponent() {
    return this._raReactComponent;
  }

  _fetchContext() {
    var reactProps = this._raReactProps,
        keys = Object.keys(reactProps),
        contextProviderKeyLength = CONTEXT_PROVIDER_KEY.length,
        finalContext = {};

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (key.substring(0, contextProviderKeyLength) !== CONTEXT_PROVIDER_KEY)
        continue;

      var context = reactProps[key];
      if (!context || !(context instanceof Object) || context instanceof String || context instanceof Boolean || context instanceof Number)
        continue;

      Object.assign(finalContext, context);
    }

    return finalContext;
  }

  _getStyleSheetFromFactory(theme, _styleSheetFactory) {
    if (!theme)
      throw new Error('"theme" is required to create a style-sheet');

    var styleSheetFactory = _styleSheetFactory;
    if (typeof styleSheetFactory !== 'function') {
      console.warn('static styleSheet for component is not a proper styleSheet');
      return;
    }

    var styleID     = styleSheetFactory._raStyleSheetID,
        cachedStyle = theme.getCachedStyle(styleID);

    if (!cachedStyle) {
      cachedStyle = styleSheetFactory(theme, theme.platform, {
        StyleSheetBuilder: (typeof this['_getStyleSheetBuilderClass'] === 'function') ? this._getStyleSheetBuilderClass(styleSheetFactory._raStyleSheetBuilder) : null,
        styleHelper: this.styleHelper
      });

      theme.setCachedStyle(styleID, cachedStyle);
    }

    return cachedStyle;
  }

  _defineStyleSheetProperty(name, styleSheetFactory) {
    Object.defineProperty(this, name, {
      enumerable: false,
      configurable: true,
      get: () => {
        return this._getStyleSheetFromFactory(this.getTheme(), styleSheetFactory);
      },
      set: () => {}
    });
  }

  _forceReactComponentUpdate() {
    this._raReactComponent.forceUpdate();
  }

  _invalidateRenderCache() {
    this._raRenderCacheInvalid = true;
  }

  _logger(type, _message) {
    if (!_message)
      return;

    var componentName = this.getComponentName(),
        message = ('' + _message).replace(/@/g, componentName);

    var logCacheKey = `${(new Error(componentName))}:${message}`;
    if (logCache[logCacheKey])
      return;

    logCache[logCacheKey] = true;

    if (type === 'warn')
      console.warn(message);
    else if (type === 'error')
      console.error(message);
  }

  _shouldDebugRender(nextProps, nextState) {
    if (!__DEV__)
      return { shouldDebugRender: false, debugRenderGroup: '' };

    var shouldDebugRender = (this.context._raDebugRenders || this.constructor._raDebugRenders),
        debugRenderGroup,
        componentName;

    if (!shouldDebugRender)
      return { shouldDebugRender: false, debugRenderGroup: '' };

    if (shouldDebugRender)
      componentName = this.getComponentName();

    if (shouldDebugRender instanceof RegExp) {
      shouldDebugRender.lastIndex = 0;
      shouldDebugRender = shouldDebugRender.test('' + componentName);
    } else if (typeof shouldDebugRender === 'function') {
      shouldDebugRender = !!shouldDebugRender.call(this, componentName, nextProps, nextState);
    }

    debugRenderGroup = this.context._raDebugRendersGroup || '';

    return { shouldDebugRender, debugRenderGroup, componentName };
  }

  _isRendering(rendering) {
    if (rendering)
      this._raIsRenderingSemaphore++;
    else if (this._raIsRenderingSemaphore > 0)
      this._raIsRenderingSemaphore--;
  }

  _doComponentRender(propUpdateCounter, stateUpdateCounter) {
    if (this._raRenderAsyncResult) {
      this._raRenderAsyncResult = false;
      return (this._raRenderCache || null);
    }

    var renderID = `${propUpdateCounter}/${stateUpdateCounter}`;
    var elements = this._renderInterceptor(renderID);

    this._raPreviousRenderID = renderID;
    this._raReactComponent._renderCount++;

    return elements;
  }

  _getRenderCount() {
    return this._raReactComponent._renderCount;
  }

  _renderInterceptor(renderID) {
    const updateRenderState = (elems, skipMutate) => {
      this._raRenderCacheInvalid = false;
      var newElems = this._raRenderCache = (skipMutate) ? elems : this.postRenderProcessElements(elems);
      return newElems;
    };

    if (__DEV__) {
      var { shouldDebugRender, debugRenderGroup, componentName } = this._shouldDebugRender(this.props, this.getState());
    }

    if (this.areUpdatesFrozen()) {
      if (__DEV__ && shouldDebugRender)
        console.log(`----> ${componentName}${debugRenderGroup}: NOT rendering because component state updates are currently frozen`);

      return (this._raRenderCache || null);
    }

    if (this._raRenderCacheInvalid !== true && this._raRenderCache !== undefined) {
      if (__DEV__ && shouldDebugRender)
        console.log(`----> ${componentName}${debugRenderGroup}: NOT rendering because component render cache is still valid`);

      return this._raRenderCache;
    }

    var elements = this.render();
    if (elements == null) {
      if (elements === undefined)
        this._logger('warn', 'Warning: @ returned a bad value from "render" method');

      return updateRenderState(elements);
    }

    // Async render
    if (typeof elements.then === 'function') {
      elements.then((elems) => {
        if (renderID !== this._raPreviousRenderID) {
          console.warn(`Warning: Discarding render ID = ${renderID}... is your render function taking too long?`);
          return updateRenderState(this._raRenderCache, true);
        }

        updateRenderState(elems);
        this._raRenderAsyncResult = true;
        this._forceReactComponentUpdate();
      }).catch((error) => {
        updateRenderState(null);
        throw new Error(error);
      });

      return this._raRenderCache || null;
    } else if (elements !== undefined) {
      return updateRenderState(elements);
    }
  }

  _setReactComponentState(newState, doneCallback) {
    return this._raReactComponent.setState(newState, doneCallback);
  }

  _resolveState(initial, props, _props) {
    return this.resolveState({
      initial,
      props,
      _props
    });
  }

  shouldClearInternalPropsCache() {
    return false;
  }

  _invokeResolveState(propsUpdated, stateUpdated, initial, newProps, ...args) {
    const getResolvedProps = (force) => {
      if (force !== true && this._raResolvedPropsCache && !initial && !propsUpdated && !stateUpdated)
        return this._raResolvedPropsCache;

      var formattedProps = this.resolveProps(newProps || {}, oldProps || {});
      if (!formattedProps)
        formattedProps = {};

      return formattedProps;
    };

    var oldProps = this.props,
        props = getResolvedProps(this.shouldClearInternalPropsCache(newProps, initial)),
        newState,
        shouldRender;

    // Enable queued state updates (so any call to this.setState inside the state resolution
    // callbacks gets queued in-order, instead of the order getting messed up during resolution)
    this.queueStateUpdates(true);

    // Queue the final state resolution to be first on the stack
    this.setStatePassive(() => newState);

    try {
      newState = this._resolveState.call(this, initial, props, oldProps, ...args);
    } finally {
      // Now flush the queue of state updates
      shouldRender = this.queueStateUpdates(false);
    }

    if (initial || props !== this._raResolvedPropsCache) {
      this.props = this._raResolvedPropsCache = props;
      this._invokeStateOrPropKeyUpdates(false, initial, props, oldProps);
      return true;
    }

    return (propsUpdated || stateUpdated || shouldRender);
  }

  _invokeStateOrPropKeyUpdates(stateUpdate, initial, obj, oldObj) {
    var masterUpdateNotifier = (stateUpdate) ? this.onStateUpdated : this.onPropsUpdated;
    if (typeof masterUpdateNotifier === 'function')
      masterUpdateNotifier.call(this, obj, oldObj, initial);

    var onUpdateKeys = (stateUpdate) ? this.constructor._raOnStateUpdateKeys : this.constructor._raOnPropUpdateKeys;
    if (!onUpdateKeys)
      return;

    for (var i = 0, il = onUpdateKeys.length; i < il; i++) {
      var onUpdateKey = onUpdateKeys[i],
          key = onUpdateKey.name,
          methodName = onUpdateKey.methodName,
          value1 = obj[key],
          value2 = oldObj[key];

      if (initial || value1 !== value2) {
        var updateFunc = this[methodName];
        if (typeof updateFunc === 'function')
          updateFunc.call(this, value1, value2, initial);
      }
    }
  }

  onPropsUpdated() {
    // do nothing
  }

  _invokeComponentWillMount() {
    this.componentMounting();
  }

  _invokeComponentDidMount() {
    if (this._raStateUpdateCounter > this._raReactComponent._stateUpdateCounter)
      this._setReactComponentState(this.getState());

    this.componentMounted();
  }

  _raCleanup() {
    var componentID = this.getComponentID();

    removeComponentReference(this);

    // Free references so we don't leak memory
    this._raReferenceRetrieveHookCache = {};
    this._raReferenceCaptureHookCache = {};
    this._raMemoizeCache = {};
    this._raRenderCache = null;
    this._raResolvedPropsCache = null;
    this._raCompponentFlagsCache = null;

    if (__DEV__ && globalEventActionHooks.hasOwnProperty(componentID))
      console.error(`Component ${this.getComponentName()} registered global event listeners, but never removed the listeners when it was unmounted.`);

    this._destruct();
  }

  _invokeComponentWillUnmount() {
    try {
      var ret = this.componentUnmounting();

      this.clearAllDelays();

      return ret;
    } finally {
      this._raCleanup();
    }
  }

  componentUpdating() {
  }

  componentUpdated() {
  }

  componentCaught() {
  }

  _invokeComponentWillUpdate() {
    return this.componentUpdating.apply(this, arguments);
  }

  _invokeComponentDidUpdate() {
    return this.componentUpdated.apply(this, arguments);
  }

  _invokeComponentDidCatch() {
    return this.componentCaught.apply(this, arguments);
  }

  getProps(...args) {
    if (!args.length)
      return Object.assign({}, this.props);
    else
      return Object.assign({}, ...(args.filter(Boolean)));
  }

  filterProps(filter, ...args) {
    if (!args.length)
      return filterObjectKeys.call(this, filter, this.props);
    else
      return filterObjectKeys.call(this, filter, ...args);
  }

  passProps(filter, ...args) {
    if (filter instanceof RegExp || typeof filter === 'function')
      return this.filterProps(filter, ...args);
    else
      return this.getProps(filter, ...args);
  }

  _getLayoutContextName(layoutContext) {
    return layoutContext;
  }

  _postRenderProcessChildProps() {
    return postRenderProcessChildProps.apply(this, arguments);
  }

  _postRenderProcessChild() {
    return postRenderProcessChild.apply(this, arguments);
  }

  _postRenderShouldProcessChildren() {
    return postRenderShouldProcessChildren.apply(this, arguments);
  }

  _processElements() {
    return processElements.apply(this, arguments);
  }

  processElements() {
    return processRenderedElements.apply(this, arguments);
  }

  postRenderProcessElements(elements, opts) {
    return elements;
  }

  getComponents(_components, asArray) {
    function filterChildren(_components) {
      return ((_components instanceof Array) ? _components : [_components]).filter((component) => (component !== false && component !== true && component != null));
    }

    var components = _components;
    if (asArray !== true && !(components instanceof Array))
      return components;

    if (asArray && !(components instanceof Array))
      components = [ components ];

    return filterChildren(components);
  }

  getChildren(children, asArray) {
    return this.getComponents((children === undefined) ? this.props.children : children, asArray);
  }

  getRootViewNode() {
    var ref = this.getReference('_rootView');
    if (!ref)
      return null;

    return ref;
  }

  getDOMNode() {
    var node = this.getRootViewNode();
    if (!node)
      return node;

    return findDOMNode(node);
  }

  getResolvableProps(...args) {
    function convertArrayToObj(_props) {
      var props = _props;

      if (props instanceof Array) {
        props = props.reduce((obj, item) => {
          obj[('' + item)] = true;
          return obj;
        }, {});
      }

      return props;
    }

    return Object.assign(
      {},
      convertArrayToObj(this.constructor._raResolvableProps) || {},
      ...(args.filter((val) => (val != null)).map(convertArrayToObj))
    );
  }

  formatPropValue(name, value) {
    return value;
  }

  formatVerbiageProp(caption) {
    if (!caption)
      return caption;

    if (typeof caption === 'function')
      return caption.call(this, caption, this);

    if (U.instanceOf(caption, 'string', 'number', 'boolean'))
      return ('' + caption);

    // Here, if we have an array of only strings, find the first valid term from the array.
    // We ensure the array is only strings, because if the array was generated by a langTerm
    // it might contain React elements
    if (Array.isArray(caption)) {
      if (caption.findIndex((item) => !U.instanceOf(item, 'string')) < 0)
        return this.langTerm(caption);
      else
        return caption;
    }

    if (caption.term)
      return this.langTerm(caption.term, caption.params);

    return null;
  }

  resolveProps(props, prevProps, extraResolvableKeys) {
    var formattedProps = {},
        keys = Object.keys(props),
        _raResolvableProps = this.getResolvableProps(extraResolvableKeys);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = props[key];

      if (_raResolvableProps && typeof value === 'function' && _raResolvableProps[key])
        value = value.call(this, props, prevProps);

      formattedProps[key] = this.formatPropValue(key, value);
    }

    return formattedProps;
  }

  getProvidedCallback(name, defaultValue) {
    if (typeof name === 'function')
      return name;

    var func = this.props[name];
    return (typeof func !== 'function') ? defaultValue : func;
  }

  callProvidedCallback(_names, opts, defaultValue) {
    var names = (_names instanceof Array) ? _names : [_names],
        args = (opts == null || opts instanceof Array) ? opts : [ Object.assign({ ref: this, refProps: this.props }, opts || {}) ];

    if (args == null)
      args = [];

    for (var i = 0, il = names.length; i < il; i++) {
      var callback = this.getProvidedCallback(names[i]);
      if (typeof callback === 'function')
        return callback.apply(this, args);
    }

    return defaultValue;
  }

  hasProvidedCallback(name) {
    return (typeof this.props[name] === 'function');
  }

  getID() {
    return this._raID;
  }

  componentMounting() {
  }

  componentMounted() {
  }

  componentUnmounting() {
  }

  getPlatform() {
    return Platform.OS;
  }

  getTheme() {
    return this.theme || this.props.raTheme || this.context.theme;
  }

  forceUpdate() {
    if (this.mounted() && !this.areUpdatesFrozen()) {
      this._invalidateRenderCache();
      this._raReactComponent.forceUpdate();
    }
  }

  freezeUpdates() {
    this._raUpdatesFrozenSemaphore++;
  }

  unfreezeUpdates(doUpdate) {
    if (this._raUpdatesFrozenSemaphore <= 0)
      return;

    this._raUpdatesFrozenSemaphore--;

    if (doUpdate !== false && this._raUpdatesFrozenSemaphore <= 0)
      this.setState({});
  }

  areUpdatesFrozen() {
    return (this._raUpdatesFrozenSemaphore > 0 || this._raQueueStateUpdatesSemaphore > 0);
  }

  queueStateUpdates(enable, doUpdate) {
    if (enable) {
      this._raQueueStateUpdatesSemaphore++;
      return false;
    }

    if (this._raQueueStateUpdatesSemaphore <= 0)
      return false;

    this._raQueueStateUpdatesSemaphore--;
    if (this._raQueueStateUpdatesSemaphore <= 0)
      return this.flushStateUpdates(doUpdate);
  }

  flushStateUpdates(doUpdate) {
    if (this._raQueueStateUpdatesSemaphore > 0)
      return;

    var stateUpdates = this._raQueuedStateUpdates,
        oldState = this._raInternalState;

    if (!stateUpdates.length)
      return false;

    for (var i = 0, il = stateUpdates.length; i < il; i++) {
      var stateUpdate = stateUpdates[i];
      this.setStatePassive(stateUpdate, false, false);
    }

    if (doUpdate === false)
      return true;

    this._invokeStateOrPropKeyUpdates(true, false, this.getState(), oldState);
    this._invalidateRenderCache();

    return true;
  }

  canUpdateState() {
    return (this.mounted() && !this.areUpdatesFrozen() && this._raIsRenderingSemaphore <= 0);
  }

  setStatePassive(_newState, initial, invokeUpdates, debug) {
    var newState = _newState;
    if (!newState)
      return newState;

    if (this._raQueueStateUpdatesSemaphore > 0 || this._raIsRenderingSemaphore > 0) {
      this._raQueuedStateUpdates.push(newState);
      return newState;
    }

    // Always keep the internal state up-to-date
    if (typeof newState === 'function')
      newState = newState.call(this, this._raInternalState);

    if (!newState)
      return newState;

    if (debug)
      debugger;

    var oldState = this._raInternalState,
        currentState = this._raInternalState = Object.assign({}, oldState, newState);

    if (debug)
      debugger;

    if (!areObjectsEqualShallow(oldState, currentState))
      this._raStateUpdateCounter++;

    if (typeof this._debugStateUpdates === 'function')
      this._debugStateUpdates(currentState, oldState, newState);

    if (invokeUpdates !== false) {
      this._invokeStateOrPropKeyUpdates(true, initial, currentState, oldState);
      this._invalidateRenderCache();
    }

    return newState;
  }

  setState(_newState, doneCallback, debug) {
    var newState = this.setStatePassive(_newState, undefined, undefined, debug);

    if (this.canUpdateState()) {
      this._setReactComponentState(newState, doneCallback);
    } else if (__DEV__) {
      var { shouldDebugRender, debugRenderGroup, componentName } = this._shouldDebugRender(this.props, this.getState());
      if (shouldDebugRender)
        console.log(`----> ${componentName}${debugRenderGroup}: NOT rendering because component state updates are currently frozen or component is not mounted`, { mounted: this.mounted(), frozen: this.areUpdatesFrozen(), rendering: (this._raIsRenderingSemaphore > 0) });
    }

    return newState;
  }

  getState(path, defaultValue) {
    var currentState = this._raInternalState;
    if (!arguments.length)
      return currentState;

    if (U.instanceOf(path, 'object')) {
      var keys = Object.keys(path),
          finalState = {};

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            defaultVal = path[key],
            stateVal = U.get(currentState, key);

        finalState[key] = (stateVal === undefined) ? defaultVal : stateVal;
      }

      return finalState;
    }

    return U.get(currentState, path, defaultValue);
  }

  resolveState() {
    return {
      ...this.getState({
        _componentFlags: 0x0
      })
    };
  }

  _debugMonitorStateVariables(filter, newState, oldState) {
    var diff = calculateObjectDifferences(newState, oldState, filter);
    if (!diff)
      return;

    console.trace(`STATE UPDATE [${this.getComponentName()}]: `, diff, [ newState, oldState ]);
  }

  clearAllDelays() {
    var delays  = this._componentDelayTimers,
        ids     = Object.keys(delays || {});

    for (var i = 0, il = ids.length; i < il; i++) {
      var id    = ids[i],
          delay = delays[id];

      delete delays[id];

      if (!delay || !delay.promise)
        continue;

      delay.promise.cancel();
    }
  }

  delay(func, time, _id) {
    const clearPendingTimeout = () => {
      if (pendingTimer && pendingTimer.timeout) {
        clearTimeout(pendingTimer.timeout);
        pendingTimer.timeout = null;
      }
    };

    var id = _id;

    // If we don't get an id from the user, then guess the id by turning the function
    // into a string (raw source) and use that for an id instead
    if (id == null) {
      id = ('' + func);

      // If this is a transpiled code, then an async generator will be used for async functions
      // This wraps the real function, and so when converting the function into a string
      // it will NOT be unique per call-site. For this reason, if we detect this issue,
      // we will go the "slow" route and create a stack trace, and use that for the unique id
      if (id.match(/asyncGeneratorStep/)) {
        id = (new Error()).stack;
        console.warn('react-ameliorate warning: "this.delay" called without a specified "id" parameter while passing an async function. async functions need you to specify an "id" parameter or there will be a hit to performance. Please add a specific "id" parameter to your "this.delay(async function(), time, \'your_unique_id\')" call.');
      }
    } else {
      id = ('' + id);
    }

    if (!this._componentDelayTimers) {
      Object.defineProperty(this, '_componentDelayTimers', {
        writable: true,
        enumerable: true,
        configurable: true,
        value: {}
      });
    }

    var pendingTimer = this._componentDelayTimers[id];
    if (!pendingTimer)
      pendingTimer = this._componentDelayTimers[id] = {};

    pendingTimer.func = func;
    clearPendingTimeout();

    var promise = pendingTimer.promise;
    if (!promise || !promise.pending()) {
      let status = 'pending',
          resolve;

      promise = pendingTimer.promise = new Promise((_resolve) => {
        resolve = _resolve;
      });

      promise.resolve = () => {
        if (status !== 'pending')
          return;

        status = 'fulfilled';
        clearPendingTimeout();
        this._componentDelayTimers[id] = null;

        nextTick(() => {
          if (typeof pendingTimer.func === 'function') {
            var ret = pendingTimer.func.call(this);
            if (ret instanceof Promise || (ret && typeof ret.then === 'function'))
              ret.then((value) => resolve(value));
            else
              resolve(ret);
          } else {
            resolve();
          }
        });
      };

      promise.cancel = () => {
        if (status !== 'pending')
          return;

        status = 'rejected';
        clearPendingTimeout();
        this._componentDelayTimers[id] = null;
      };

      promise.pending = () => {
        return (status === 'pending');
      };

      promise._id = id;
    }

    if (time === 0) {
      pendingTimer.timeout = null;
      promise.resolve();
    } else {
      pendingTimer.timeout = setTimeout(() => {
        promise.resolve();
      }, (time == null) ? 250 : time);
    }

    return promise;
  }

  clearDelay(id) {
    if (id == null || this._componentDelayTimers[id] == null)
      return;

    clearTimeout(this._componentDelayTimers[id]);
  }

  memoizeDefaultArguments() {
    return [ this.getCurrentLocale() ];
  }

  memoizeWithCacheID(cacheID, cb, _args, noDefaults) {
    const isCacheValid = (cache, args) => {
      if (!cache)
        return false;

      if (!args)
        return true;

      var cacheArgs = cache.args;
      if (cacheArgs.length !== args.length)
        return false;

      for (var i = 0, il = cacheArgs.length; i < il; i++) {
        if (cacheArgs[i] !== args[i])
          return false;
      }

      return true;
    };

    var args = (_args) ? _args : null,
        cache = this._raMemoizeCache[cacheID];

    if (args && noDefaults !== true)
      args = args.concat(this.memoizeDefaultArguments(cacheID, cb, args) || []);

    if (isCacheValid(cache, args))
      return cache.value;

    var value = cb.apply(this, args);
    this._raMemoizeCache[cacheID] = { args, value };

    return value;
  }

  memoize(cb, ...args) {
    var id = ('' + cb);
    return this.memoizeWithCacheID(id, cb, args);
  }

  memoizeState(cb, _stateKeys, extraProps) {
    var id        = ('' + cb),
        stateKeys = (_stateKeys) ? _stateKeys.slice() : [],
        args      = this.objectToValuesArray(this.getState(), stateKeys);

    if (extraProps) {
      var extraStateKeys = Object.keys(extraProps);
      args = args.concat(this.objectToValuesArray(extraProps, extraStateKeys));
      stateKeys = stateKeys.concat(extraStateKeys);
    }

    return this.memoizeWithCacheID(id, (...values) => {
      var valuesObj = this.valuesArrayToObject(stateKeys, values);
      return cb.call(this, valuesObj);
    }, args);
  }

  invalidateMemoizeCache(cacheID) {
    delete this._raMemoizeCache[cacheID];
  }

  objectToValuesArray(obj, _keys) {
    if (!obj)
      return [];

    var keys    = (_keys) ? _keys : Object.keys(obj),
        values  = [];

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      values.push(U.get(obj, key));
    }

    return values;
  }

  valuesArrayToObject(keys, values) {
    if (!keys)
      return {};

    var obj = {};

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      U.set(obj, key, values[i]);
    }

    return obj;
  }

  shouldComponentUpdate(oldProps, oldState) {
  }

  render(children) {
    return children || null;
  }

  getComponentName() {
    if (typeof this.constructor.getComponentName !== 'function')
      return 'unknownComponentName';

    return this.constructor.getComponentName();
  }

  mounted() {
    return this._raReactComponent._mounted;
  }

  getClassNamePrefix() {
    if (typeof this.constructor.getClassNamePrefix !== 'function')
      return 'application';

    return this.constructor.getClassNamePrefix();
  }

  /*
   * prefix = default
   * name = field
   * ...args = ['derp', { 'focussed': true, 'hovered': true, 'error': false }]
   * result: [
   *  defaultField
   *  defaultFieldDerp
   *  defaultFieldFocussed
   *  defaultFieldHovered
    ]
  */
  generateNames(_opts, ...args) {
    const flattenArgs = (args) => {
      return [].concat(...(args.map((name) => {
        var type = typeof name;
        if (type === 'boolean' || (type instanceof Boolean))
          return null;

        if (name == null)
          return;

        if (type === 'number' || (name instanceof Number))
          return (isFinite(name)) ? ('' + name) : null;

        if (type === 'string' || (name instanceof String))
          return name;

        // Deal with normal array
        if (name instanceof Array)
          return flattenArgs(name);

        // Convert object to array (keys are used as names, filtered by value)
        return flattenArgs((Object.keys(name).filter((key) => name[key])));
      }))).filter((name) => (name === '' || name));
    };

    var opts = ((typeof _opts === 'string') ? { prefix: _opts } : _opts) || {},
        prefix = opts.prefix || '',
        base = opts.base || '',
        names = flattenArgs(args);

    if (prefix)
      base = capitalize(base);

    return removeDuplicateStrings(names.map((name) => `${prefix}${base}${capitalize(name)}`));
  }

  generateStyleNames(theme, name, ...args) {
    return removeDuplicateStrings(this.generateNames({ prefix: name }, '', args).concat(this.generateNames({ prefix: theme, base: name }, '', args)));
  }

  getClassName(_componentName, ...args) {
    var prefix = this.getClassNamePrefix(),
        base = (_componentName) ? _componentName : this.getComponentName();

    var className = this.generateNames({ prefix, base }, ...args).join(' ');
    return (!className) ? undefined : className;
  }

  getDefaultClassName() {
    var prefix = this.getClassNamePrefix();
    return `${prefix}${capitalize(this.getComponentID())}`;
  }

  getRootClassName(_componentName, ...args) {
    var base = (_componentName) ? _componentName : this.getComponentName();
    // if (base !== this.getComponentName())
    //   return this.getClassName.apply(this, arguments);

    var prefix = this.getClassNamePrefix(),
        classNames = this.generateNames({ prefix, base }, '', ...args);

    var specifiedClassName = this.props.className;
    if (specifiedClassName)
      specifiedClassName = ('' + specifiedClassName).replace(/(\w+)Component_\d{13,}/g, '');

    return removeDuplicateStrings(classNames.concat((!specifiedClassName) ? [] : specifiedClassName.split(/\s+/g), this.getDefaultClassName())).join(' ');
  }

  style(...args) {
    return this.styleSheet.styleWithHelper(undefined, ...args);
  }

  rawStyle(...args) {
    return this.styleSheet.flattenInternalStyleSheet(this.style(...args));
  }

  getCurrentlyFocussedComponent() {
    var app = this.getApp();
    if (!app)
      return null;

    return app._currentlyFocussedComponent;
  }

  setCurrentlyFocussedComponent(component, blurPrevious) {
    var app = this.getApp();
    if (!app)
      return null;

    var currentlyFocussedComponent = app._currentlyFocussedComponent;
    if (component === currentlyFocussedComponent)
      return;

    app._currentlyFocussedComponent = component;

    if (blurPrevious !== false && currentlyFocussedComponent) {
      if (typeof currentlyFocussedComponent.blur === 'function')
        currentlyFocussedComponent.blur();
      else if (typeof currentlyFocussedComponent.defaultOnBlurHandler === 'function')
        currentlyFocussedComponent.defaultOnBlurHandler();
    }
  }

  styleProp(...args) {
    var styleSheet = this.styleSheet;
    return styleSheet.styleProp(...args);
  }

  setReference(name, ref) {
    var refs = this._raRefs;
    if (!refs)
      return;

    refs[name] = ref;
  }

  getReference(name, cb) {
    var refs = this._raRefs;
    if (!refs)
      return;

    var ref = refs[name];

    if (typeof cb === 'function' && ref)
      return cb.call(this, ref);

    return ref;
  }

  retrieveReference(name, transformer) {
    var hook = this._raReferenceRetrieveHookCache[name];
    if (hook && hook.transformer === transformer)
      return hook.callback;

    var callback = () => {
      var _elem = this.getReference(name);
      return (typeof transformer === 'function') ? transformer(_elem) : _elem;
    };

    this._raReferenceRetrieveHookCache[name] = {
      callback,
      transformer
    };

    return callback;
  }

  captureReference(name, transformer) {
    var hook = this._raReferenceCaptureHookCache[name];
    if (hook && hook.transformer === transformer)
      return hook.callback;

    var callback = (_elem) => {
      var elem = (typeof transformer === 'function') ? transformer(_elem) : _elem;
      this.setReference(name, elem);
    };

    this._raReferenceCaptureHookCache[name] = {
      callback,
      transformer
    };

    return callback;
  }

  _getFlags() {
    var cache = this._raCompponentFlagsCache;
    if (!cache)
      cache = this._raCompponentFlagsCache = this.getFlags();

    return cache;
  }

  getFlags() {
    return COMPONENT_FLAGS;
  }

  getLargestFlag(flags) {
    return getLargestFlag(flags);
  }

  getComponentFlags(mergeStates) {
    var currentFlags = this.props.componentFlags;
    if (currentFlags == null)
      currentFlags = this.getState('_componentFlags', 0);

    if (arguments.length) {
      var allFlags = this._getFlags();
      Object.keys(mergeStates || {}).forEach((_key) => {
        var key = _key;
        if (!key)
          return;

        key = ('' + key).toUpperCase();
        if (!allFlags.hasOwnProperty(key))
          return;

        var thisState = allFlags[key],
            doMerge = mergeStates[_key];

        if (doMerge)
          currentFlags = (currentFlags | thisState);
        else
          currentFlags = (currentFlags & ~thisState);
      });
    }

    return currentFlags;
  }

  getComponentFlagsAsObject() {
    var currentFlags = this.getComponentFlags(),
        allFlags = this._getFlags(),
        keys = Object.keys(allFlags),
        flags = {};

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          state = allFlags[key];

      flags[key.toLowerCase()] = !!(currentFlags & state);
    }

    return flags;
  }

  getComponentFlagsAsArray(...extraFlags) {
    var allFlags = this._getFlags(),
        flagOrder = Object.keys(allFlags).sort((a, b) => (allFlags[a] - allFlags[b])).map((flag) => flag.toLowerCase()),
        flags = this.getComponentFlagsAsObject(),
        thisExtraFlags = ([].concat(extraFlags)).filter(Boolean);

    return flagOrder.filter((flag) => flags[flag]).concat(thisExtraFlags);
  }

  setComponentFlags(newState) {
    if (this.props.hasOwnProperty('componentFlags'))
      return;

    this.setState({ _componentFlags: newState });
    return newState;
  }

  setComponentFlagsFromObject(stateProps) {
    if (this.props.hasOwnProperty('componentFlags'))
      return;

    var newState = this.getComponentFlags(stateProps);
    this.setComponentFlags(newState);

    return newState;
  }

  isComponentFlag(...args) {
    var currentFlags = this.getComponentFlags(),
        allFlags = this._getFlags();

    for (var i = 0, il = args.length; i < il; i++) {
      var arg = args[i];
      if (!arg)
        continue;

      if (typeof arg === 'number' || arg instanceof Number) {
        arg = arg.valueOf();
      } else {
        arg = ('' + arg).toUpperCase();
        if (!allFlags.hasOwnProperty(arg))
          continue;

        arg = allFlags[arg];
      }

      if (!(arg & currentFlags))
        return false;
    }

    return true;
  }

  isFlagHovered() {
    return this.isComponentFlag('hovered');
  }

  isFlagFocussed() {
    return this.isComponentFlag('focussed');
  }

  isFlagDisabled() {
    return this.isComponentFlag('disabled');
  }

  isFlagError() {
    return this.isComponentFlag('error');
  }

  isFlagWarning() {
    return this.isComponentFlag('warning');
  }

  isFlagDragging() {
    return this.isComponentFlag('dragging');
  }

  isFlagDropping() {
    return this.isComponentFlag('dropping');
  }

  updateComponentFlagsFromProps(oldProps, newProps, initial) {
    var flags = this._getFlags(),
      keys = Object.keys(flags),
      updatedFlags = {},
      hasUpdates = false;

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
        propName = key.toLowerCase(),
        newProp = newProps[propName];

      if (newProp == null)
        continue;

      if (initial || oldProps[propName] !== newProp) {
        hasUpdates = true;
        updatedFlags[propName] = !!newProp;
      }
    }

    if (hasUpdates)
      this.setComponentFlagsFromObject(updatedFlags);
  }

  isValidElement(...args) {
    return React.isValidElement(...args);
  }

  isValidComponent(value) {
    return isValidComponent(value, ComponentBase);
  }

  propsDiffer(obj1, obj2) {
    return !areObjectsEqualShallow(obj1, obj2);
  }

  cloneComponents(...args) {
    return cloneComponents(...args);
  }

  getApp(cb) {
    var app = this.application || this.props.raApplication || this.context.application;

    if (typeof cb === 'function')
      return cb.call(this, { app });

    return app;
  }

  getAnimationDuration(duration) {
    if (global._raGlobalAnimationDurationOverride != null)
      return global._raGlobalAnimationDurationOverride;

    if (duration != null)
      return toNumber(duration);

    var theme = this.getTheme();
    if (theme) {
      var themeProps = theme.getThemeProperties();
      if (themeProps && themeProps.DEFAULT_ANIMATION_DURATION != null)
        return themeProps.DEFAULT_ANIMATION_DURATION;
    }

    return 250;
  }

  filterByPropTypesFactory(Component) {
    // TODO: complete to filter by component propTypes
  }

  _createLangTermTokenizer() {
    return createTokenizer({
      matchers: [
        {
          type: 'param',
          matcher: function(input, offset) {
            if (input.charAt(offset) !== '{')
              return;

            var lastChar = input.charAt(offset - 1);
            if (lastChar === '\\')
              return;

            var match = [ '{' ],
                name  = [],
                flags = [];

            for (var i = offset + 1, il = input.length; i < il; i++) {
              var c = input.charAt(i),
                  code = (name.length === 0) ? input.charCodeAt(i) : 0;

              if (c === '}' && lastChar !== '\\') {
                match.push(c);
                break;
              }

              lastChar = c;

              match.push(c);

              // If not alphanumeric, add as a flag
              if (code && !(code > 47 && code < 58) && !(code > 64 && code < 91) && !(code > 96 && code < 123))
                flags.push(c);
              else
                name.push(c);
            }

            if (i >= input.length)
              return;

            return [ match.join(''), name.join(''), flags.join('') ];
          },
          onMatch: function(m, name, flags) {
            return { name, flags };
          }
        },
        {
          type: 'raw',
          matcher: function(input, offset) {
            var lastChar = input.charAt(offset - 1),
                match    = [];

            for (var i = offset, il = input.length; i < il; i++) {
              var c = input.charAt(i);
              if (c === '{' && lastChar !== '\\')
                break;

              lastChar = c;
              match.push(c);
            }

            return [ match.join('') ];
          }
        }
      ]
    });
  }

  getCurrentLocale() {
    var locale = this.locale || this.context.locale;
    return (!locale) ? this.getDefaultLocale() : locale;
  }

  getDefaultLocale() {
    return 'en_US';
  }

  getLanguages() {
    var locale = this.getCurrentLocale(),
        lang   = {};

    lang[locale] = { terms: {} };

    return lang;
  }

  getLocaleLanguageTerms(_locale, _scope, noFallback) {
    var scope     = _scope || 'terms',
        languages = this.getLanguages(),
        locale    = (_locale) ? _locale : this.getCurrentLocale(),
        lang      = languages[locale],
        terms     = (lang && lang[scope]);

    if (noFallback !== true && !terms) {
      var defaultLocale = this.getDefaultLocale();
      console.error(`Unknown locale: [${locale}]... falling back to ${defaultLocale}`);
      lang = languages[defaultLocale];
      terms = (lang && lang[scope]);
    }

    if (noFallback !== true && !terms)
      throw new Error('No language packs defined');

    return terms;
  }

  getDefaultLangTerm(termIDs, params) {
    var lastTerm = termIDs[termIDs.length - 1];
    if (!lastTerm)
      throw new Error(`Requested language term '${(termIDs.length === 1) ? termIDs[0] : termIDs}', but no such term exists!`);

    return { term: U.prettify(lastTerm.replace(/^@ra\//, '').replace(/_+/g, ' '), true), termID: lastTerm };
  }

  langTerm(_termID, _params, _scope) {
    const getLocaleTerm = () => {
      const convertTermID = (thisTerm) => {
        return thisTerm.replace(/^@ra\//, '');
      };

      for (var i = 0, il = termIDs.length; i < il; i++) {
        var thisTermID = termIDs[i],
            thisTerm = terms[convertTermID(thisTermID)];

        if (thisTerm)
          return { term: thisTerm, termID: thisTermID };
      }
    };

    const throwTermNotFound = () => {
      if (params.onlyCheckExists)
        return false;

      throw new Error(`Requested language term '${(termIDs.length === 1) ? termIDs[0] : termIDs}', but no such term exists!`);
    };

    var scope         = _scope,
        params        = (U.instanceOf(_params, 'string')) ? { format: _params } : (_params || {}),
        noFallback    = (!!params['_raNoFallback']) || scope !== 'terms',
        defaultLocale = this.getDefaultLocale(),
        locale        = this.getCurrentLocale(),
        terms         = this.getLocaleLanguageTerms(locale, scope, noFallback),
        termIDs       = (Array.isArray(_termID)) ? _termID : [ _termID ],
        term          = getLocaleTerm();

    if (noFallback !== true && !term && locale !== defaultLocale) {
      if (params.onlyCheckExists !== true)
        console.warn(`Language pack ${locale} doesn't contain requested term '${(termIDs.length === 1) ? termIDs[0] : termIDs}'... falling back to ${defaultLocale}`);

      terms = this.getLocaleLanguageTerms(defaultLocale, scope);
      term = getLocaleTerm();

      if (!term)
        term = this.getDefaultLangTerm(termIDs, params);

      if (!term)
        return throwTermNotFound();
    }

    if (noFallback !== true && !term)
        term = this.getDefaultLangTerm(termIDs, params);

    if (noFallback !== true && !term)
      return throwTermNotFound();

    if (!term)
      return (params.onlyCheckExists === true) ? false : undefined;

    return (params.onlyCheckExists === true) ? true : this.compileLanguageTerm({ terms, term: term.term, termID: term.termID, params, locale });
  }

  langTermExists(_termID, _params, _scope) {
    return this.langTerm(_termID, Object.assign({}, _params || {}, { onlyCheckExists: true }), _scope);
  }

  _getLanguageTermFormatterFlagFormatters() {
    return this.memoizeWithCacheID('getLanguageTermFormatterFlagFormatters', () => {
      return this.getLanguageTermFormatterFlagFormatters();
    });
  }

  getLanguageTermFormatterFlagFormatters() {
    const pluralize = (_value) => {
      var value = ('' + _value);
      return (value.match(/s$/)) ? (value + '\'') : (value + '\'s');
    };

    return [
      {
        flag: '_',
        formatter: (value) => ('' + value).toLowerCase()
      },
      {
        flag: '^^^',
        formatter: (value) => ('' + value).toUpperCase()
      },
      {
        flag: '^^',
        formatter: (value) => U.prettify('' + value, true)
      },
      {
        flag: '^',
        formatter: (value) => capitalize(('' + value).toLowerCase())
      },
      {
        flag: '$',
        formatter: (value) => {
          var formatter = formatters.formatterFunction('money');
          return formatter(value, 'format');
        }
      },
      {
        flag: '%',
        formatter: (value) => {
          var formatter = formatters.formatterFunction('percent');
          return formatter(value, 'format');
        }
      },
      {
        flag: '@@@',
        formatter: (value) => {
          return moment(value).format('MM/DD/YYYY hh:mm:ssa');
        }
      },
      {
        flag: '@@',
        formatter: (value) => {
          return moment(value).format('hh:mm:ssa');
        }
      },
      {
        flag: '@',
        formatter: (value) => {
          return moment(value).format('MM/DD/YYYY');
        }
      },
      {
        flag: '+',
        formatter: (value) => {
          return pluralize(value);
        }
      }
    ];
  }

  formatLanguageTerm(term, format, args) {
    const flagMatches = (flags, formatterFlag, offset) => {
      if (!flags || !formatterFlag || offset >= flags.length)
        return false;

      for (var i = 0, il = formatterFlag.length; i < il; i++) {
        var c1 = flags.charAt(i + offset),
            c2 = formatterFlag.charAt(i);

        if (c1 !== c2)
          return false;
      }

      return true;
    };

    const findMatchingFormatFlag = (flags, offset) => {
      if (offset > flags.length)
        return;

      for (var i = 0, il = flagFormatters.length; i < il; i++) {
        var formatter = flagFormatters[i],
            formatterFlag = formatter.flag;

        if (flagMatches(flags, formatterFlag, offset))
          return formatter;
      }
    };

    const formatValueWithFlag = (value, flags, offset) => {
      var formatter = findMatchingFormatFlag(flags, offset);
      if (!formatter)
        return { value, offset: offset + 1 };

      var { formatter, flag } = formatter;
      return { value: formatter.call(this, value), offset: offset + flag.length };
    };

    const applyFlagFormatters = (_value, flags) => {
      if (!flags || !flags.length)
        return _value;

      var value   = _value,
          offset  = 0;

      while (offset < flags.length) {
        var result = formatValueWithFlag(value, flags, offset);

        if (result.offset === offset)
          break;

        value = result.value;
        offset = result.offset;
      }

      return value;
    };

    var flagFormatters      = this._getLanguageTermFormatterFlagFormatters(),
        parsedResult        = this._raLangTermTokenizer.call(this, format),
        tokens              = parsedResult.tokens;

    return this.buildFinalTermFromFormatTokens({
      ...args,
      term,
      format,
      tokens,
      flagFormatters,
      findMatchingFormatFlag,
      formatValueWithFlag,
      applyFlagFormatters
    });

    // return format.replace(/(^|[^\\])\{([^}]+)\}/g, (m, start, capture) => {
    //   var flags,
    //       key;

    //   capture.replace(/^([^a-zA-Z0-9]*)(.*)$/g, (m, _flags, _key) => {
    //     flags = _flags || '';
    //     key = _key;
    //   });

    //   var termValue;
    //   if (key === termID)
    //     termValue = termID;
    //   else if (key === 'term')
    //     termValue = term;
    //   else
    //     termValue = params[key];

    //   if (typeof termValue === 'function')
    //     termValue = termValue.call(this, { ...args, term });

    //   if (termValue == null || (typeof termValue === 'number' && !isFinite(termValue)))
    //     return (start || '');

    //   for (var i = 0, il = flags.length; i < il;) {
    //     var { value, offset } = formatValueWithFlag(termValue, flags, i);

    //     termValue = value;
    //     i = offset;
    //   }

    //   return `${(start || '')}${termValue}`;
    // });
  }

  buildFinalTermFromFormatTokens(args) {
    // This formats all parts (which can be mixed strings and objects)
    // such that [ 'string1', 'string2', 'string3', object1, 'string4', 'string5', object2 ]
    // will become [ 'string1string2string3', object1, 'string4string5', object2 ]
    // If the final result is an array of length 1 and the only element is a string
    // it will just return the resulting string instead

    const sanitizeOutput = (output) => {
      var stringOutput  = [],
          finalOutput   = [];

      for (var i = 0, il = output.length; i < il; i++) {
        var part = output[i];
        if (typeof part === 'string') {
          stringOutput.push(part);
          continue;
        }

        if (stringOutput.length) {
          finalOutput.push(stringOutput.join(''));
          stringOutput = [];
        }

        finalOutput.push(part);
      }

      if (stringOutput.length)
        finalOutput.push(stringOutput.join(''));

      if (finalOutput.length === 1 && typeof finalOutput[0] === 'string')
        return finalOutput[0];

      return finalOutput;
    };

    var output = [],
        {
          term,
          tokens,
          applyFlagFormatters,
          params,
          termID
        } = args;

    for (var i = 0, il = tokens.length; i < il; i++) {
      var token = tokens[i];

      if (token.type === 'raw') {
        output.push(token.source);
        continue;
      }

      var { name, flags } = token,
          termValue;

      if (name === termID)
        termValue = termID;
      else if (name === 'term')
        termValue = term;
      else
        termValue = params[name];

      if (typeof termValue === 'function')
        termValue = termValue.call(this, args);

      if (termValue == null || (typeof termValue === 'number' && !isFinite(termValue)))
        continue;

      if (U.instanceOf(termValue, 'string', 'number', 'boolean'))
        termValue = applyFlagFormatters(('' + termValue), flags);

      output.push(termValue);
    }

    return sanitizeOutput(output);
  }

  compileLanguageTerm(args) {
    var { term, params } = args;

    if (typeof term === 'function') {
      const format = (format) => this.formatLanguageTerm(term, format, args),
            hasParams = (...args) => {
              for (var i = 0, il = args.length; i < il; i++) {
                var arg = args[i];
                if (U.noe(params[arg]))
                  return false;
              }

              return true;
            };

      term = term.call(this, { ...args, format, hasParams });
    }

    if (params && params.format && ('' + params.format).indexOf('{') >= 0)
      term = this.formatLanguageTerm(term, params.format, args);

    return term;
  }

  digitToLanguage(_number) {
    // Scope to "numbers"
    const lt = (term, params) => this.langTerm(term, params, 'numbers');

    var number = _number;
    if (number instanceof Number)
      number = number.valueOf();

    // Is it NaN?
    if (typeof number !== 'number')
      return lt('nan');

    if (isNaN(number))
      return lt('nan');

    // Is it Infinity?
    if (!isFinite(number))
      return lt('infinity');

    var numberS = ('' + number),
        rawTerm = lt(numberS);

    // Found exact match
    if (rawTerm)
      return rawTerm;


  }

  clearDefaultEventActionHooks(eventName) {
    var componentID = this.getComponentID(),
        globalEventActionHooks = this.getGlobalEventActionHooks();

    if (eventName) {
      var hooks = globalEventActionHooks[componentID];
      if (!hooks)
        return;

      delete hooks[eventName];
      if (U.noe(hooks))
        delete globalEventActionHooks[componentID];
    } else {
      delete globalEventActionHooks[componentID];
    }
  }

  getDefaultEventActions(eventName) {
    var globalEventActionHooks = this.getGlobalEventActionHooks(),
        componentID = this.getComponentID(),
        allHooks = globalEventActionHooks[componentID];

    if (!allHooks)
      return (eventName) ? [] : { _order: this.getComponentOrder(), _id: componentID };

    if (!eventName)
      return allHooks;

    return (allHooks[eventName] || []);
  }

  unregisterDefaultEventActions(eventName) {
    this.clearDefaultEventActionHooks(eventName);
  }

  unregisterDefaultEventAction(eventName, callback) {
    if (!callback)
      return this.clearDefaultEventActionHooks(eventName);

    var globalEventActionHooks = this.getGlobalEventActionHooks(),
        newActions = this.getDefaultEventActions(eventName).filter((action) => (action.callback !== callback)),
        componentID = this.getComponentID(),
        allHooks = globalEventActionHooks[componentID];

    if (!allHooks)
      return;

    if (newActions.length)
      allHooks[eventName] = newActions;
    else
      this.clearDefaultEventActionHooks(eventName);
  }

  registerDefaultEventAction(eventName, callback) {
    var globalEventActionHooks = this.getGlobalEventActionHooks(),
        componentID = this.getComponentID(),
        allHooks = globalEventActionHooks[componentID];

    if (!allHooks)
      allHooks = globalEventActionHooks[componentID] = { _order: componentID, _id: componentID };

    var actions = allHooks[eventName];
    if (!actions)
      actions = allHooks[eventName] = [];

    actions.push({
      eventName,
      callback
    });
  }

  getGlobalEventActionHooks() {
    return this.constructor.getGlobalEventActionHooks();
  }

  _getComponentReference(componentID) {
    return getComponentReference(componentID);
  }

  _findComponentReference(...args) {
    return findComponentReference(...args);
  }

  _findAllComponentReferences(...args) {
    return findAllComponentReferences(...args);
  }

  static getGlobalEventActionHooks() {
    return globalEventActionHooks;
  }

  static getAllComponentFlags() {
    return COMPONENT_FLAGS;
  }

  static cloneComponents(...args) {
    return cloneComponents(...args);
  }

  static getComponentReferenceMap() {
    return getComponentReferenceMap();
  }

  static addComponentReference(...args) {
    return addComponentReference(...args);
  }

  static removeComponentReference(...args) {
    return removeComponentReference(...args);
  }

  static getComponentReference(...args) {
    return getComponentReference(...args);
  }

  static isValidElement(...args) {
    return React.isValidElement(...args);
  }

  static isValidComponent(value) {
    return isValidComponent(value, ComponentBase);
  }

  static getComponentInternalName() {
    return 'ComponentBase';
  }

  static getComponentName() {
    return 'ComponentBase';
  }

  static getParentComponent() {
    return null;
  }

  static getFactory() {
    return null;
  }
}
