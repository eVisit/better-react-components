import React                    from 'react';
import ComponentBase            from './component-base';
import PropTypes                from './prop-types';
import ReactComponentBase       from './react-component-base';

import {
  CONTEXT_PROVIDER_KEY,
  RAContext,
  copyStaticProperties,
  copyPrototypeFuncs,
  areObjectsEqualShallow
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

export function componentFactory(_name, definer, _options) {
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

    if (component && component._raReactComponentClass)
      return component._raReactComponentClass;

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
    return (name !== 'propTypes' && name !== 'defaultProps' && name !== 'contextType');
  });
  copyStaticProperties(parentReactComponent, ReactComponentClass, (name) => {
    return (name !== 'contextType');
  });

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
    '_raReactComponentClass': {
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

  // Wrap the component in the context so it can receive the context properly
  ReactComponentClass = (function(ReactComponentClass) {
    const ComponentClassContextType = ComponentClass.contextType;

    return React.forwardRef((props, ref) => {
      const renderComponent = (contextsProps) => {
        var finalProps = Object.assign({}, props, contextsProps);
        return (<ReactComponentClass ref={ref} {...finalProps}/>);
      };

      const renderWithContexts = (index, contextCount, contextsProps) => {
        if (index >= contexts.length)
          return renderComponent(contextsProps);

        var thisContext = contexts[index],
            thisConsumer = (thisContext && thisContext.Consumer);

        if (!thisConsumer)
          return renderWithContexts(index + 1, contextCount + 1, contextsProps);

        return (React.createElement(thisConsumer, {}, (context) => {
          contextsProps[`${CONTEXT_PROVIDER_KEY}-${contextCount}`] = context;
          return renderWithContexts(index + 1, contextCount + 1, contextsProps);
        }));
      };

      var contexts = [RAContext];
      if (ComponentClassContextType)
        contexts.push(ComponentClassContextType);

      return renderWithContexts(0, 0, {});
    });
  })(ReactComponentClass);

  global._components[name] = ReactComponentClass;
  return ReactComponentClass;
}

export {
  PropTypes,
  ComponentBase,
  ReactComponentBase
};
