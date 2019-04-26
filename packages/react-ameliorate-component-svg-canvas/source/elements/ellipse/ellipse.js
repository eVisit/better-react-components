import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { SVGElementBase }               from '../element-base';
import styleSheet                       from './ellipse-styles';

export const SVGEllipse = componentFactory('SVGEllipse', ({ Parent, componentName }) => {
  return class SVGEllipse extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
    };

    getPropsFromStyle(style) {
      var rawStyle = this.rawStyle({
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            borderWidth: 0,
            backgroundColor: 'transparent',
            borderColor: 'transparent'
          }, style),
          { width, height, borderWidth } = rawStyle;

      if (rawStyle.radius)
        width = height = rawStyle.radius;

      var halfBorderWidth = (rawStyle.boxSizing === 'border-box') ? (borderWidth * 0.5) : (-(borderWidth * 0.5));

      return {
        cx: rawStyle.top,
        cy: rawStyle.left,
        rx: width - halfBorderWidth,
        ry: height - halfBorderWidth,
        style: this.filterProps(/^(top$|left$|width$|height$|borderWidth$|backgroundColor$|borderColor$|data-ra-|radius)/, rawStyle, {
          fill: rawStyle.backgroundColor,
          stroke: rawStyle.borderColor,
          strokeWidth: rawStyle.borderWidth
        })
      };
    }

    render(_children) {
      var props = this.getPropsFromStyle(this.props.style);

      return super.render(
        <ellipse {...this.passProps(props)}>{this.getChildren(_children)}</ellipse>
      );
    }
  };
}, SVGElementBase);

export { styleSheet as svgEllipseBaseStyles };
