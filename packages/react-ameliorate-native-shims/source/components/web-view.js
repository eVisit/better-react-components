"use strict";

//###if(MOBILE) {###//
import { WebView }      from 'react-native';
//###} else {###//
import { View }         from './view';
import WebViewPropTypes from '../prop-types/web-view';

class WebView extends View {
  static propTypes = WebViewPropTypes;
  static defaultProps = {
    javaScriptEnabled: true,
    thirdPartyCookiesEnabled: true,
    scalesPageToFit: true,
    saveFormDataDisabled: false
  };

  getProps(providedProps) {
    var props = super.getProps(providedProps),
        source = props.source;

    if (source && source.html)
      source = { __html: source.html };

    return {
      ...props,
      className: this.getClassName('raWebView', props.className),
      dangerouslySetInnerHTML: source
    };
  }
}
//###}###//

export {
  WebView
};
