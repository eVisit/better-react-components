import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text, TouchableOpacity } from '@react-ameliorate/native-shims';
import { Icon }                         from '@react-ameliorate/component-icon';
import styleSheet                       from './pager-bar-styles';

export const PagerBar = componentFactory('PagerBar', ({ Parent, componentName }) => {
  return class PagerBar extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      tab: PropTypes.any,
      tabs: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
      onTabPress: PropTypes.func
    };

    onTabPress(tab, event) {
      return this.callProvidedCallback('onTabPress', { event, tab });
    }

    renderTabButton(tab, index) {
      var currentTab = this.props.tab,
          active = (currentTab === tab);

      //console.log('CURRENT TAB: ', currentTab, tab, active);

      return (
        <TouchableOpacity
          className={this.getRootClassName(componentName, 'pagerBarTab', (active) ? 'pagerBarTabActive' : null)}
          key={('' + index)}
          onPress={this.onTabPress.bind(this, tab)}
        >
          <View style={this.style('tabContainer', (active) ? 'tabContainerActive' : 'tabContainerNotActive')}>
            {(!!tab.icon) && (
              <View
                className={this.getRootClassName(componentName, 'pagerBarTabIcon', (active) ? 'pagerBarTabIconActive' : null)}
                style={this.style('tabIconContainer', (active) ? 'tabIconContainerActive' : 'tabIconContainerNotActive')}
              >
                <Icon icon={tab.icon} style={this.style('tabIcon', (active) ? 'tabIconActive' : 'tabIconNotActive')}/>
              </View>
            )}

            <View
              className={this.getRootClassName(componentName, 'pagerBarTabCaption', (active) ? 'pagerBarTabCaptionActive' : null)}
              style={this.style('tabCaptionContainer', (active) ? 'tabCaptionContainerActive' : 'tabCaptionContainerNotActive')}
            >
              <Text style={this.style('tabCaption', (active) ? 'tabCaptionActive' : 'tabCaptionNotActive')}>{tab.caption || ''}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    render() {
      var tabs = this.props.tabs || [];

      return (
        <View className={this.getRootClassName(componentName)} style={this.style('container')}>
          {tabs.map(this.renderTabButton)}
        </View>
      );
    }
  };
});

export { styleSheet as pagerBarStyles };
