//###if(MOBILE) {###//
import { FlatList }                 from 'react-native';
//###} else {###//
import React                        from 'react';
import { VirtualizedList }          from './virtualized-list';
import FlatListPropTypes            from '../prop-types/flat-list';

class FlatList extends VirtualizedList {
  static propTypes = FlatListPropTypes;
  static defaultProps = {
    ...VirtualizedList.defaultProps,
    numColumns: 1
  };

  getProps(providedProps) {
    var props = super.getProps(providedProps);

    return {
      ...props,
      className: this.getClassName('raFlatList', props.className),
    };
  }

  componentDidMount() {
    super.componentDidMount.apply(this, arguments);
  }

  componentWillUnmount() {
    super.componentWillUnmount.apply(this, arguments);
  }

  renderItem(props, args) {
    var ItemSeparatorComponent = props.ItemSeparatorComponent;

    if (ItemSeparatorComponent)
      args.separators = [ ItemSeparatorComponent.call(this, args) ];

    return super.renderItem.call(this, props, args);
  }

  render(_props, _children) {
    return super.render(null);
  }
}
//###}###//

export {
  FlatList
};
