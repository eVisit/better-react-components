//###if(MOBILE) {###//
import { TouchableWithoutFeedback } from 'react-native';
//###} else {###//
import Touchable                    from './touchable';

class TouchableWithoutFeedback extends Touchable {
  render(...args) {
    return super.render(...args);
  }
}
//###}###//

export {
  TouchableWithoutFeedback
};
