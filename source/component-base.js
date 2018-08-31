
import {
  areObjectsEqualShallow,
  capitalize
}                         from './utils';
import { utils as U }     from 'evisit-js-utils';

export default class ComponentBase {
  constructor(reactComponent) {
    var stateUpdatesFrozen = false;

    Object.defineProperties(this, {
      '_renderCache': {
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
      '_stateUpdatesFrozen': {
        enumerable: false,
        configurable: true,
        get: () => stateUpdatesFrozen,
        set: (val) => {
          var oldState = stateUpdatesFrozen;
          stateUpdatesFrozen = val;

          if (oldState && !val)
            this.setState({});

          return val;
        }
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
      }
    });
  }

  getComponentName() {
    if (typeof this.constructor.getComponentName !== 'function')
      return 'unknownComponentName';

    return this.constructor.getComponentName();
  }

  _forceReactComponentUpdate() {
    this._reactComponent.setState({});
  }

  _renderInterceptor() {
    const updateRenderState = (elems) => {
      this._staleInternalState = Object.assign({}, this._internalState);
      this._renderCache = elems;
    };

    if (this._stateUpdatesFrozen)
      return (this._renderCache !== undefined) ? this._renderCache : null;

    if (this._renderCache !== undefined)
      return this._renderCache;

    var elements = this.render();

    // Async render
    if (typeof elements.then === 'function' && elements.catch === 'function') {
      elements.then((elems) => {
        updateRenderState(elems);
        this._forceReactComponentUpdate();
      }).catch((error) => {
        updateRenderState(null);
        throw new Error(error);
      });
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
        resolveProps = this._resolvableProps;

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i],
          value = reactProps[key];

      if (resolveProps && resolveProps[key] && typeof value === 'function')
        value = value.call(this, reactProps);

      formattedProps[key] = value;
    }

    this._resolvedPropsCache = formattedProps;
    this._reactPropsCache = reactProps;

    return formattedProps;
  }

  _initiateResolveState(props, state) {
    var newState = this.resolveState({ props, state });
    this.setState(newState);
  }

  freezeUpdates() {
    this._stateUpdatesFrozen = true;
  }

  unfreezeUpdates() {
    this._stateUpdatesFrozen = false;
  }

  areUpdatesFrozen() {
    return this._stateUpdatesFrozen;
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

    if (this._stateUpdatesFrozen)
      return;

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

  resolveState() {
    return {};
  }

  shouldComponentUpdate(newState, oldState) {
    return (!areObjectsEqualShallow(newState, oldState));
  }

  render(children) {
    return children || null;
  }

  getClassNamePrefix() {
    return 'application';
  }

  getClassName(...args) {
    var classNamesPrefix = this.getClassNamePrefix(),
        componentName = capitalize(this.getComponentName()),
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

  getRootClassName(...args) {
    var classNames = this.getClassName('', ...args);

    var specifiedClassName = this.getState('className');
    if (!U.noe(specifiedClassName))
      classNames = [classNames.trim(), specifiedClassName.trim()].join(' ');

    return classNames;
  }
}
