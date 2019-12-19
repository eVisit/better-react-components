//###if(MOBILE) {###//
import { Text }                       from 'react-native';
//###} else {###//
import React                          from 'react';
import { flattenStyle }               from '../shim-utils';
import { filterToNativeElementProps } from '@react-ameliorate/utils';
import TextPropTypes                  from '../prop-types/text';

class Text extends React.Component {
  static propTypes = TextPropTypes;

  getClassName(...args) {
    return args.filter(Boolean).join(' ');
  }

  getProps(providedProps) {
    var style = flattenStyle(providedProps.style);

    if (providedProps.numberOfLines === 1) {
      style.whiteSpace = 'nowrap';

      if (providedProps.ellipsizeMode) {
        style.overflow = 'hidden';
        style.textOverflow = (('' + providedProps.ellipsizeMode).toLowerCase() === 'clip') ? 'clip' : 'ellipsis';
      } else {
        style.textOverflow = 'clip';
      }
    }

    return {
      ...providedProps,
      className: this.getClassName('RAText', providedProps.className),
      style,
      'data-test-id' : providedProps.testID
    }
  }

  render() {
    var props = this.getProps(this.props);

    return (
      <span { ...filterToNativeElementProps(props) }>{this.props.children}</span>
    );
  }
}
//###}###//

export {
  Text
};
