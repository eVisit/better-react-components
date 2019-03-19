//###if(MOBILE) {###//
import { Text }                       from 'react-native';
//###} else {###//
import React                          from 'react';
import { flattenStyle }               from '../shim-utils';
import { filterToNativeElementProps } from '@react-ameliorate/utils';
import TextPropTypes                  from '../prop-types/text';

class Text extends React.Component {
  static propTypes = TextPropTypes;

  render() {
    var extraStyle = {};

    if (this.props.numberOfLines === 1) {
      extraStyle.whiteSpace = 'nowrap';
      extraStyle.overflow = 'hidden';

      if (this.props.ellipsizeMode)
        extraStyle.textOverflow = (('' + this.props.ellipsizeMode).toLowerCase() === 'clip') ? 'clip' : 'ellipsis';
      else
        extraStyle.textOverflow = 'ellipsis';
    }

    return (
      <span {...filterToNativeElementProps(this.props)} style={flattenStyle([ this.props.style, extraStyle ])}>{this.props.children}</span>
    );
  }
}
//###}###//

export {
  Text
};
