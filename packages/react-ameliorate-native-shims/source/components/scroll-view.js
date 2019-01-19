//###if(MOBILE) {###//
export { ScrollView } from 'react-native';
//###} else {###//
import { View }       from './view';

export class ScrollView extends View {
  getProps(providedProps) {
    var props = super.getProps(providedProps),
        style = (props && props.style);

    if (style)
      style.overflow = 'auto';

    return props;
  }
}
//###}###//
