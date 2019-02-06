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
      pagerBarPlacement: PropTypes.oneOf(['north', 'south', 'west', 'east'])
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

    onTabPress({ tab, tabIndex, event }) {
      if (tabIndex === this.getState('activeTab'))
        return;

      if (this.callProvidedCallback('onPageChange', { event, tab, tabIndex }) === false)
        return false;

      this.setState({ activeTab: tabIndex });
    }

    getPagerBarComponent() {
      return PagerBar;
    }

    renderPagerBar({ pagerBarPlacement }) {
      var PagerBarComponent = this.getPagerBarComponent();

      return (
        <PagerBarComponent
          {...this.passProps(this.props)}
          className={this.getClassName(componentName, 'tabs', this.props.className)}
          style={this.props.tabBarStyle}
          direction={(pagerBarPlacement.match(/north|south/i)) ? 'horizontal' : 'vertical'}
        />
      );
    }

    renderPage({ component, tab, tabIndex, children, pagerBarPlacement }) {

    }

    renderPages({ children, pagerBarPlacement }) {
      return children.map((page, index) => {
        var tab = this.props.tab[index],
            tabIndex = index;

        return this.renderPage({ page, tab, tabIndex, children, pagerBarPlacement });
      });
    }

    render(_children) {
      var pagerBarPlacement = this.getTabBarPlacement(),
          children = this.getChildren(_children, true),
          containerNames = this.generateStyleNames(pagerBarPlacement, 'container'),
          pageContainerNames = this.generateStyleNames(pagerBarPlacement, 'pageContainer'),
          renderPagerBarFirst = !!pagerBarPlacement.match(/west|north/i);

      console.log('PAGER CONTAINER NAMES: ', containerNames);

      return (
        <View className={this.getRootClassName(componentName, containerNames)} style={this.style(containerNames)}>
          {(renderPagerBarFirst) && this.renderPagerBar({ pagerBarPlacement })}

          <View className={this.getClassName(componentName, pageContainerNames)} style={this.style(pageContainerNames)}>
            {this.renderPages({ children, pagerBarPlacement })}
          </View>

          {(!renderPagerBarFirst) && this.renderPagerBar({ pagerBarPlacement })}
        </View>
      );
    }
  };
});

export { styleSheet as pagerStyles };
