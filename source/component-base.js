
import {
  areObjectsEqualShallow,
  capitalize,
  cloneComponents
}                                 from './utils';
import { utils as U, data as D }  from 'evisit-js-utils';
import PropTypes                  from './prop-types';

var componentIDCounter = 1,
    logCache = {};

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
        value: Object.assign({}, props || {})
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
      }
    });

    // Setup the styleSheet getter to build style-sheets when requested
    this._defineStyleSheetProperty('styleSheet', this.constructor.styleSheet);
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

  _construct(InstanceClass, instance, props) {
    if (InstanceClass.propTypes) {
      var resolvedProps = instance.resolveProps(props, props);
      PropTypes.checkPropTypes(InstanceClass.propTypes, resolvedProps, 'propType', this.getComponentName(), () => {
        var error = new Error();
        return error.stack;
      });
    }

    this.construct();

    instance._invokeResolveState(true, props);
  }

  construct() {

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
    const updateRenderState = (elems, skipMutate) => {
      this._staleInternalState = Object.assign({}, this._internalState);
      this._renderCacheInvalid = false;
      var newElems = this._renderCache = (skipMutate) ? elems : this.postRenderProcessElements(elems);
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
        props = this.props = (initial || (newProps !== oldProps)) ? this.resolveProps(newProps, oldProps) : oldProps;

    var newState = this._resolveState.call(this, initial, props, oldProps, ...args);
    this.setState(newState);

    if (initial || (newProps !== oldProps))
      this._invokePropUpdates(initial, props, oldProps, ...args);
  }

  _invokePropUpdates(initial, _props, _oldProps) {
    var props = _props || {},
        oldProps = _oldProps || {},
        keys = Object.keys(props);

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

  getPropsSafe(filter, _props) {
    var props = _props || this.props,
        filterIsRE = (filter instanceof RegExp),
        filterIsFunc = (typeof filter === 'function');

    return this._filterProps((key, value) => {
      if (key.match(/^(id|ref|key|onLayout)$/))
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

    return this._filterProps((key, value) => {
      if (key === 'layoutContext') {
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

        return false;
      }

      return true;
    }, newProps, extraProps, { 'key': ('' + index) });
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
    if (!child || !child.props)
      return child;

    var props = child.props,
        should = !props['_ameliorateMutated'];

    return should;
  }

  _processElements({ elements, onProps, onProcess, onShouldProcess }) {
    var context = {};

    if (elements == null || elements === false)
      return { context, elements: null };

    if (typeof onProps !== 'function')
      onProps = () => {};

    if (typeof onProcess !== 'function')
      onProcess = ({ child }) => child;

    if (typeof onShouldProcess !== 'function')
      onShouldProcess = () => false;

    var newChildren = cloneComponents(elements, onProps, onProcess, onShouldProcess, context);
    return { context, elements: newChildren };
  }

  processElements(elements) {
    return this._processElements({
      elements,
      onProps: this._postRenderProcessChildProps,
      onProcess: this._postRenderProcessChild,
      onShouldProcess: this._postRenderShouldProcessChildren
    });
  }

  postRenderProcessElements(elements) {
    return this.processElements(elements).elements;
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

  getProvidedCallback(name, defaultValue) {
    var func = this.props[name];
    return (typeof func !== 'function') ? defaultValue : func;
  }

  callProvidedCallback(name, opts, defaultValue) {
    var callback = this.getProvidedCallback(name, defaultValue);
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
    return {};
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

    var classNames = ([].concat(...args.map((_elem) => {
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
    })));

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

  styleProp(...args) {
    var styleSheet = this.styleSheet;
    return styleSheet.styleProp(...args);
  }
}
