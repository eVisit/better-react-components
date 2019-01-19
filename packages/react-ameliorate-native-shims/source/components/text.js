//###if(MOBILE) {###//
export { Text }                     from 'react-native';
//###} else {###//
import React                        from 'react';
import { StyleSheetBuilder }        from '@react-ameliorate/styles';
import { filterObjectKeys }         from '@react-ameliorate/utils';

export class Text extends React.Component {
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
      <span {...filterObjectKeys(/^(numberOfLines|ellipsizeMode)$/, this.props)} style={StyleSheetBuilder.flattenInternalStyleSheet([this.props.style, extraStyle])}>
        {this.props.children}
      </span>
    );
  }
}
//###}###//
