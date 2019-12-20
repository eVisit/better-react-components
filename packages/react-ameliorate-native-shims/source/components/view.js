//###if(MOBILE) {###//
import { View }                     from 'react-native';
//###} else {###//
import React                        from 'react';
import {
  sendOnLayoutEvent,
  filterToNativeElementProps,
  findDOMNode,
  assignRef
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
      className: this.getClassName('RAView', this.props.className),
      style,
      onMouseEnter: (this.props.onMouseEnter) ? this.onMouseEnter : undefined,
      onMouseLeave: (this.props.onMouseLeave) ? this.onMouseLeave : undefined,
      ref: this.viewRef,
      'data-test-id' : providedProps.testID
    };
  }

  sendOnLayoutEvent(callback) {
    sendOnLayoutEvent.call(this, callback, this.rootElement);
  }

  measure(resolve) {
    var me = findDOMNode(this);
    if (!me)
      return;

    resolve(
      me.offsetLeft,
      me.offsetTop,
      me.offsetWidth,
      me.offsetHeight
    );
  }

  measureInWindow(resolve) {
    var me = findDOMNode(this);
    if (!me)
      return;

    var rect = me.getBoundingClientRect();
    resolve(
      rect.left,
      rect.top,
      rect.width,
      rect.height
    );
  }

  measureLayout(node, resolve, reject) {
    var me = findDOMNode(this);

    if (!node || !me) {
      reject();
      return;
    }

    var rect1 = node.getBoundingClientRect(),
        rect2 = me.getBoundingClientRect();

    resolve(
      (rect2.left - rect1.left),
      (rect2.top  - rect1.top),
      rect2.width,
      rect2.height
    );
  }

  doOnLayout = (event) => {
    return this.sendOnLayoutEvent.call(this, this.props.onLayout);
  };

  onWindowResize = (event) => {
    this.doOnLayout(event);
  }

  viewRef = (elem) => {
    this.rootElement = elem;
    assignRef(this.props.domRef, elem);
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

  onMouseEnter = (event) => {
    if (typeof this.props.onMouseEnter === 'function')
      return this.props.onMouseEnter.call(this, event);
  }

  onMouseLeave = (event) => {
    if (typeof this.props.onMouseLeave === 'function')
      return this.props.onMouseLeave.call(this, event);
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
