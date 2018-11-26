import React                    from 'react';
import ComponentBase            from './component-base';
import PropTypes                from './prop-types';
import ReactComponentBase       from './react-component-base';

import {
  CONTEXT_PROVIDER_KEY,
  copyStaticProperties,
  copyPrototypeFuncs,
  areObjectsEqualShallow,
  processRenderedElements,
  getComponentReference,
  getParentComponentContext,
  getUniqueComponentID,
  addComponentReference,
  removeComponentReference,
}                                 from './utils';

export { StyleSheetBuilder }      from './styles/style-sheet';
export {
  Color,
  buildPalette,
  Constants
}                                 from './styles/colors';
export { Theme, ThemeProperties } from './styles/theme';

export {
  copyStaticProperties,
  copyPrototypeFuncs,
  areObjectsEqualShallow
};

// This needs to be smarter and needs to stack classes intelligently so that super properly works
function mixinClasses(args) {
  for (var i = 0, il = args.length; i < il; i++) {
    var arg = args[i];
    if (typeof arg !== 'function')
      continue;

    copyPrototypeFuncs(arg.prototype, this, (propName, prop, source) => {
      return !source.hasOwnProperty('isReactComponent');
    });
  }
}

function _componentFactory(_name, definer, _options) {
  function getComponentClass(component) {
    if (!component)
      return ComponentBase;

    if (component && component._componentClass)
      return component._componentClass;

    return component;
  }

  function getReactComponentClass(component) {
    if (!component)
      return ReactComponentBase;

    if (component && component._reactComponentClass)
      return component._reactComponentClass;

    return component;
  }

  function mergePropTypes(..._types) {
    var types = _types.filter((type) => !!type);
    return PropTypes.mergeTypes(...types);
  }

  var name = (_name && _name.name) ? _name.name : _name,
      displayName = (_name && _name.displayName) ? _name.displayName : _name;

  if (!name)
    throw new TypeError('"name" is required to create a component');

  if (typeof definer !== 'function')
    throw new TypeError('"definer" callback is required to create a component');

  var options = (typeof _options === 'function') ? { parent: _options } : (_options || {}),
      ReactBaseComponent = getReactComponentClass(options.reactComponentBaseClass),
      Parent = getComponentClass(options.parent || ComponentBase),
      mixins = ([].concat(Parent._mixins, options.mixins)).filter((mixin) => mixin);

  if (mixins && mixins.length) {
    const MixinParent = class InterstitialMixinClass extends Parent {};
    copyStaticProperties(Parent, MixinParent);
    mixinClasses.call(MixinParent.prototype, mixins);
    Parent = MixinParent;
  }

  var ComponentClass = definer(Object.assign({}, options, { Parent, componentName: displayName, componentInternalName: name }));
  if (typeof ComponentClass !== 'function')
    throw new TypeError('"definer" callback must return a class or a function');

  class ReactComponentClass extends ReactBaseComponent {
    constructor(...args) {
      super(ComponentClass, ...args);
    }
  }

  const parentComponent = Parent,
        parentReactComponent = getReactComponentClass(Parent);

  var propTypes = mergePropTypes(parentComponent.propTypes, ComponentClass.propTypes),
      defaultProps = Object.assign({}, (parentComponent.defaultProps || {}), (ComponentClass.defaultProps || {})),
      resolvableProps = ComponentClass.resolvableProps;

  copyStaticProperties(parentComponent, ComponentClass, null, parentComponent._rebindStaticMethod);
  copyStaticProperties(ComponentClass, ReactComponentClass, (name) => {
    return (name !== 'propTypes' && name !== 'defaultProps');
  });
  copyStaticProperties(parentReactComponent, ReactComponentClass);

  const commonStaticProps = {
    '_ameliorateComponent': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: true
    },
    '_parentComponent': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: parentComponent
    },
    '_parentReactComponent': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: parentReactComponent
    },
    '_componentClass': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: ComponentClass
    },
    '_reactComponentClass': {
      writable: false,
      enumerable: false,
      configurable: false,
      value: ReactComponentClass
    },
    '_componentFactory': {
      writable: true,
      enumerable: false,
      configurable: false,
      value: definer
    },
    'internalName': {
      writable: true,
      enumerable: false,
      configurable: false,
      value: name
    },
    'displayName': {
      writable: true,
      enumerable: false,
      configurable: false,
      value: displayName
    },
    'resolvableProps': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: resolvableProps
    },
    'propTypes': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: propTypes
    },
    'defaultProps': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: defaultProps
    },
    'getComponentInternalName': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: () => name
    },
    'getComponentName': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: () => displayName
    },
    '_mixins': {
      writable: true,
      enumerable: false,
      configurable: true,
      value: mixins
    }
  };

  Object.defineProperties(ComponentClass, commonStaticProps);
  Object.defineProperties(ReactComponentClass, commonStaticProps);

  var componentFactoryHook = options.componentFactoryHook || ComponentClass._componentFactoryHook;
  if (typeof componentFactoryHook === 'function') {
    var classes = componentFactoryHook(ComponentClass, ReactComponentClass);
    ComponentClass = classes.ComponentClass;
    ReactComponentClass = classes.ReactComponentClass;
  }

  if (!global._components)
    global._components = {};

  global._components[name] = ReactComponentClass;

  return ReactComponentClass;
}

export function componentFactory(name, ...args) {
  const updateProperty = (obj, propName, value) => {
    var desc = Object.getOwnPropertyDescriptor(obj, propName);
    if (!desc)
      return;

    if (desc.configurable) {
      Object.defineProperty(obj, propName, {
        writable: true,
        enumerable: false,
        configurable: true,
        value: value
      });

      Object.defineProperty(obj, propName, Object.assign({}, desc, { value }));
    } else if (desc.writable) {
      obj[propName] = value;
    }
  };

  const functionalToReactComponent = (component, componentName) => {
    class ReactAmeliorateWrappedFunctionalComponent extends React.Component {
      render() {
        return component.call(this, this.props);
      }
    }

    updateProperty(ReactAmeliorateWrappedFunctionalComponent, 'name', componentName);
    updateProperty(ReactAmeliorateWrappedFunctionalComponent, 'displayName', componentName);

    return ReactAmeliorateWrappedFunctionalComponent;
  };

  if (typeof name === 'function') {
    var component = name,
        componentName = component.displayName || component.name;

    if (component._ameliorateComponent)
      return component;

    if (!('render' in component.prototype))
      component = functionalToReactComponent(component, componentName);

    class ReactAmeliorateWrappedComponent extends component {
      constructor(props, ...args) {
        super(props, ...args);

        Object.defineProperties(this, {
          '__id': {
            writable: true,
            enumerable: false,
            configurable: true,
            value: getUniqueComponentID('React')
          },
          'context': {
            enumerable: false,
            configurable: true,
            get: () => {
              return getParentComponentContext.call(this);
            },
            set: () => {}
          }
        });

        addComponentReference(this);
      }

      componentWillUnmount() {
        try {
          return (typeof super.componentWillUnmount === 'function') ? super.componentWillUnmount.apply(this, arguments) : undefined;
        } finally {
          removeComponentReference(this);
        }
      }

      getComponentID() {
        return this.__id;
      }

      render(...args) {
        var renderResult = super.render(...args);
        return processRenderedElements.call(this, renderResult).elements;
      }

      _contextFetcher() {
        var props = this.props,
            myProvider = this['getChildContext'],
            parent = getComponentReference(props[CONTEXT_PROVIDER_KEY]),
            context = {};

        if (parent && typeof parent._contextFetcher === 'function')
          context = (parent._contextFetcher.call(parent) || {});

        if (typeof myProvider === 'function')
          context = Object.assign(context, (myProvider() || {}));

        return context;
      }
    }

    updateProperty(ReactAmeliorateWrappedComponent, 'name', componentName);
    updateProperty(ReactAmeliorateWrappedComponent, 'displayName', componentName);

    copyStaticProperties(component, ReactAmeliorateWrappedComponent);

    return ReactAmeliorateWrappedComponent;
  } else {
    return _componentFactory.apply(this, arguments);
  }
}

export {
  PropTypes,
  ComponentBase,
  ReactComponentBase
};
