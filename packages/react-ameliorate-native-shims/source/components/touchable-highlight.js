//###if(MOBILE) {###//
import { TouchableHighlight }       from 'react-native';
//###} else {###//
import Touchable                    from './touchable';
import TouchableHighlightPropTypes  from '../prop-types/touchable-highlight';

class TouchableHighlight extends Touchable {
  static propTypes = TouchableHighlightPropTypes;
}
//###}###//

export {
  TouchableHighlight
};
