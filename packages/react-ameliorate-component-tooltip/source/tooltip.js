import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View, Text }                   from '@react-ameliorate/native-shims';
import { Popup }                        from '@react-ameliorate/component-popup';
import styleSheet                       from './tooltip-styles';

export const Tooltip = componentFactory('Tooltip', ({ Parent, componentName }) => {
  return class Tooltip extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      containerStyle: PropTypes.any,
      caption: PropTypes.string,
      captionStyle: PropTypes.any
    };

    static defaultProps = {
      pointerEvents: "none"
    };

    resolveProps() {
      var props = super.resolveProps.apply(this, arguments);

      if (!props.id)
        props.id = this.getComponentID();

      return props;
    }

    render(_children) {
      const formatCaption = (_caption) => {
        var caption = _caption;
        if (caption == null || caption === '')
          caption = '';

        return ('' + caption).split(/[\r\n]/g).reduce((result, line, i, a) => {
          result.push(line);
          if (i < a.length)
            result.push(<br key={i}/>);
          return result;
        }, []);
      };

      var caption = this.props.caption;

      return super.render(
        <View
          className={this.getRootClassName(componentName, 'tooltipContainer')}
          style={this.style('tooltipContainer', this.props.containerStyle)}
        >
          <Text style={this.style('tooltipCaption', this.props.captionStyle)}>{formatCaption(caption)}</Text>
        </View>
      );
    }
  };
}, Popup);

export { styleSheet as tooltipStyles };
