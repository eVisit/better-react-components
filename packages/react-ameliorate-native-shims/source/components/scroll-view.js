//###if(MOBILE) {###//
import { ScrollView } from 'react-native';
//###} else {###//
import { View }               from './view';
import ScrollViewPropTypes    from '../prop-types/scroll-view';

class ScrollView extends View {
  static propTypes = ScrollViewPropTypes;

  getProps(providedProps) {
    var props = super.getProps(providedProps),
        style = props.style;

    if (this.props.scrollEnabled === false)
      style.overflow = 'hidden';
    else
      style.overflow = 'auto';

    return {
      ...props,
      className: this.getClassName('raScrollView', this.props.className),
      style
    };
  }
}
//###}###//

export {
  ScrollView
};
