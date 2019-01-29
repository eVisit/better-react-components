//###if(MOBILE) {###//
import { TouchableOpacity } from 'react-native';
//###} else {###//
import Touchable            from './touchable';

class TouchableOpacity extends Touchable {
  render(...args) {
    return super.render(...args);
  }
}
//###}###//

export {
  TouchableOpacity
};
