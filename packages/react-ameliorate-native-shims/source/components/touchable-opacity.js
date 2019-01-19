//###if(MOBILE) {###//
export { TouchableOpacity } from 'react-native';
//###} else {###//
import Touchable            from './touchable';

export class TouchableOpacity extends Touchable {
  render(...args) {
    return super.render(...args);
  }
}
//###}###//
