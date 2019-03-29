"use strict";

//###if(MOBILE) {###//
import { Image }              from 'react-native';
//###} else {###//
import React                  from 'react';
import { utils as U }         from 'evisit-js-utils';
import { View }               from './view';
import ImagePropTypes         from '../prop-types/image';

class Image extends View {
  static propTypes = ImagePropTypes;

  constructor(...args) {
    super(...args);

    if (typeof this.props.onLoadStart === 'function')
      this.props.onLoadStart.call(this, null);
  }

  getProps(providedProps) {
    var props = super.getProps(providedProps),
        src = props.source,
        style = props.style;

    if (src && !U.instanceOf(src, 'string', 'number', 'boolean', 'array'))
      src = src.uri;

    style.backgroundImage = `url('${src}')`;
    style.backgroundOrigin = 'border-box';
    style.backgroundRepeat = 'no-repeat';
    style.backgroundPosition = 'center';
    style.backgroundClip = 'border-box';
    style.backgroundSize = (providedProps.resizeMode === 'stretch') ? ('100% 100%') : (providedProps.resizeMode || 'contain');

    return {
      ...props,
      className: this.getClassName('raImage', this.props.className),
      src,
      style
    };
  }

  renderImage(props) {
    var src = props.src;

    return (
      <img
        style={{ opacity: 0, width: '1px', height: '1px', position: 'absolute', visibility: 'none' }}
        src={src}
        onLoad={props.onLoadEnd}
        onError={props.onLoadEnd}
      />
    );
  }

  render(_props, _children) {
    var props = this.getProps.call(this, this.props);

    return super.render(
      props,
      (_children) ? _children : this.renderImage(props)
    );
  }
}
//###}###//

export {
  Image
};
