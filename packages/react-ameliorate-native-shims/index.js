
//###if(MOBILE) {###//
export {
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
  Text,
  ScrollView,
  TextInput,
  WebView
} from 'react-native';
//###} else {###//

export {
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Text,
  ScrollView,
  TextInput
} from 'react-native-web';

import React from 'react';
import { View as ViewBase } from 'react-native-web';

const View = React.forwardRef((props, ref) => {
  return (<ViewBase ref={ref} {...props} style={[{ flexBasis: 'auto' }, props.style]}/>);
});

export {
  View
};

export * from './source/components/web-view';

//###}###//
