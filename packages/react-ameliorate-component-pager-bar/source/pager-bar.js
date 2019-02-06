import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text, TouchableOpacity } from '@react-ameliorate/native-shims';
import { Icon }                         from '@react-ameliorate/component-icon';
import styleSheet                       from './pager-bar-styles';

export const PagerBar = componentFactory('PagerBar', ({ Parent, componentName }) => {
  return class PagerBar extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      showIcons: PropTypes.bool,
      showCaptions: PropTypes.bool,
      direction: PropTypes.string,
      activeTab: PropTypes.number,
      tabs: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
      onTabPress: PropTypes.func,
      tabStyle: PropTypes.any,
      tabIconStyle: PropTypes.any,
      tabCaptionStyle: PropTypes.any,
      tabContainerStyle: PropTypes.any,
      tabIconContainerStyle: PropTypes.any,
      tabCaptionContainerStyle: PropTypes.any,
      activeTabStyle: PropTypes.any,
      activeTabIconStyle: PropTypes.any,
      activeTabCaptionStyle: PropTypes.any,
      activeTabContainerStyle: PropTypes.any,
      activeTabIconContainerStyle: PropTypes.any,
      activeTabCaptionContainerStyle: PropTypes.any
    };

    onPropUpdated_activeTab(value) {
      this.setState({ activeTab: value });
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          activeTab: 0
        })
      };
    }

    onTabPress(tab, tabIndex, event) {
      if (this.callProvidedCallback('onTabPress', { event, tab, tabIndex }) === false)
        return false;

      this.setState({ activeTab: tabIndex });
    }

    getDirection() {
      return (this.props.direction || 'horizontal').toLowerCase();
    }

    renderTabButton(tab, index) {
      var activeTab                 = this.getState('activeTab'),
          active                    = (activeTab === index),
          direction                 = this.getDirection(),
          flags                     = { active },
          tabContainerNames         = this.generateStyleNames(direction, 'tabContainer', flags),
          tabIconContainerNames     = this.generateStyleNames(direction, 'tabIconContainer', flags),
          tabIconNames              = this.generateStyleNames(direction, 'tabIcon', flags),
          tabCaptionContainerNames  = this.generateStyleNames(direction, 'tabCaptionContainer', flags),
          tabCaptionNames           = this.generateStyleNames(direction, 'tabCaption', flags);

      //console.log('CURRENT TAB: ', currentTab, tab, active);

      return (
        <TouchableOpacity
          className={this.getRootClassName(componentName, tabContainerNames)}
          key={('' + index)}
          onPress={this.onTabPress.bind(this, tab, index)}
          style={this.style(this.generateStyleNames(direction, 'tabTouchableContainer', flags))}
        >
          <View style={this.style(tabContainerNames, this.props.tabStyle, active && this.props.activeTabStyle)}>
            {(!!tab.icon && this.props.showIcons !== false) && (
              <View className={this.getClassName(componentName, tabIconContainerNames)} style={this.style(tabIconContainerNames, this.props.tabContainerStyle, active && this.props.activeTabContainerStyle)}>
                <Icon
                  className={this.getClassName(componentName, tabIconNames)}
                  icon={tab.icon}
                  style={this.style(tabIconNames, this.props.tabIconStyle, active && this.props.activeTabIconStyle)}
                />
              </View>
            )}

            {(!!tab.icon && this.props.showCaptions !== false) && (
              <View className={this.getClassName(componentName, tabCaptionContainerNames)} style={this.style(tabCaptionContainerNames, this.props.tabCaptionContainerStyle, active && this.props.activeTabCaptionContainerStyle)}>
                <Text className={this.getClassName(componentName, tabCaptionNames)} style={this.style(tabCaptionNames, this.props.tabCaptionStyle, active && this.props.activeTabCaptionStyle)}>{tab.caption || ''}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    getContainerStyle(...args) {
      var direction = this.getDirection();
      return this.style('container', this.generateStyleNames(direction, 'container'), ...args, this.props.style);
    }

    render() {
      var direction = this.getDirection(),
          tabs = this.props.tabs || [];

      return (
        <View className={this.getRootClassName(componentName, this.generateStyleNames(direction, 'container'))} style={this.getContainerStyle()}>
          {tabs.map(this.renderTabButton)}
        </View>
      );
    }
  };
});

export { styleSheet as pagerBarStyles };
