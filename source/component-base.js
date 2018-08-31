
import {
  areObjectsEqualShallow,
  capitalize
}                         from './utils';
import { utils as U }     from 'evisit-js-utils';

export default class ComponentBase {
  static getClassNamePrefix() {
    return 'application';
  }

  constructor(reactComponent, props) {
    Object.defineProperties(this, {
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

  _getContext() {
    return this.context;
  }

  _setContext(newContext) {
    this.context = newContext;
  }

  _getStyleSheetFromFactory(theme, _styleSheetFactory) {
    if (!theme)
      return;

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

  _resolveProps(reactProps) {
    if (this._resolvedPropsCache && reactProps === this._reactPropsCache)
      return this._resolvedPropsCache;

    var formattedProps = {},
        keys = Object.keys(reactProps),
        resolvableProps = this.constructor._resolvableProps;

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = reactProps[key];

      if (resolvableProps && resolvableProps[key] && typeof value === 'function')
        value = value.call(this, reactProps);

      formattedProps[key] = value;
    }

    this._resolvedPropsCache = formattedProps;
    this._reactPropsCache = reactProps;

    return formattedProps;
  }

  _invokeResolveState(_props, state, prevProps, prevState) {
    var props = this._resolveProps(_props, this._internalProps),
        newState = this.resolveState({
          props,
          state,
          _props: prevProps,
          _state: prevState
        });

    this._internalProps = _props;

    this.setState(newState);
  }

  _invokeComponentDidMount() {
    this.componentDidMount();
  }

  _invokeComponentWillUnmount() {
    this.componentWillUnmount();
  }

  componentDidMount() {}
  componentWillUnmount() {}

  getPlatform() {
    return 'browser';
  }

  getTheme() {
    return this.theme || this.context.theme;
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

  _getClassName(_componentName, ...args) {
    var classNamesPrefix = this.getClassNamePrefix(),
        componentName = (_componentName) ? _componentName : capitalize(this.getComponentName()),
        thisClassName = `${classNamesPrefix}${componentName}`;

    return args.map((elem) => {
      if (elem === '')
        return thisClassName;

      // Filter out bad class names
      if (U.noe(elem))
        return undefined;

      if (elem.length >= classNamesPrefix.length && elem.substring(0, classNamesPrefix.length) === classNamesPrefix)
        return elem;

      return `${classNamesPrefix}${componentName}${capitalize(('' + elem))}`;
    }).filter((elem) => !!elem).join(' ');
  }

  getClassName(...args) {
    return this._getClassName(undefined, ...args);
  }

  getRootClassName(componentName, ...args) {
    var classNames = this._getClassName(componentName, '', ...args);

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
