import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Paper }                        from '@react-ameliorate/component-paper';
import { capitalize }                   from '@react-ameliorate/utils';
import styleSheet                       from './popup-styles';

export const Popup = componentFactory('Popup', ({ Parent, componentName }) => {
  return class Popup extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      ...Paper.propTypes,
      hasArrow: PropTypes.bool,
      arrowStyle: PropTypes.any,
      innerContainerStyle: PropTypes.any
    }

    static defaultProps = {
      hasArrow: true,
      onShouldClose: ({ action }) => {
        if (action === 'addChild')
          return false;
      }
    };

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          sideX: '',
          sideY: '',
          sideValues: null
        })
      };
    }

    onMounted(args) {
      if (this.callProvidedCallback('onMounted', args) === false)
        return false;
    }

    onChildUpdated({ position, _position, anchor }) {
      if (position === _position)
        return;

      var sideX       = capitalize(U.get(position, 'side.0', '')),
          sideY       = capitalize(U.get(position, 'side.1', '')),
          sideValues  = U.get(position, 'side.2', null),
          stateUpdate = {
            sideX,
            sideY,
            sideValues
          };

      this.setState(stateUpdate);
    }

    getArrowStyle() {
      var sideValues = this.getState('sideValues');
      if (!sideValues)
        return;

      var {
            horizontal,
            vertical,
            popupSideX,
            popupSideY
          } = sideValues,
          _horizontal = Math.abs(horizontal),
          _vertical = Math.abs(vertical);

      // Is popup on a corner? If so, don't do an arrow
      if (_horizontal === 2 && _vertical === 2)
        return;

      // Is popup inside? If so, don't do an arrow
      if (_horizontal < 2 && _vertical < 2)
        return;

      var styles = [];

      if (popupSideX === 0)
        styles.push('arrowHCenter');
      else
        styles.push((popupSideX > 0) ? 'arrowHLeft' : 'arrowHRight');

      if (popupSideY === 0)
        styles.push('arrowVCenter');
      else
        styles.push((popupSideY > 0) ? 'arrowVTop' : 'arrowVBottom');

      if (vertical === -2)
        styles.push('arrowDown');
      else if (vertical === 2)
        styles.push('arrowUp');

      if (horizontal === 2)
        styles.push('arrowLeft');
      else if (horizontal === -2)
        styles.push('arrowRight');

      return this.style('arrow', styles, this.props.arrowStyle);
    }

    render(children) {
      var { sideX, sideY } = this.getState(),
          arrowStyle = this.getArrowStyle();

      return super.render(
        <Paper
          {...this.passProps(this.props)}
          className={this.getRootClassName(componentName)}
          id={this.props.id}
          onMounted={this.onMounted}
          onChildUpdated={this.onChildUpdated}
        >
          <View style={this.style('container', `container${sideX}`, `container${sideY}`, this.props.style)}>
            <View style={this.style('innerContainer', `innerContainer${sideX}`, `innerContainer${sideY}`, this.props.innerContainerStyle)}>
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
