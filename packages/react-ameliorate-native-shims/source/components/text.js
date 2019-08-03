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

      if (this.props.ellipsizeMode) {
        extraStyle.overflow = 'hidden';
        extraStyle.textOverflow = (('' + this.props.ellipsizeMode).toLowerCase() === 'clip') ? 'clip' : 'ellipsis';
      } else {
        extraStyle.textOverflow = 'clip';
      }
    }

    return (
      <span className="RAText" {...filterToNativeElementProps(this.props)} style={flattenStyle([ this.props.style, extraStyle ])}>{this.props.children}</span>
    );
  }
}
//###}###//

export {
  Text
};
