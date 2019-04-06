//###if(MOBILE) {###//
import { View }                     from 'react-native';
//###} else {###//
import { utils as U }               from 'evisit-js-utils';
import React                        from 'react';
import {
  sendOnLayoutEvent,
  isElementOrDescendant,
  filterToNativeElementProps,
  findDOMNode
}                                   from '@react-ameliorate/utils';
import { flattenStyle }             from '../shim-utils';
import ViewPropTypes                from '../prop-types/view';

class View extends React.Component {
  static propTypes = ViewPropTypes;

  getClassName(...args) {
    return args.filter(Boolean).join(' ');
  }

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

    var pointerEvents = providedProps.pointerEvents;
    if (pointerEvents) {
      if (pointerEvents === 'box-none')
        pointerEvents = 'none';

      style.pointerEvents = pointerEvents;
    }

    return {
      ...providedProps,
      className: this.getClassName('raView', this.props.className),
      style,
      onMouseOver: (this.props.onMouseOver) ? this.onMouseOver : undefined,
      onMouseOut: (this.props.onMouseOut) ? this.onMouseOut : undefined,
      ref: this.viewRef
    };
  }

  sendOnLayoutEvent(callback) {
    sendOnLayoutEvent.call(this, callback, this.rootElement);
  }

  measure(resolve) {
    var me = findDOMNode(this);
    if (!me)
      return;

    resolve({
      x     : me.offsetLeft,
      y     : me.offsetTop,
      width : me.offsetWidth,
      height: me.offsetHeight
    });
  }

  measureInWindow(resolve) {
    var me = findDOMNode(this);
    if (!me)
      return;

    var rect = me.getBoundingClientRect();
    resolve({
      x     : rect.left,
      y     : rect.top,
      width : rect.width,
      height: rect.height
    });
  }

  measureLayout(node, resolve, reject) {
    var me = findDOMNode(this);

    if (!node || !me) {
      reject();
      return;
    }

    var rect1 = node.getBoundingClientRect(),
        rect2 = me.getBoundingClientRect();

    resolve({
      x     : (rect2.left - rect1.left),
      y     : (rect2.top  - rect1.top),
      width : rect2.width,
      height: rect2.height
    });
  }

  doOnLayout = (event) => {
    return this.sendOnLayoutEvent.call(this, this.props.onLayout);
  };

  onWindowResize = (event) => {
    this.doOnLayout(event);
  }

  viewRef = (elem) => {
    this.rootElement = elem;
    if (typeof this.props.domRef === 'function')
      this.props.domRef.call(this, elem);
  }

  componentDidMount() {
    if (typeof this.props.onLayout === 'function') {
      window.addEventListener('resize', this.onWindowResize);
      this.doOnLayout(null);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  componentDidUpdate(prevProps, prevState) {
    this.doOnLayout(null);
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

  render(_props, _children) {
    var props = (_props) ? _props : this.getProps.call(this, this.props),
        elementName = this.props.elementName || 'div',
        filteredProps = filterToNativeElementProps(props);

    filteredProps.style = flattenStyle(filteredProps.style);

    return React.createElement(elementName, filteredProps, (_children || this.props.children || null));
  }
}
//###}###//

export {
  View
};
