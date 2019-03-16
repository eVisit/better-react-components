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
      src,
      style
    };
  }

  render(_props, _children) {
    var props = this.getProps.call(this, this.props),
        src = props.src;

    return super.render(
      props,
      (_children) ? _children : (<img style={{ opacity: '0 !important', width: '1px', height: '1px', position: 'absolute' }} src={src} onLoad={this.props.onLoadEnd} onError={this.props.onLoadEnd}/>)
    );
  }
}
//###}###//

export {
  Image
};
