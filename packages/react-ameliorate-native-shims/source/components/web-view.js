"use strict";

//###if(MOBILE) {###//
import { WebView }        from 'react-native';
//###} else {###//
import React              from 'react';
import { data as D }      from 'evisit-js-utils';
import { flattenStyle }   from '../shim-utils';

function getComponentProps(providedProps) {
  return D.extend(D.extend.FILTER, (key) => !(('' + key).match(/^(activeOpacity|underlayColor|onShowUnderlay|onHideUnderlay|onPress|onLayout|theme|verbiage|autoHeight|source|automaticallyAdjustContentInsets|contentInset|dataDetectorTypes|javaScriptEnabled|scalesPageToFit|scrollEnabled|onShouldStartLoadWithRequest|onNavigationStateChange|webviewCSS|onMessage|testID)$/)), {}, providedProps);
}

class WebView extends React.Component {
  render() {
    var props = getComponentProps(this.props),
        source = this.props.source;

    if (source && source.html)
      source = { __html: source.html };

    return (
      <div
        {...props}
        dangerouslySetInnerHTML={source}
        style={flattenStyle(props.style)}
      />
    );
  }
}
//###}###//

export {
  WebView
};
