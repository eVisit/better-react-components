//###if(MOBILE) {###//
import { ActivityIndicator }        from 'react-native';
//###} else {###//
import React                        from 'react';
import { Color }                    from '@react-ameliorate/styles';
import {
  insertStyleSheet,
  toNumber
}                                   from '@react-ameliorate/utils';
import { flattenStyle }             from '../shim-utils';
import ActivityIndicatorPropTypes   from '../prop-types/activity-indicator';

const SPIN_SPEED = '1.25s';

const SIZES = {
  small: 30,
  large: 75
};

function getColor(color, alpha) {
  var thisColor = new Color(color).rgb();
  thisColor.valpha = alpha || 1;
  return thisColor.toString();
}

class ActivityIndicator extends React.Component {
  static propTypes = ActivityIndicatorPropTypes;
  static defaultProps = {
    animating: true,
    color: 'gray',
    size: 'small'
  };

  render() {
    if (!this.props.animating)
      return null;

    var size = SIZES[this.props.size];
    if (!size)
      size = Math.round(toNumber(this.props.size, SIZES.small));

    var borderSize = Math.round(size * 0.125),
        color = getColor(this.props.color, 1),
        bgColor = getColor(this.props.color, 0.2),
        style = {
          border: `${borderSize}px solid ${bgColor}`,
          borderRadius: '50%',
          borderTop: `${borderSize}px solid ${color}`,
          width: `${size}px`,
          height: `${size}px`
        };

    return (
      <div
        className="applicationActivityIndicator"
        style={flattenStyle([this.props.style, style])}
      />
    );
  }
}

setTimeout(() => {
insertStyleSheet('mainApplicationActivityIndicator', `
  .applicationActivityIndicator {
    -webkit-animation: applicationActivityIndicatorKeyframes ${SPIN_SPEED} linear infinite; /* Safari */
    animation: applicationActivityIndicatorKeyframes ${SPIN_SPEED} linear infinite;
  }
  /* Safari */
  @-webkit-keyframes applicationActivityIndicatorKeyframes {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }
  @keyframes applicationActivityIndicatorKeyframes {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`);
}, 10);
//###}###//

export {
  ActivityIndicator
};
