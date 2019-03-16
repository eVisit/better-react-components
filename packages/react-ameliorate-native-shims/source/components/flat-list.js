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
  FlatList
};
