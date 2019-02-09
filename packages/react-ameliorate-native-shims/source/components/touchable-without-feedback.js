//###if(MOBILE) {###//
import { TouchableWithoutFeedback } from 'react-native';
//###} else {###//
import Touchable                    from './touchable';
import TouchablePropTypes           from '../prop-types/touchable';

class TouchableWithoutFeedback extends Touchable {
  static propTypes = TouchablePropTypes;
}
//###}###//

export {
  TouchableWithoutFeedback
};
