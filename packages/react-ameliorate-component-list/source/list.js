import React                              from 'react';
import { componentFactory, PropTypes }    from '@react-ameliorate/core';
import { View, FlatList }                 from '@react-ameliorate/native-shims';
import styleSheet                         from './list-styles';

export const List = componentFactory('List', ({ Parent, componentName }) => {
  return class List extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      ...FlatList.propTypes
    }

    static defaultProps = {
      ...FlatList.defaultProps,
      keyExtractor: function(item, index) {
        if (!item)
          return ('' + index);

        if (item.id != null)
          return ('' + item.id);

        if (item.key != null)
          return ('' + item.key);

        return ('' + index);
      }
    }

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments);

      return {
        ItemSeparatorComponent: (props) => {
          return (<View key={('' + props.index)} style={this.style('separator')}/>);
        },
        ...props
      };
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
