//###if(MOBILE) {###//
export { ActivityIndicator }        from 'react-native';
//###} else {###//
import React                        from 'react';
import {
  Color,
  StyleSheetBuilder
}                                   from '@react-ameliorate/styles';
import {
  insertStyleSheet,
  toNumber
}                                   from '@react-ameliorate/utils';

const SPIN_SPEED = '1.25s',
      SMALL_SIZE = 24,
      LARGE_SIZE = 48;

function getColor(color, alpha) {
  var thisColor = new Color(color).rgb();
  thisColor.valpha = alpha || 1;
  return thisColor.toString();
}

export class ActivityIndicator extends React.Component {
  static defaultProps = {
    animating: true,
    hidesWhenStopped: true,
    color: 'gray',
    size: 'small'
  };

  render() {
    if (this.props.hidesWhenStopped && !this.props.animating)
      return null;

    var size = this.props.size;
    if (size === 'small')
      size = SMALL_SIZE;
    else if (size === 'large')
      size = LARGE_SIZE;
    else
      size = Math.round(toNumber(size, SMALL_SIZE));

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
        style={StyleSheetBuilder.flattenInternalStyleSheet([this.props.style, style])}
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