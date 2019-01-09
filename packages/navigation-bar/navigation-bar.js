import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import { Text }                         from '../text';
import { TouchableOpacity }             from '../touchable-opacity';
import { Icon }                         from '../icon';
import styleSheet                       from './navigation-bar-styles';

const NavigationBar = componentFactory('NavigationBar', ({ Parent, componentName }) => {
  return class NavigationBar extends Parent {
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
          className={this.getRootClassName(componentName, 'navigationBarTab', (active) ? 'navigationBarTabActive' : null)}
          key={('' + index)}
          onPress={this.onTabPress.bind(this, tab)}
        >
          <View style={this.style('tabContainer', (active) ? 'tabContainerActive' : 'tabContainerNotActive')}>
            {(!!tab.icon) && (
              <View
                className={this.getRootClassName(componentName, 'navigationBarTabIcon', (active) ? 'navigationBarTabIconActive' : null)}
                style={this.style('tabIconContainer', (active) ? 'tabIconContainerActive' : 'tabIconContainerNotActive')}
              >
                <Icon icon={tab.icon} style={this.style('tabIcon', (active) ? 'tabIconActive' : 'tabIconNotActive')}/>
              </View>
            )}

            <View
              className={this.getRootClassName(componentName, 'navigationBarTabCaption', (active) ? 'navigationBarTabCaptionActive' : null)}
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

export { NavigationBar };
