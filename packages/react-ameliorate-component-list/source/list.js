import React                              from 'react';
import { componentFactory, PropTypes }    from '@react-ameliorate/core';
import { FlatList }                       from '@react-ameliorate/native-shims';
import styleSheet                         from './list-styles';

export const List = componentFactory('List', ({ Parent, componentName }) => {
  return class List extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      ...FlatList.propTypes
    }

    renderList() {
      return (
        <FlatList
          {...this.props}
        />
      );
    }

    render(_children) {
      return super.render(this.renderList(_children));
    }
  };
});

export { styleSheet as listStyles };
