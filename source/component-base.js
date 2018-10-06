import { utils as U }                         from 'evisit-js-utils';
import PropTypes                              from './prop-types';
import { areObjectsEqualShallow, capitalize } from './utils';

var componentIDCounter = 1,
    logCache = {};

export default class ComponentBase {
  static getClassNamePrefix() {
    return 'application';
  }

  constructor(props, reactComponent) {
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
      '_internalProps': {
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
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
        value: Object.assign({}, props)
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
        writable: true,
        enumerable: false,
        configurable: true,
        value: {}
      }
    });

    // Setup the styleSheet getter to build style-sheets when requested
    this._defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);
  }

  _construct(InstanceClass, instance, props, state, context) {
    this.context = context || {};

    if (InstanceClass.propTypes) {
      var resolvedProps = instance.resolveProps(props, props);
      PropTypes.checkPropTypes(InstanceClass.propTypes, resolvedProps, 'propType', this.getComponentName(), () => {
        var error = new Error();
        return error.stack;
      });
    }

    instance._invokeResolveState(props, state, props, state);
  }

  _getContext() {
    return this.context;
  }

  _setContext(newContext) {
    this.context = newContext;
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
      cachedStyle = styleSheetFactory(theme);
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
    const updateRenderState = (elems) => {
      this._staleInternalState = Object.assign({}, this._internalState);
      this._renderCacheInvalid = false;
      this._renderCache = elems;
    };

    if (this._stateUpdatesFrozen)
      return (this._renderCache !== undefined) ? this._renderCache : null;

    if (this._renderCacheInvalid !== true && this._renderCache !== undefined)
      return this._renderCache;

    var elements = this.render();
    if (elements == null) {
      if (elements === undefined)
        this._logger('warn', 'Warning: @ returned a bad value from "render" method');

      updateRenderState(undefined);
      return null;
    }

    // Async render
    if (typeof elements.then === 'function' && typeof elements.catch === 'function') {
      elements.then((elems) => {
        if (renderID !== this._previousRenderID) {
          console.warn(`Warning: Discarding render ID = ${renderID}... is your render function taking too long?`);
          return updateRenderState(this._renderCache);
        }

        updateRenderState(elems);
        this._forceReactComponentUpdate();
      }).catch((error) => {
        updateRenderState(null);
        throw new Error(error);
      });

      return this._renderCache || null;
    } else if (elements !== undefined) {
      updateRenderState(elements);
      return elements;
    }
  }

  _setReactComponentState(newState, doneCallback) {
    return this._reactComponent.setState(newState, doneCallback);
  }

  _resolveState(props, state, _props, _state) {
    return this.resolveState({
      props,
      _props,
      state,
      _state
    });
  }

  _invokeResolveState(_props, ...args) {
    var props = this.resolveProps(_props, this._internalProps),
        newState = this._resolveState.call(this, props, ...args);

    this._internalProps = _props;
    this.setState(newState);
  }

  _invokeComponentDidMount() {
    this.componentDidMount();
  }

  _invokeComponentWillUnmount() {
    this.componentWillUnmount();
  }

  getChildren(children) {
    if (children !== undefined)
      return children;

    var internalChildren = this.getState('children', this._internalProps.children);
    return (internalChildren === undefined) ? null : internalChildren;
  }

  getResolvableProps(...args) {
    return Object.assign({}, this.constructor._resolvableProps || {}, ...(args.filter((val) => (val != null))));
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

  getProvidedCallback(name) {
    return this.getState(name, this._internalProps[name]);
  }

  callProvidedCallback(name, opts) {
    var callback = this.getProvidedCallback(name, opts);
    if (typeof callback !== 'function')
      return;

    return callback.call(this, Object.assign({ ref: this }, opts || {}));
  }

  getID() {
    return this.id;
  }

  componentDidMount() {}
  componentWillUnmount() {}

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

      if (newState)
        Object.assign(this._internalState, newState);
    }

    if (this.areUpdatesFrozen())
      return;

    // Tell render that we want to render again
    this._invalidateRenderCache();
    this._setReactComponentState(newState, doneCallback);
  }

  getState(path, defaultValue) {
    var currentState = this._internalState;
    if (U.noe(path))
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

  resolveState({ props }) {
    return {
      ...props
    };
  }

  delay(func, time, _id) {
    var id = (!_id) ? ('' + func) : _id;
    if (!this._componentDelayTimers) {
      Object.defineProperty(this, '_componentDelayTimers', {
        writable: true,
        enumerable: true,
        configurable: true,
        value: {}
      });
    }

    if (this._componentDelayTimers[id])
      clearTimeout(this._componentDelayTimers[id]);

    this._componentDelayTimers[id] = setTimeout(() => {
      this._componentDelayTimers[id] = null;
      if (func instanceof Function)
        func.call(this);
    }, time || 250);

    return id;
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

    return ([].concat(...args.map((_elem) => {
      var elem = _elem;
      if (elem === '')
        return thisClassName;

      // Filter out bad class names
      if (U.noe(elem))
        return undefined;

      if (U.instanceOf(elem, 'object', 'array'))
        return this._getClassNamesFromObject(_componentName, elem);

      if (elem.length >= classNamesPrefix.length && elem.substring(0, classNamesPrefix.length) === classNamesPrefix)
        return elem;

      return `${classNamesPrefix}${componentName}${capitalize(('' + elem))}`;
    }))).filter((elem) => !!elem).join(' ');
  }

  getRootClassName(componentName, ...args) {
    var classNames = this.getClassName(componentName, '', ...args);

    var specifiedClassName = this.getState('className');
    if (!U.noe(specifiedClassName))
      classNames = [classNames.trim(), specifiedClassName.trim()].join(' ');

    return classNames;
  }

  style(...args) {
    return this.styleSheet.styleWithHelper(undefined, ...args);
  }

  styleProp(...args) {
    var styleSheet = this.styleSheet;
    return styleSheet.styleProp(...args);
  }
}
