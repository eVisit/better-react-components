import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import styleSheet                       from './svg-canvas-styles';

export const SVGCanvas = componentFactory('SVGCanvas', ({ Parent, componentName }) => {
  return class SVGCanvas extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
    };

    render(_children) {
      return super.render(
        <svg height="100%" width="100%" viewBox="-1 -1 2 2" style={this.props.style}>
          {this.getChildren(_children)}
        </svg>
      );
    }
  };
});

export { styleSheet as svgCanvasStyles };

export * from './elements/element-base';
export * from './elements/ellipse';
export * from './elements/text';
