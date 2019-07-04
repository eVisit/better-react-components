import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { PagerBar }                     from '@react-ameliorate/component-pager-bar';
import styleSheet                       from './pager-styles';

export const Pager = componentFactory('Pager', ({ Parent, componentName }) => {
  return class Pager extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      // Props for PagerBar
      showIcons: PropTypes.bool,
      showCaptions: PropTypes.bool,
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
      activeTabCaptionContainerStyle: PropTypes.any,

      // Props for Pager
      onPageChange: PropTypes.func,
      tabBarStyle: PropTypes.any,
      pagerBarPlacement: PropTypes.oneOf(['north', 'south', 'west', 'east']),
      renderPage: PropTypes.func
    };

    static defaultProps = {
      pagerBarPlacement: 'north'
    };

    constructor(props, ...args) {
      super(props, ...args);
    }

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

    getTabBarPlacement() {
      return (this.props.pagerBarPlacement || 'north').toLowerCase();
    }

    async onTabPress({ tab, tabIndex, event }) {
      if ((await this.callProvidedCallback('onTabPress', { event, tab, tabIndex })) === false)
        return false;

      if (tabIndex === this.getState('activeTab'))
        return;

      if ((await this.callProvidedCallback('onPageChange', { event, tab, tabIndex })) === false)
        return false;

      this.setState({ activeTab: tabIndex });
    }

    renderPagerBar({ pagerBarPlacement, direction }) {
      return (
        <PagerBar
          {...this.passProps(this.props)}
          className={this.getClassName(componentName, 'tabs', this.props.className)}
          style={this.props.tabBarStyle}
          direction={direction}
          onTabPress={this.onTabPress}
        />
      );
    }

    _renderPagerBar({ pagerBarPlacement }) {
      var direction = (pagerBarPlacement.match(/north|south/i)) ? 'horizontal' : 'vertical';
      return this.renderPagerBar({ pagerBarPlacement, direction });
    }

    renderPage(args) {
      return this.callProvidedCallback('renderPage', args);
    }

    _renderPage({ children, pagerBarPlacement }) {
      var activeTab = this.getState('activeTab', 0),
          tab = this.props.tabs[activeTab],
          pageContainerNames = this.generateStyleNames(pagerBarPlacement, 'pageContainer');

      return (
        <View className={this.getClassName(componentName, pageContainerNames)} style={this.style(pageContainerNames)}>
          {this.renderPage({ activeTab, tab, children, pagerBarPlacement, pageContainerNames })}
        </View>
      );
    }

    render(_children) {
      var pagerBarPlacement = this.getTabBarPlacement(),
          children = this.getChildren(_children, true),
          containerNames = this.generateStyleNames(pagerBarPlacement, 'container'),
          renderPagerBarFirst = !!pagerBarPlacement.match(/west|north/i);

      return super.render(
        <View className={this.getRootClassName(componentName, containerNames)} style={this.style(containerNames)}>
          {(renderPagerBarFirst) && this._renderPagerBar({ pagerBarPlacement })}

          {this._renderPage({ children, pagerBarPlacement })}

          {(!renderPagerBarFirst) && this._renderPagerBar({ pagerBarPlacement })}
        </View>
      );
    }
  };
});

export { styleSheet as pagerStyles };
