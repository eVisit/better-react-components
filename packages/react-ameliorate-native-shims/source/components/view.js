//###if(MOBILE) {###//
import { View }                     from 'react-native';
//###} else {###//
import { utils as U }               from 'evisit-js-utils';
import React                        from 'react';
import {
  sendOnLayoutEvent,
  findDOMNode,
  isElementOrDescendant,
  filterObjectKeys
}                                   from '@react-ameliorate/utils';
import { flattenStyle }             from '../shim-utils';

class View extends React.Component {
  getProps(providedProps) {
    var style = flattenStyle(providedProps.style);

    if (style.flex === 0) {
      style.flex = 'none';
    } else if (typeof style.flex === 'number') {
      var flex = style.flex;
      delete style.flex;

      if (!style.hasOwnProperty('flexGrow'))
        style.flexGrow = flex;

      if (!style.hasOwnProperty('flexShrink'))
        style.flexShrink = flex;

      if (!style.hasOwnProperty('flexBasis'))
        style.flexBasis = 'auto';
    } else {
      if (!style.hasOwnProperty('flexBasis'))
        style.flexBasis = 'auto';
    }

    var filteredProps = filterObjectKeys(/^(_|onLayout$|layoutContext$|enableAnimation$|testID$|elementName$)/, providedProps, {
      className: providedProps.className,
      style,
      onMouseOver: (this.props.onMouseOver) ? this.onMouseOver : undefined,
      onMouseOut: (this.props.onMouseOut) ? this.onMouseOut : undefined,
      ref: this.viewRef
    });

    return filteredProps;
  }

  onWindowResize = (event) => {
    sendOnLayoutEvent.call(this, this.props.onLayout, this.rootElement);
  }

  viewRef = (elem) => {
    this.rootElement = findDOMNode(elem);
  }

  componentDidMount() {
    if (typeof this.props.onLayout === 'function') {
      window.addEventListener('resize', this.onWindowResize);
      sendOnLayoutEvent.call(this, this.props.onLayout, this.rootElement);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  componentDidUpdate(prevProps, prevState) {
    sendOnLayoutEvent.call(this, prevProps.onLayout, this.rootElement);
  }

  onMouseOver = (event) => {
    // If we leave the root element then we are no longer hovering (we do not need to test children)
    var nativeElem = U.get(event, 'nativeEvent.toElement');
    if (!isElementOrDescendant(this.rootElement, nativeElem))
      return;

    if (typeof this.props.onMouseOver === 'function')
      return this.props.onMouseOver.call(this, event);
  }

  onMouseOut = (event) => {
    // If we leave the root element then we are no longer hovering (we do not need to test children)
    var nativeEvent = event.nativeEvent,
        nativeElem = U.get(nativeEvent, 'toElement');

    if (isElementOrDescendant(this.rootElement, nativeElem))
      return;

    if (typeof this.props.onMouseOut === 'function')
      return this.props.onMouseOut.call(this, event);
  }

  render() {
    var props = this.getProps.call(this, this.props),
        elementName = this.props.elementName || 'div';

    return React.createElement(elementName, props, this.props.children || null);
  }
}
//###}###//

export {
  View
};
