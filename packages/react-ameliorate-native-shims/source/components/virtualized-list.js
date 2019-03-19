//###if(MOBILE) {###//
import { VirtualizedList }          from 'react-native';
//###} else {###//
import React                        from 'react';
import { View }                     from './view';
import { ScrollView }               from './scroll-view';
import VirtualizedListPropTypes     from '../prop-types/virtualized-list';

const styles = {
  rowStyle: {
    flex: 0
  }
};

class VirtualizedList extends View {
  static propTypes = VirtualizedListPropTypes;
  static defaultProps = {
    disableVirtualization: false,
    horizontal: false,
    initialNumToRender: 10,
    keyExtractor: function(item, index) {
      if (item.key != null)
        return ('' + item.key);

      return ('' + index);
    },
    getItem: function(data, index) {
      return data[index];
    },
    getItemCount: function(data) {
      if (!data)
        return 0;

      return (data.hasOwnProperty('length')) ? data.length : Object.keys(data).length;
    },
    maxToRenderPerBatch: 10,
    onEndReachedThreshold: 2, // multiples of length
    scrollEventThrottle: 50,
    updateCellsBatchingPeriod: 50,
    windowSize: 21, // multiples of length
  };

  getProps(providedProps) {
    var props = super.getProps(providedProps),
        style = props.style;

    if (style) {
      style.alignItems = 'stretch';
    }

    return {
      ...props,
      className: this.getClassName('raVirtualizedList', props.className),
    };
  }

  componentDidMount() {
    super.componentDidMount.apply(this, arguments);
  }

  componentWillUnmount() {
    super.componentWillUnmount.apply(this, arguments);
  }

  renderItem(props, args) {
    var renderItem = props.renderItem;
    if (typeof renderItem !== 'function')
      return null;

    var keyExtractor  = props.keyExtractor,
        key           = keyExtractor.call(this, args.item, args.index);

    return (
      <View key={key} className="raVirtualizedListItem" style={styles.rowStyle}>
        {renderItem.call(this, args)}
        {args.separators || null}
      </View>
    );
  }

  renderItems(props, _children) {
    var data = props.data;
    if (!data)
      return null;

    var finalItems      = [],
        data            = props.data,
        totalItems      = props.getItemCount.call(this, data),
        renderItemArgs  = { totalItems },
        getItem         = props.getItem;

    for (var i = 0, il = totalItems; i < il; i++) {
      renderItemArgs.last = ((i + 1) >= totalItems);
      renderItemArgs.item = getItem.call(this, data, i);
      renderItemArgs.index = i;

      finalItems.push(this.renderItem.call(this, props, renderItemArgs));
    }

    return finalItems;
  }

  renderHeaderComponent(props, _children) {
    var HeaderComponent       = props.ListHeaderComponent,
        HeaderComponentStyle  = props.ListHeaderComponentStyle;

    if (!HeaderComponent)
      return null;

    if (React.isValidElement(HeaderComponent))
      return HeaderComponent;

    return (<HeaderComponent style={HeaderComponentStyle}/>);
  }

  renderFooterComponent(props, _children) {
    var FooterComponent       = props.ListFooterComponent,
        FooterComponentStyle  = props.ListFooterComponentStyle;

    if (!FooterComponent)
      return null;

    if (React.isValidElement(FooterComponent))
      return FooterComponent;

    return (<FooterComponent style={FooterComponentStyle}/>);
  }

  render(_props, _children) {
    var props                 = (_props) ? _props : this.getProps.call(this, this.props);

    return super.render(props, (
      <React.Fragment>
        {this.renderHeaderComponent.call(this, props)}

        <ScrollView {...props}>
          {this.renderItems(props, _children)}
        </ScrollView>

        {this.renderFooterComponent.call(this, props)}

        {_children || null}
      </React.Fragment>
    ));
  }
}
//###}###//

export {
  VirtualizedList
};
