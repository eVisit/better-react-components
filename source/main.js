import ComponentBase              from './component-base';
import ReactComponentBase         from './react-component-base';
export {
  StyleSheetBuilder,
  createStyleSheet,
  buildCSSFromStyle,
  buildCSSFromStyles
}                                 from './styles/style-sheet';
export {
  Color,
  rebuildPallette,
  Constants
}                                 from './styles/colors';
export { Theme, ThemeProperties } from './styles/theme';

export function componentFactory(name, definer, _options) {
  if (!name)
    throw new TypeError('"name" is required to create a component');

  if (typeof definer !== 'function')
    throw new TypeError('"definer" callback is required to create a component');

  var options = _options || {},
      ReactBaseComponent = options.reactComponentBaseClass || ReactComponentBase,
      Parent = options.componentBase || ComponentBase,
      InstanceClass = definer(Object.assign({}, options, { Parent, name }));

  if (typeof InstanceClass !== 'function')
    throw new TypeError('"definer" callback must return a class or a function');

  class Component extends ReactBaseComponent {
    static getComponentName() {
      return name;
    }

    constructor(...args) {
      super(InstanceClass, ...args);
    }
  }

  Object.defineProperty(InstanceClass, 'getComponentName', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: () => name
  });

  return Component;
}

export {
  ComponentBase,
  ReactComponentBase
};
