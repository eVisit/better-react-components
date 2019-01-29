//###if(MOBILE) {###//
import { ScrollView } from 'react-native';
//###} else {###//
import { View }               from './view';
import { filterObjectKeys }   from '@react-ameliorate/utils';

class ScrollView extends View {
  getProps(providedProps) {
    var props = super.getProps(providedProps),
        style = (props && props.style);

    if (this.props.scrollEnabled === false)
      style.overflow = 'hidden';
    else
      style.overflow = 'auto';

    return filterObjectKeys(/^(centerContent|showsVerticalScrollIndicator|automaticallyAdjustContentInsets|keyboardShouldPersistTaps|keyboardDismissMode|scrollEventThrottle|contentContainerStyle|contentInset|scrollEnabled|overScrollMode)$/, props);
  }
}
//###}###//

export {
  ScrollView
};
