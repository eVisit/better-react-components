import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text, TouchableOpacity } from '@react-ameliorate/native-shims';
import { Icon }                         from '@react-ameliorate/component-icon';
import { Button }                       from '@react-ameliorate/component-button';
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

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments),
          tabs  = props.tabs;

      if (typeof tabs === 'function')
        props.tabs = tabs.call(this);

      return props;
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

    renderTabButton(args) {
      var {
        children,
        activeTab,
        tab,
        tabIndex,
        active,
        direction,
        flags,
        tabButtonNames,
        tabIconNames,
        tabCaptionNames
      } = args;

      return (
        <Button
          className={this.getRootClassName(componentName, tabButtonNames)}
          key={('' + tabIndex)}
          onPress={this.onTabPress.bind(this, tab, tabIndex)}
          style={this.style(this.generateStyleNames(direction, 'buttonContainer', flags))}
          internalContainerStyle={this.style(tabButtonNames, this.props.tabStyle, active && this.props.activeTabStyle)}
          leftIcon={(!!tab.icon && this.props.showIcons !== false) ? tab.icon : null}
          leftIconStyle={this.style(tabIconNames, this.props.tabIconStyle, active && this.props.activeTabIconStyle)}
          caption={(!!tab.caption && this.props.showCaptions !== false) ? tab.caption : null}
          captionStyle={this.style(tabCaptionNames, this.props.tabCaptionStyle, active && this.props.activeTabCaptionStyle)}
          tooltip={tab.tooltip}
          tooltipSide={tab.tooltipSide}
        >
          {(args, button) => {
            return (
              <React.Fragment>
                {button.renderDefaultContent(args)}

                {children}

                {(typeof tab.renderExtra === 'function') ? tab.renderExtra.call(this, args) : null}
              </React.Fragment>
            );
          }}
        </Button>
      );
    }

    // {(!!tab.icon && this.props.showIcons !== false) && (
    //   <View className={this.getClassName(componentName, tabIconContainerNames)} style={this.style(tabIconContainerNames, this.props.tabContainerStyle, active && this.props.activeTabContainerStyle)}>
    //     <Icon
    //       className={this.getClassName(componentName, tabIconNames)}
    //       icon={tab.icon}

    //     />
    //   </View>
    // )}

    // {(!!tab.caption && this.props.showCaptions !== false) && (
    //   <View className={this.getClassName(componentName, tabCaptionContainerNames)} style={this.style(tabCaptionContainerNames, this.props.tabCaptionContainerStyle, active && this.props.activeTabCaptionContainerStyle)}>
    //     <Text className={this.getClassName(componentName, tabCaptionNames)} style={this.style(tabCaptionNames, this.props.tabCaptionStyle, active && this.props.activeTabCaptionStyle)}>{tab.caption || ''}</Text>
    //   </View>
    // )}

    _renderTabButton({ tab, tabIndex }) {
      var activeTab                 = this.getState('activeTab'),
          active                    = (activeTab === tabIndex),
          direction                 = this.getDirection(),
          flags                     = { active },
          tabButtonNames            = this.generateStyleNames(direction, 'tabButton', flags),
          tabIconNames              = this.generateStyleNames(direction, 'tabIcon', flags),
          tabCaptionNames           = this.generateStyleNames(direction, 'tabCaption', flags);

      return this.renderTabButton({
        activeTab,
        tab,
        tabIndex,
        active,
        direction,
        flags,
        tabButtonNames,
        tabIconNames,
        tabCaptionNames
      });
    }

    getContainerStyle(...args) {
      var direction = this.getDirection();
      return this.style('container', this.generateStyleNames(direction, 'container'), ...args, this.props.style);
    }

    render(_children) {
      var direction = this.getDirection(),
          tabs = this.props.tabs || [];

      return super.render(
        <View className={this.getRootClassName(componentName, this.generateStyleNames(direction, 'container'))} style={this.getContainerStyle()}>
          {tabs.map((tab, tabIndex) => this._renderTabButton({ tab, tabIndex }))}
          {this.getChildren(_children)}
        </View>
      );
    }
  };
});

export { styleSheet as pagerBarStyles };
