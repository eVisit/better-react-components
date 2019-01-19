//###if(MOBILE) {###//
export { TouchableHighlight } from 'react-native';
//###} else {###//
import Touchable              from './touchable';

export class TouchableHighlight extends Touchable {
  render(...args) {
    return super.render(...args);
  }
}
//###}###//
