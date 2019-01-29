//###if(MOBILE) {###//
import { Text }                     from 'react-native';
//###} else {###//
import React                        from 'react';
import { flattenStyle }             from '../shim-utils';
import { filterObjectKeys }         from '@react-ameliorate/utils';

class Text extends React.Component {
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
      <span {...filterObjectKeys(/^(_|data-ra-|numberOfLines$|ellipsizeMode$)/, this.props)} style={flattenStyle([this.props.style, extraStyle])}>
        {this.props.children}
      </span>
    );
  }
}
//###}###//

export {
  Text
};
