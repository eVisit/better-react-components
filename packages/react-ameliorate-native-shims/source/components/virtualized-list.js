//###if(MOBILE) {###//
import { VirtualizedList }          from 'react-native';
//###} else {###//
import React                        from 'react';
import { View }                     from './view';
import VirtualizedListPropTypes     from '../prop-types/virtualized-list';

class VirtualizedList extends View {
  static propTypes = VirtualizedListPropTypes;
  static defaultProps = {
    disableVirtualization: false,
    horizontal: false,
    initialNumToRender: 10,
    keyExtractor: (item, index) => {
      if (item.key != null)
        return item.key;

      return ('' + index);
    },
    maxToRenderPerBatch: 10,
    onEndReachedThreshold: 2, // multiples of length
    scrollEventThrottle: 50,
    updateCellsBatchingPeriod: 50,
    windowSize: 21, // multiples of length
  };

  componentDidMount() {
    super.componentDidMount.apply(this, arguments);
  }

  componentWillUnmount() {
    super.componentWillUnmount.apply(this, arguments);
  }

  render(_props, _children) {
    return super.render(null);
  }
}
//###}###//

export {
  VirtualizedList
};
