//###if(MOBILE) {###//
import { TouchableOpacity }       from 'react-native';
//###} else {###//
import Touchable                  from './touchable';
import TouchableOpacityPropTypes  from '../prop-types/touchable-opacity';

class TouchableOpacity extends Touchable {
  static propTypes = TouchableOpacityPropTypes;
}
//###}###//

export {
  TouchableOpacity
};
