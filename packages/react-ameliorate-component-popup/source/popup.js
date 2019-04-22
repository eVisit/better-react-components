import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Paper }                        from '@react-ameliorate/component-paper';
import { capitalize }                   from '@react-ameliorate/utils';
import styleSheet                       from './popup-styles';

const ARROW_SHIFT_AMOUNT_RATIO = 0.5;
const ARROW_SHIFT_TABLE = {
  arrowHCenter: {
    axis: 'x',
    value: -ARROW_SHIFT_AMOUNT_RATIO
  },
  arrowVCenter: {
    axis: 'y',
    value: -ARROW_SHIFT_AMOUNT_RATIO
  },
  arrowDown: {
    axis: 'y',
    value: ARROW_SHIFT_AMOUNT_RATIO
  },
  arrowUp: {
    axis: 'y',
    value: -ARROW_SHIFT_AMOUNT_RATIO
  },
  arrowLeft: {
    axis: 'x',
    value: -ARROW_SHIFT_AMOUNT_RATIO
  },
  arrowRight: {
    axis: 'x',
    value: ARROW_SHIFT_AMOUNT_RATIO
  }
};

export const Popup = componentFactory('Popup', ({ Parent, componentName }) => {
  return class Popup extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      ...Paper.propTypes,
      hasArrow: PropTypes.bool,
      arrowStyle: PropTypes.any,
      innerContainerStyle: PropTypes.any
    };

    static defaultProps = {
      _raMeasurable: true,
      hasArrow: true,
      autoClose: true,
      onShouldClose: ({ childProps, action }) => {
        if (action === 'add')
          return false;

        if (action === 'close' && childProps.autoClose)
          return true;
      }
    };

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          quadrantX: '',
          quadrantY: '',
          quadrantValues: null
        })
      };
    }

    onMounted(args) {
      if (this.callProvidedCallback('onMounted', args) === false)
        return false;
    }

    onPositionUpdated({ position }) {
      this.setState({
        quadrantX       : capitalize(U.get(position, 'quadrant.x', '')),
        quadrantY       : capitalize(U.get(position, 'quadrant.y', '')),
        quadrantValues  : U.get(position, 'quadrant.values', null),
      });
    }

    getTransformStyle(arrowStyle, styles) {
      var transform = [{ translateX: 0 }, { translateY: 0 }],
          arrowSize = arrowStyle.width;

      for (var i = 0, il = styles.length; i < il; i++) {
        var style = styles[i],
            shift = ARROW_SHIFT_TABLE[style];

        if (!shift)
          continue;

        var index   = (shift.axis === 'x') ? 0 : 1,
            key     = (!index) ? 'translateX' : 'translateY';

        transform[index][key] = arrowSize * shift.value;
      }

      return {
        transform
      };
    }

    getArrowStyle() {
      var quadrantValues = this.getState('quadrantValues');
      if (!quadrantValues)
        return;

      var {
            horizontal,
            vertical,
            targetSideX,
            targetSideY
          } = quadrantValues,
          _horizontal = Math.abs(horizontal),
          _vertical = Math.abs(vertical);

      console.log('Quadrant values: ', quadrantValues);

      // Is popup on a corner? If so, don't do an arrow
      if (_horizontal === 2 && _vertical === 2)
        return;

      // Is popup inside? If so, don't do an arrow
      if (_horizontal < 2 && _vertical < 2)
        return;

      var styles = [];

      if (targetSideX === 0)
        styles.push('arrowHCenter');
      else
        styles.push((targetSideX > 0) ? 'arrowHLeft' : 'arrowHRight');

      if (targetSideY === 0)
        styles.push('arrowVCenter');
      else
        styles.push((targetSideY > 0) ? 'arrowVTop' : 'arrowVBottom');

      if (vertical === -2)
        styles.push('arrowDown');
      else if (vertical === 2)
        styles.push('arrowUp');

      if (horizontal === 2)
        styles.push('arrowLeft');
      else if (horizontal === -2)
        styles.push('arrowRight');

      var arrowStyle = this.rawStyle('arrow', this.props.arrowStyle);

      return this.style('arrow', styles, this.getTransformStyle(arrowStyle, styles), this.props.arrowStyle);
    }

    render(children) {
      var { quadrantX, quadrantY, quadrantValues } = this.getState(),
          arrowStyle = this.getArrowStyle();

      return super.render(
        <Paper
          {...this.passProps(this.props)}
          className={this.getRootClassName(componentName)}
          id={this.props.id || this.getComponentID()}
          onMounted={this.onMounted}
          onPositionUpdated={this.onPositionUpdated}
          visible={!!quadrantValues}
        >
          <View
            className={this.getClassName(componentName, 'container')}
            style={this.style('container', `container${quadrantX}`, `container${quadrantY}`, this.props.style)}
          >
            <View
              className={this.getClassName(componentName, 'innerContainer')}
              style={this.style('innerContainer', `innerContainer${quadrantX}`, `innerContainer${quadrantY}`, this.props.innerContainerStyle)}
            >
              {this.getChildren(children)}
            </View>

            {(!!arrowStyle) && <View style={this.style('arrow', arrowStyle)}/>}
          </View>
        </Paper>
      );
    }
  };
});

export { styleSheet as popupStyles };
