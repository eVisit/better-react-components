import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import { NavigationBar }                from '../navigation-bar';
import styleSheet                       from './navigator-styles';

const Navigator = componentFactory('Navigator', ({ Parent, componentName }) => {
  return class Navigator extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      pages: PropTypes.array,
      page: PropTypes.any,
      onRequestPageChange: PropTypes.func
    };

    constructor(props, ...args) {
      super(props, ...args);

      this._currentPage = null;
    }

    onTabPress({ tab, event }) {
      if (tab === this._currentPage)
        return;

      this._currentPage = tab;

      return this.callProvidedCallback('onRequestPageChange', { event, page: tab });
    }

    render(children) {
      return (
        <View className={this.getRootClassName(componentName)} style={this.style('container')}>
          <NavigationBar
            className={this.getRootClassName(componentName, 'navigatorTabs')}
            tabs={this.props.pages}
            tab={this.props.page}
            onTabPress={this.onTabPress}
          />

          <View
            className={this.getRootClassName(componentName, 'navigatorPageContainer')}
            style={this.style('pageContainer')}
          >
            {this.getChildren(children)}
          </View>
        </View>
      );
    }
  };
});

export { Navigator };
