
import {
  areObjectsEqualShallow,
  capitalize,
  cloneComponents
}                                     from './utils';
import { utils as U, data as D }      from 'evisit-js-utils';
import PropTypes                      from './prop-types';
import { RAC_KEY }                    from './context';

var componentIDCounter = 1,
    logCache = {};

const COMPONENT_FLAGS = {
  FOCUS:    0x01,
  HOVER:    0x02,
  DISABLE:  0x04,
  ERROR:    0x08,
  WARNING:  0x10,
  DRAGGING: 0x20,
  DROPPING: 0x40
};

function removeDuplicates(array) {
  return Object.keys((array || {}).reduce((obj, item) => {
    obj[('' + item)] = true;
    return obj;
  }, {}));
}

function removeEmpty(array) {
  return (array || []).filter((item) => !U.noe(item));
}

export default class ComponentBase {
  static getClassNamePrefix() {
    return 'application';
  }

  constructor(props, reactComponent) {
    var rac = props[RAC_KEY];
    if (rac)
      rac.onInstantiate(this);

    Object.defineProperties(this, {
      'id': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: (props.id) ? props.id : `Component_${('' + (componentIDCounter++)).padStart(13, '0')}`
      },
      '_renderCacheInvalid': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: false
      },
      '_renderCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: undefined
      },
      '_previousRenderID': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: undefined
      },
      '_reactPropsCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      '_resolvedPropsCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      'props': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: props
      },
      '_staleInternalState': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_internalState': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_queuedStateUpdates': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: []
      },
      '_reactComponent': {
        enumerable: false,
        configurable: true,
        get: () => reactComponent,
        set: () => {}
      },
      '_updatesFrozenSemaphore': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: 0
      },
      'state': {
        enumerable: false,
        configurable: true,
        get: () => this._internalState,
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
        get: () => {
          var props = this.props,
              fetchContext = props['_ameliorateContextProvider'];

          if (typeof fetchContext === 'function')
            return fetchContext();

          return {};
        },
        set: () => {}
      },
      '_referenceRetrieveHookCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_referenceCaptureHookCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_compponentFlagsCache': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: null
      },
      '_refs': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      },
      '_isMounted': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: false
      }
    });

    // Setup the styleSheet getter to build style-sheets when requested
    this._defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);
  }

  getComponentInternalName() {
    return this.constructor.getComponentInternalName();
  }

  getComponentName() {
    return this.constructor.getComponentName();
  }

  _contextFetcher() {
    var props = this.props,
        myProvider = this['provideContext'],
        parentProvider = props['_ameliorateContextProvider'],
        context = {};

    if (typeof parentProvider === 'function')
      context = (parentProvider() || {});

    if (typeof myProvider === 'function')
      context = Object.assign(context, (myProvider() || {}));

    return context;
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
    var mixins = InstanceClass._mixins;
    if (mixins && mixins.length) {
      for (var i = 0, il = mixins.length; i < il; i++) {
        var mixin = mixins[i],
            constructFunc = mixin.prototype['construct'];

        if (typeof constructFunc === 'function')
          constructFunc.call(this);
      }
    }

    this._invokeResolveState(true, this.props);
  }

  construct() {

  }

  _mutateChildJSXProps(props) {
    return props;
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
    this._reactComponent.setState({});
  }

  _invalidateRenderCache() {
    this._renderCacheInvalid = true;
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
      this._staleInternalState = Object.assign({}, this._internalState);
      this._renderCacheInvalid = false;
      var newElems = this._renderCache = (skipMutate) ? elems : this._postRenderProcessElements(elems);
      return newElems;
    };

    if (this._stateUpdatesFrozen)
      return (this._renderCache !== undefined) ? this._renderCache : null;

    if (this._renderCacheInvalid !== true && this._renderCache !== undefined)
      return this._renderCache;

    var elements = this.render();
    if (elements == null) {
      if (elements === undefined)
        this._logger('warn', 'Warning: @ returned a bad value from "render" method');

      return updateRenderState(undefined);
    }

    // Async render
    if (typeof elements.then === 'function' && typeof elements.catch === 'function') {
      elements.then((elems) => {
        if (renderID !== this._previousRenderID) {
          console.warn(`Warning: Discarding render ID = ${renderID}... is your render function taking too long?`);
          return updateRenderState(this._renderCache, true);
        }

        updateRenderState(elems);
        this._forceReactComponentUpdate();
      }).catch((error) => {
        updateRenderState(null);
        throw new Error(error);
      });

      return this._renderCache;
    } else if (elements !== undefined) {
      return updateRenderState(elements);
    }
  }

  _setReactComponentState(newState, doneCallback) {
    return this._reactComponent.setState(newState, doneCallback);
  }

  _resolveState(initial, props, _props) {
    return this.resolveState({
      initial,
      props,
      _props
    });
  }

  _invokeResolveState(initial, newProps, ...args) {
    var oldProps = this.props,
        props = (initial || (newProps !== oldProps)) ? this.resolveProps(newProps, oldProps) : oldProps;

    if (!props)
      props = {};

    var newState = this._resolveState.call(this, initial, props, oldProps, ...args);
    this.setState(newState);

    if (initial || (newProps !== oldProps)) {
      this._invokePropUpdates(initial, props, oldProps, ...args);
      this.props = props;
    }
  }

  _invokePropUpdates(initial, _props, _oldProps) {
    var props = _props || {},
        oldProps = _oldProps || {},
        keys = Object.keys(props),
        onPropsUpdated = this.onPropsUpdated;

    if (typeof onPropsUpdated === 'function')
      onPropsUpdated.call(this, initial, props, oldProps);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value1 = props[key],
          value2 = oldProps[key];

      if (initial || value1 !== value2) {
        var updateFunc = this[`onPropUpdate_${key}`];
        if (typeof updateFunc === 'function')
          updateFunc.call(this, value1, value2);
      }
    }
  }

  _invokeComponentDidMount() {
    this.componentDidMount();
  }

  _invokeComponentWillUnmount() {
    this.componentWillUnmount();
  }

  getProps(filter, ...args) {
    return this._filterProps(filter, this.props, ...args);
  }

  getPropsSafe(_props, filter) {
    var props = _props || this.props,
        filterIsRE = (filter instanceof RegExp),
        filterIsFunc = (typeof filter === 'function');

    return this._filterProps((key, value) => {
      if (key.match(/^(id|ref|key)$/))
        return false;

      if (filterIsRE) {
        filter.lastIndex = 0;
        if (filter.test(key))
          return false;
      } else if (filterIsFunc) {
        if (!filter(key, value))
          return false;
      }

      return true;
    }, props);
  }

  _filterProps(filter) {
    var newProps = {},
        filterIsRE = (filter instanceof RegExp),
        filterIsFunc = (typeof filter === 'function');

    for (var i = 1, il = arguments.length; i < il; i++) {
      var arg = arguments[i];
      if (!arg)
        continue;

      var keys = Object.keys(arg);
      for (var j = 0, jl = keys.length; j < jl; j++) {
        var key = keys[j],
            value = arg[key];

        if (filterIsRE) {
          filter.lastIndex = 0;
          if (filter.test(key))
            continue;
        } else if (filterIsFunc) {
          if (!filter(key, value))
            continue;
        }

        newProps[key] = value;
      }
    }

    return newProps;
  }

  _getLayoutContextName(layoutContext) {
    return layoutContext;
  }

  _postRenderProcessChildProps({ parent, child, childProps, context, index }) {
    var newProps = childProps,
        extraProps,
        reactComponentClass = (child && child.type);

    if (reactComponentClass && reactComponentClass._ameliorateComponent) {
      extraProps = {
        '_ameliorateContextProvider': this._contextFetcher,
        '_ameliorateMutated': true
      };
    }

    var finalProps = this._filterProps((key, _value) => {
      var value = _value;
      if (key === 'layoutContext') {
        value = this._getLayoutContextName(value);
        if (!value)
          return false;

        var layout = context.layout;
        if (!layout)
          layout = context.layout = {};

        var namedLayout = layout[value];
        if (!namedLayout)
          namedLayout = layout[value] = [];

        // WIP: Add to layouts for layout engine
        // needs to be able to fetch a layout
        // and remove a fetched layout
        Object.defineProperty(child, 'removeFromCurrentLayout', {
          writable: true,
          enumerable: false,
          configurable: true,
          value: () => {
            var props = (parent && parent.props);

            if (props.children instanceof Array) {
              var index = props.children.indexOf(child);
              if (index >= 0)
                props.children.splice(index, 1);
            } else if (props.children === child) {
              props.children = null;
            }

            return child;
          }
        });

        namedLayout.push(child);
      }

      return true;
    }, newProps, extraProps);

    return finalProps;
  }

  _postRenderProcessChild({ child, childProps, validElement }) {
    const cloneComponent = (child, childProps) => {
      if (!child)
        return child;

      child.props = childProps;
      return child;
    };

    if (!validElement)
      return child;

    if (!child)
      return child;

    return cloneComponent(child, childProps);
  }

  _postRenderShouldProcessChildren({ child }) {
    if (!child)
      return false;

    if (child instanceof Array)
      return true;

    if (!child.props)
      return false;

    var props = child.props,
        should = !props['_ameliorateMutated'];

    return should;
  }

  _processElements({ elements, onProps, onProcess, onShouldProcess }) {
    var contexts = {};

    if (elements == null || elements === false)
      return { contexts, elements: null };

    if (typeof onProps !== 'function')
      onProps = () => {};

    var newChildren = cloneComponents.call(this, elements, onProps, onProcess, onShouldProcess, undefined, contexts);
    return { contexts, elements: newChildren };
  }

  processElements(elements, _opts) {
    var opts = _opts,
        defaultOpts = {
          elements,
          onProps: this._postRenderProcessChildProps,
          onProcess: this._postRenderProcessChild,
          onShouldProcess: this._postRenderShouldProcessChildren
        };

    if (opts === true)
      opts = { onShouldProcess: true, onProcess: null };

    return this._processElements((opts) ? Object.assign(defaultOpts, opts) : defaultOpts);
  }

  _postRenderProcessElements(elements, opts) {
    return this.processElements(elements, opts).elements;
  }

  postRenderProcessElements(elements, opts) {
    return this.processElements(elements, opts).elements;
  }

  getChildren(children) {
    function filterChildren(_children) {
      return ((_children instanceof Array) ? _children : [_children]).filter((child) => (child !== false && child != null));
    }

    if (children === undefined)
      return this.props.children;

    if (!(children instanceof Array))
      return children;

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
      convertArrayToObj(this.constructor.resolvableProps) || {},
      ...(args.filter((val) => (val != null)).map(convertArrayToObj))
    );
  }

  resolveProps(props, prevProps, extraProps) {
    if (this._resolvedPropsCache && props === this._reactPropsCache)
      return this._resolvedPropsCache;

    var formattedProps = {},
        keys = Object.keys(props),
        resolvableProps = this.getResolvableProps(extraProps);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = props[key];

      if (resolvableProps && typeof value === 'function' && resolvableProps[key])
        value = value.call(this, props, prevProps);

      formattedProps[key] = value;
    }

    this._resolvedPropsCache = formattedProps;
    this._reactPropsCache = props;

    return formattedProps;
  }

  getProvidedCallback(name, defaultValue) {
    if (typeof name === 'function')
      return name;

    var func = this.props[name];
    return (typeof func !== 'function') ? defaultValue : func;
  }

  callProvidedCallback(_names, opts, defaultValue) {
    var names = (_names instanceof Array) ? _names : [_names];

    for (var i = 0, il = names.length; i < il; i++) {
      var callback = this.getProvidedCallback(names[i]);
      if (typeof callback === 'function')
        return callback.call(this, Object.assign({ ref: this }, opts || {}));
    }

    return defaultValue;
  }

  getID() {
    return this.id;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = true;
  }

  isMounted() {
    return this._isMounted;
  }

  getPlatform() {
    return 'browser';
  }

  getTheme() {
    return this.theme || this.context.theme;
  }

  forceUpdate(...args) {
    return this._reactComponent.forceUpdate(...args);
  }

  freezeUpdates() {
    this._updatesFrozenSemaphore++;
  }

  unfreezeUpdates(doUpdate) {
    var oldState = this._updatesFrozenSemaphore;
    if (oldState <= 0)
      return;

    this._updatesFrozenSemaphore--;

    if (doUpdate !== false && this._updatesFrozenSemaphore <= 0)
      this.setState({});
  }

  areUpdatesFrozen() {
    if (!this.mounted())
      return true;

    return (this._stateUpdatesFrozen > 0);
  }

  setState(_newState, doneCallback) {
    var newState = _newState;

    // Always keep the internal state up-to-date
    if (newState) {
      if (typeof newState === 'function')
        newState = newState.call(this, this._internalState);

      if (newState) {
        if (typeof this._debugStateUpdates === 'function')
          this._debugStateUpdates(newState, this._internalState);

        Object.assign(this._internalState, newState);
      }
    }

    if (this.areUpdatesFrozen())
      return;

    // Tell render that we want to render again
    this._invalidateRenderCache();
    this._setReactComponentState(newState, doneCallback);
  }

  getState(path, defaultValue) {
    var currentState = this._internalState;
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
      _componentFlags: 0x0,
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
    return (!areObjectsEqualShallow(newState, oldState));
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
    return this._reactComponent._mounted;
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
    var refs = this._refs;
    if (!refs)
      return;

    refs[name] = ref;
  }

  getReference(name, cb) {
    var refs = this._refs;
    if (!refs)
      return;

    var ref = refs[name];

    if (typeof cb === 'function' && ref)
      return cb.call(this, ref);

    return ref;
  }

  retrieveReference(name, transformer) {
    var hook = this._referenceRetrieveHookCache[name];
    if (hook && hook.transformer === transformer)
      return hook.callback;

    var callback = () => {
      var _elem = this.getReference(name);
      return (typeof transformer === 'function') ? transformer(_elem) : _elem;
    };

    this._referenceRetrieveHookCache[name] = {
      callback,
      transformer
    };

    return callback;
  }

  captureReference(name, transformer) {
    var hook = this._referenceCaptureHookCache[name];
    if (hook && hook.transformer === transformer)
      return hook.callback;

    var callback = (_elem) => {
      var elem = (typeof transformer === 'function') ? transformer(_elem) : _elem;
      this.setReference(name, elem);
    };

    this._referenceCaptureHookCache[name] = {
      callback,
      transformer
    };

    return callback;
  }

  _getFlags() {
    var cache = this._compponentFlagsCache;
    if (!cache)
      cache = this._compponentFlagsCache = this.getFlags();

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

  static cloneComponents(...args) {
    return cloneComponents(...args);
  }
}
