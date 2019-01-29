//###if(MOBILE) {###//
import { TouchableHighlight } from 'react-native';
//###} else {###//
import Touchable              from './touchable';

class TouchableHighlight extends Touchable {
  render(...args) {
    return super.render(...args);
  }
}
//###}###//

export {
  TouchableHighlight
};
