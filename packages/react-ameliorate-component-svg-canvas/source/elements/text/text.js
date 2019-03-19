import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { SVGElementBase }               from '../element-base';
import styleSheet                       from './text-styles';

export const SVGText = componentFactory('SVGText', ({ Parent, componentName }) => {
  return class SVGText extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
    };

    render(_children) {
      return (
        <text {...this.passProps(this.props)}>{this.getChildren(_children)}</text>
      );
    }
  };
}, SVGElementBase);

export { styleSheet as svgTextBaseStyles };
