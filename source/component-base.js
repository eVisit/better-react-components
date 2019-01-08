
import React                          from 'react';
import {
  CONTEXT_PROVIDER_KEY,
  areObjectsEqualShallow,
  capitalize,
  cloneComponents,
  filterProps,
  getComponentReferenceMap,
  addComponentReference,
  removeComponentReference,
  getComponentReference,
  removeDuplicates,
  removeEmpty,
  postRenderProcessChildProps,
  postRenderProcessChild,
  postRenderShouldProcessChildren,
  processElements,
  processRenderedElements,
  getUniqueComponentID,
  isValidComponent
}                                     from './utils';
import { utils as U }                 from 'evisit-js-utils';
import PropTypes                      from './prop-types';

var logCache = {};

const COMPONENT_FLAGS = {
  FOCUS:    0x01,
  HOVER:    0x02,
  DISABLE:  0x04,
  ERROR:    0x08,
  WARNING:  0x10,
  DRAGGING: 0x20,
  DROPPING: 0x40
};

const NOOP = () => {};

export default class ComponentBase {
  static getClassNamePrefix() {
    return 'application';
  }

  constructor(props, reactComponent) {
    Object.defineProperties(this, {
      '_raID': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: getUniqueComponentID()
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
      '_raPropUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_raStateUpdateCounter': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      '_raReactPropUpdateCounter': {
        enumerable: false,
        configurable: true,
        get: () => this._raReactComponent._propUpdateCounter,
        set: NOOP
      },
      '_raReactStateUpdateCounter': {
        enumerable: false,
        configurable: true,
        get: () => this._raReactComponent._stateUpdateCounter,
        set: NOOP
      },
      '_raIsMounted': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: false
      },
      'isMounted': {
        enumerable: false,
        configurable: true,
        get: () => this._raIsMounted,
        set: () => {}
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
    });

    // Setup the styleSheet getter to build style-sheets when requested
    addComponentReference(this);
    this._defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);
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

  _construct() {
    const InstanceClass = this.constructor;
    if (InstanceClass.propTypes) {
      try {
        PropTypes.checkPropTypes(InstanceClass.propTypes, this.props, 'propType', this.getComponentName(), () => {
          var propTypes = InstanceClass.PropTypes,
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

    this._invokeResolveState(false, false, true, this.props);
  }

  construct() {

  }

  _fetchContext() {
    var reactProps = this._raReactComponent.props,
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
    if (!theme) {
      this._logger('warn', 'Warning: "theme" not specified when trying to get style for component @');
      return { styleWithHelper: () => null };
    }

    var styleCache = theme._cachedStyles;
    if (!styleCache) {
      Object.defineProperty(theme, '_cachedStyles', {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      });

      styleCache = theme._cachedStyles;
    }

    var styleSheetFactory = _styleSheetFactory;
    if (typeof styleSheetFactory !== 'function') {
      console.warn('static styleSheet for component is not a proper styleSheet');
      return;
    }

    var styleID = styleSheetFactory._styleSheetID,
        cachedStyle = styleCache[styleID];

    if (!cachedStyle) {
      cachedStyle = styleSheetFactory(theme, theme.platform);
      styleCache[styleID] = cachedStyle;
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
    this._raReactComponent.setState({});
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

  _renderInterceptor(renderID) {
    const updateRenderState = (elems, skipMutate) => {
      this._raRenderCacheInvalid = false;
      var newElems = this._raRenderCache = (skipMutate) ? elems : this.postRenderProcessElements(elems);
      return newElems;
    };

    if (this._stateUpdatesFrozen)
      return (this._raRenderCache !== undefined) ? this._raRenderCache : null;

    if (this._raRenderCacheInvalid !== true && this._raRenderCache !== undefined)
      return this._raRenderCache;

    var elements = this.render();
    if (elements == null) {
      if (elements === undefined)
        this._logger('warn', 'Warning: @ returned a bad value from "render" method');

      return updateRenderState(elements);
    }

    // Async render
    if (typeof elements.then === 'function' && typeof elements.catch === 'function') {
      elements.then((elems) => {
        if (renderID !== this._raPreviousRenderID) {
          console.warn(`Warning: Discarding render ID = ${renderID}... is your render function taking too long?`);
          return updateRenderState(this._raRenderCache, true);
        }

        updateRenderState(elems);
        this._forceReactComponentUpdate();
      }).catch((error) => {
        updateRenderState(null);
        throw new Error(error);
      });

      return this._raRenderCache;
    } else if (elements !== undefined) {
      return updateRenderState(elements);
    }
  }

  _setReactComponentState(newState) {
    return this._raReactComponent.setState(newState);
  }

  _resolveState(initial, props, _props) {
    return this.resolveState({
      initial,
      props,
      _props
    });
  }

  _invokeResolveState(propsUpdated, stateUpdated, initial, newProps, ...args) {
    const getResolvedProps = () => {
      if (!initial && !propsUpdated && !stateUpdated)
        return this._raResolvedPropsCache;

      var formattedProps = this.resolveProps(newProps || {}, oldProps || {});
      if (!formattedProps)
        formattedProps = {};

      return formattedProps;
    };

    try {
      this.freezeUpdates();

      var oldProps = this.props,
          props = getResolvedProps();

      var newState = this._resolveState.call(this, initial, props, oldProps, ...args);
      this.setStatePassive(newState);

      if (initial || props !== this._raResolvedPropsCache) {
        this.props = this._raResolvedPropsCache = props;
        this._invokePropUpdates(initial, props, oldProps, ...args);
        return true;
      }

      return (propsUpdated || stateUpdated);
    } finally {
      this.unfreezeUpdates(false);
    }
  }

  _invokePropUpdates(initial, _props, _oldProps) {
    var props = _props || {},
        oldProps = _oldProps || {},
        keys = Object.keys(props),
        onPropsUpdated = this.onPropsUpdated;

    if (typeof onPropsUpdated === 'function')
      onPropsUpdated.call(this, initial, oldProps, props);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value1 = props[key],
          value2 = oldProps[key];

      if (initial || value1 !== value2) {
        var updateFunc = this[`onPropUpdated_${key}`];
        if (typeof updateFunc === 'function')
          updateFunc.call(this, value1, value2, initial);
      }
    }
  }

  onPropsUpdated() {
    // do nothing
  }

  _invokeComponentDidMount() {
    this.componentDidMount();
  }

  _invokeComponentWillUnmount() {
    try {
      return this.componentWillUnmount();
    } finally {
      removeComponentReference(this);
    }
  }

  getProps(...args) {
    return this.resolveProps(Object.assign({}, this.props, ...(args.filter(Boolean))), this.props);
  }

  filterProps(filter, ...args) {
    return filterProps.call(this, filter, this.props, ...args);
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

  getChildren(_children, asArray) {
    function filterChildren(_children) {
      return ((_children instanceof Array) ? _children : [_children]).filter((child) => (child !== false && child != null));
    }

    var children = _children;
    if (children === undefined)
      return this.props.children;

    if (asArray !== true && !(children instanceof Array))
      return children;

    if (asArray && !(children instanceof Array))
      children = [children];

    return filterChildren(children);
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
    };

    return Object.assign(
      {},
      convertArrayToObj(this.constructor._raResolvableProps) || {},
      ...(args.filter((val) => (val != null)).map(convertArrayToObj))
    );
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

      formattedProps[key] = value;
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
        args = (opts instanceof Array) ? opts : [Object.assign({ ref: this }, opts || {})];

    for (var i = 0, il = names.length; i < il; i++) {
      var callback = this.getProvidedCallback(names[i]);
      if (typeof callback === 'function')
        return callback.apply(this, args);
    }

    return defaultValue;
  }

  getID() {
    return this._raID;
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  getPlatform() {
    return 'browser';
  }

  getTheme() {
    return this.theme || this.context.theme;
  }

  forceUpdate() {
    if (!this.areUpdatesFrozen())
      this._raReactComponent.forceUpdate();
  }

  freezeUpdates() {
    this._raUpdatesFrozenSemaphore++;
  }

  unfreezeUpdates(doUpdate) {
    var oldState = this._raUpdatesFrozenSemaphore;
    if (oldState <= 0)
      return;

    this._raUpdatesFrozenSemaphore--;

    if (doUpdate !== false && this._raUpdatesFrozenSemaphore <= 0)
      this.setState({});
  }

  areUpdatesFrozen() {
    if (!this.mounted())
      return true;

    return (this._stateUpdatesFrozen > 0);
  }

  setStatePassive(_newState, doneCallback) {
    var newState = _newState;

    // Always keep the internal state up-to-date
    if (newState) {
      if (typeof newState === 'function')
        newState = newState.call(this, this._raInternalState);

      if (newState) {
        if (typeof this._debugStateUpdates === 'function')
          this._debugStateUpdates(newState, this._raInternalState);

        this._raInternalState = Object.assign({}, this._raInternalState, newState);
      }
    }

    // Tell render that we want to render again
    this._invalidateRenderCache();

    return newState;
  }

  setState(_newState, doneCallback) {
    var newState = this.setStatePassive(_newState, doneCallback);

    if (!this.areUpdatesFrozen())
      this._setReactComponentState(newState);

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
            stateVal = U.get(currentState, key, defaultVal);

        finalState[key.replace(/^.*?(\w+)$/g, '$1')] = (stateVal === undefined) ? defaultVal : stateVal;
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

  delay(func, time, _id) {
    const clearPendingTimeout = () => {
      if (pendingTimer && pendingTimer.timeout) {
        clearTimeout(pendingTimer.timeout);
        pendingTimer.timeout = null;
      }
    };

    var id = (!_id) ? ('' + func) : _id;
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

        if (typeof pendingTimer.func === 'function') {
          var ret = pendingTimer.func.call(this);
          if (ret instanceof Promise || (ret && typeof ret.then === 'function'))
            ret.then((value) => resolve(value));
          else
            resolve(ret);
        } else {
          resolve();
        }
      };

      promise.cancel = () => {
        status = 'rejected';
        clearPendingTimeout();
        this._componentDelayTimers[id] = null;
      };

      promise.pending = () => {
        return (status === 'pending');
      };
    }

    pendingTimer.timeout = setTimeout(() => {
      promise.resolve();
    }, (time == null) ? 250 : time);

    return promise;
  }

  clearDelay(id) {
    if (id == null || this._componentDelayTimers[id] == null)
      return;

    clearTimeout(this._componentDelayTimers[id]);
  }

  shouldComponentUpdate(newState, oldState) {
    return undefined;
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

  _getClassNamesFromObject(_componentName, obj) {
    if (!obj)
      return;

    if (obj instanceof Array)
      return this.getClassName(_componentName, ...obj);

    var keys = Object.keys(obj);
    return this.getClassName(_componentName, ...keys.filter((key) => !!obj[key]));
  }

  getClassName(_componentName, ...args) {
    var classNamesPrefix = this.getClassNamePrefix(),
        componentName = (_componentName) ? _componentName : capitalize(this.getComponentName()),
        thisClassName = `${classNamesPrefix}${componentName}`;

    var classNames = ([].concat(...args.map((_elem) => {
      var elem = _elem;
      if (elem === '')
        return thisClassName;

      // Filter out bad class names
      if (U.noe(elem) || elem == null || elem === false)
        return undefined;

      if (U.instanceOf(elem, 'object', 'array'))
        return this._getClassNamesFromObject(_componentName, elem);

      if (elem.length >= classNamesPrefix.length && elem.substring(0, classNamesPrefix.length) === classNamesPrefix)
        return elem;

      return `${classNamesPrefix}${componentName}${capitalize(('' + elem))}`;
    })));

    if (!args.length)
      classNames.push(thisClassName);

    return removeDuplicates(removeEmpty(classNames)).join(' ');
  }

  getRootClassName(componentName, ...args) {
    var classNames = this.getClassName(componentName, '', ...args);

    var specifiedClassName = this.props['className'];
    if (!U.noe(specifiedClassName))
      classNames = removeDuplicates(removeEmpty(([classNames.trim(), specifiedClassName.trim()].join(' ')).split(/\s+/g))).join(' ');

    return classNames;
  }

  style(...args) {
    return this.styleSheet.styleWithHelper(undefined, ...args);
  }

  themedStyle(_theme, ...args) {
    const convertArgToThemeArgs = (arg) => {
      return [('' + arg)].concat(theme.map((themePart) => `${themePart}${capitalize(arg)}`));
    };

    const convertArgs = (args) => {
      return ([].concat(...(args.map((arg) => {
        if (arg instanceof Array)
          return convertArgs(arg);

        return (typeof arg === 'string' || (arg instanceof String)) ? convertArgToThemeArgs(arg) : arg;
      }))));
    };

    var theme = ((_theme instanceof Array) ? _theme : [_theme]).filter((themePart) => themePart),
        convertedArgs = convertArgs(args);

    //console.log('THEMED ARGS: ', theme, convertedArgs);
    return this.style(...convertedArgs);
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

  getComponentFlags(mergeStates) {
    var currentState = (this.props.hasOwnProperty('componentFlags')) ? this.props.componentFlags : this.getState('_componentFlags', 0),
        allFlags = this._getFlags();

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
        currentState |= thisState;
      else
        currentState = currentState &~ thisState;
    });

    return currentState;
  }

  getComponentFlagsAsObject() {
    var currentState = this.getComponentFlags(),
        allFlags = this._getFlags(),
        keys = Object.keys(allFlags),
        states = {};

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          state = allFlags[key];

      states[key.toLowerCase()] = !!(currentState & state);
    }

    return states;
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
    this.setState({ _componentFlags: newState });

    return newState;
  }

  isComponentFlag(...args) {
    var currentState = (this.props.hasOwnProperty('componentFlags')) ? this.props.componentFlags : this.getState('_componentFlags', 0),
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

      if (!(arg & currentState))
        return false;
    }

    return true;
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
