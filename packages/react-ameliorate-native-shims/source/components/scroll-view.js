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

  render(_props, _children) {
    var props = (_props) ? _props : this.getProps.call(this, this.props);

    return super.render(
      props,
      <View
        className="raScrollViewContent"
        style={props.contentContainerStyle}
      >
        {(_children || this.props.children || null)}
      </View>
    );
  }
}
//###}###//

export {
  ScrollView
};
