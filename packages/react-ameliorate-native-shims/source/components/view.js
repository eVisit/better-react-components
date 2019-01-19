//###if(MOBILE) {###//
export { View }                     from 'react-native';
//###} else {###//
import { utils as U, data as D }    from 'evisit-js-utils';
import React                        from 'react';
import { StyleSheetBuilder }        from '@react-ameliorate/styles';
import {
  sendOnLayoutEvent,
  findDOMNode,
  isElementOrDescendant
}                                   from '@react-ameliorate/utils';

export class View extends React.Component {
  getProps(providedProps) {
    var style = StyleSheetBuilder.flattenInternalStyleSheet(providedProps.style),
        className = [];

    if (providedProps.className)
      className.push(providedProps.className);

    if (style.flex === 0) {
      style.flex = 'none';
    } else if (style.flex === 1) {
      delete style.flex;

      if (!style.hasOwnProperty('flexGrow'))
        style.flexGrow = 1;

      if (!style.hasOwnProperty('flexShrink'))
        style.flexShrink = 1;

      if (!style.hasOwnProperty('flexBasis'))
        style.flexBasis = 'auto';
    } else {
      if (!style.hasOwnProperty('flexBasis'))
        style.flexBasis = 'auto';
    }

    var filteredProps = D.extend(D.extend.FILTER, (key, value) => ((value != null && value !== '') && !(('' + key).match(/^(_|onLayout$|children$|ref$|layoutContext$)/))), {}, providedProps, {
      className: className.join(' '),
      style
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
    var props = this.getProps(this.props);

    return (
      <div
        {...props}
        onMouseOver={(this.props.onMouseOver) ? this.onMouseOver : undefined}
        onMouseOut={(this.props.onMouseOut) ? this.onMouseOut : undefined}
        ref={this.viewRef}
      >
        {this.props.children || null}
      </div>
    );
  }
}
//###}###//
