import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import styleSheet                       from './svg-canvas-styles';
import { findDOMNode }                  from '@base/utils';
import SVGJS                            from 'svg.js';

const SVGCanvas = componentFactory('SVGCanvas', ({ Parent, componentName }) => {
  return class SVGCanvas extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      onRender: PropTypes.func.isRequired
    };

    viewRef(elem) {
      var viewElement = this._viewElement = findDOMNode(elem),
          onRender = this.props.onRender;

      if (viewElement) {
        var _bb = viewElement.getBoundingClientRect(),
            boundingBox = {
              x: _bb.x,
              y: _bb.y,
              top: _bb.top,
              left: _bb.left,
              right: _bb.right,
              bottom: _bb.bottom,
              width: _bb.width,
              height: _bb.height,
            };

        var canvas = this._canvas = SVGJS(viewElement);
        onRender(canvas, boundingBox);
      }
    }

    render() {
      return (<View ref={this.viewRef}className={this.getRootClassName(componentName)} style={this.style('container', this.props.style)}/>);
    }
  };
});

SVGCanvas.Text = function(props) {
  return null;
};

export { SVGCanvas };
