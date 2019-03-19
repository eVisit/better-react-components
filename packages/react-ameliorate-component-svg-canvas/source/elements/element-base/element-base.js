import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import styleSheet                       from './element-base-styles';

export const SVGElementBase = componentFactory('SVGElementBase', ({ Parent, componentName }) => {
  return class SVGElementBase extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
    };

    _getStyleSheetBuilderClass(StyleSheetBuilder) {
      return class SVGCanvasStyleSheetBuilder extends StyleSheetBuilder {
        _expandStyleProps(parentName, props) {
          return props;
        }
      };
    }

    rawStyle(defaultValues, ...args) {
      const isEmpty = (value) => {
        if (value == null || value === '')
          return true;

        if (typeof value === 'number' && !isFinite(value))
          return true;

        return false;
      };

      var thisRawStyle = super.rawStyle(...args),
          keys = Object.keys(defaultValues || {});

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            value = thisRawStyle[key];

        if (isEmpty(value))
          thisRawStyle[key] = defaultValues[key];
      }

      return thisRawStyle;
    }
  };
});

export { styleSheet as svgElementBaseStyles };
