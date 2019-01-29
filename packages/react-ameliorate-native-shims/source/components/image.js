"use strict";

//###if(MOBILE) {###//
import { Image }              from 'react-native';
//###} else {###//
import React                  from 'react';
import { utils as U }         from 'evisit-js-utils';
import { flattenStyle }       from '../shim-utils';
import { filterObjectKeys }   from '@react-ameliorate/utils';

function getComponentProps(src, providedProps) {
  var style = flattenStyle(providedProps.style);

  style.backgroundImage = `url('${src}')`;
  style.backgroundOrigin = 'border-box';
  style.backgroundRepeat = 'no-repeat';
  style.backgroundPosition = 'center';
  style.backgroundClip = 'border-box';
  style.backgroundSize = (providedProps.resizeMode === 'stretch') ? ('100% 100%') : (providedProps.resizeMode || 'contain');

  return filterObjectKeys(/^(_|data-ra-|resizeMode$|source$|onLoadStart$|onLoadEnd$|testID$)/, providedProps, { style });
}

class Image extends React.Component {
  constructor(...args) {
    super(...args);

    if (typeof this.props.onLoadStart === 'function')
      this.props.onLoadStart.call(this, null);
  }

  render() {
    var src = this.props.source;
    if (src && !U.instanceOf(src, 'string', 'number', 'boolean', 'array'))
      src = src.uri;

    var props = getComponentProps(src, this.props);
    return (
      <div {...props}>{this.props.children || null}
        <img style={{ opacity: '0 !important', width: '1px', height: '1px', position: 'absolute' }} src={src} onLoad={this.props.onLoadEnd} onError={this.props.onLoadEnd}/>
      </div>
    );
  }
}
//###}###//

export {
  Image
};
