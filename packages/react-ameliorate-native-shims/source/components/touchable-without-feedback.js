//###if(MOBILE) {###//
export { TouchableWithoutFeedback } from 'react-native';
//###} else {###//
import Touchable                    from './touchable';

export class TouchableWithoutFeedback extends Touchable {
  render(...args) {
    return super.render(...args);
  }
}
//###}###//
