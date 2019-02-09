import PropTypes            from '@react-ameliorate/prop-types';
import ViewPropTypes        from './view';
import EdgeInsetsPropType   from './edge-insets';
import DataDetectorTypes    from './data-detector';

const WebViewPropTypes = {
  ...ViewPropTypes,
  renderError: PropTypes.func,
  renderLoading: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadEnd: PropTypes.func,
  onLoadStart: PropTypes.func,
  onError: PropTypes.func,
  automaticallyAdjustContentInsets: PropTypes.bool,
  contentInset: EdgeInsetsPropType,
  onNavigationStateChange: PropTypes.func,
  onMessage: PropTypes.func,
  startInLoadingState: PropTypes.bool, // force WebView to show loadingView on first load
  style: ViewPropTypes.style,
  useWebKit: PropTypes.bool,
  javaScriptEnabled: PropTypes.bool,
  thirdPartyCookiesEnabled: PropTypes.bool,
  domStorageEnabled: PropTypes.bool,
  injectedJavaScript: PropTypes.string,
  scalesPageToFit: PropTypes.bool,
  userAgent: PropTypes.string,
  mediaPlaybackRequiresUserAction: PropTypes.bool,
  originWhitelist: PropTypes.arrayOf(PropTypes.string),
  injectJavaScript: PropTypes.func,
  mixedContentMode: PropTypes.oneOf(['never', 'always', 'compatibility']),
  nativeConfig: PropTypes.shape({
    component: PropTypes.any,
    props: PropTypes.object,
    viewManager: PropTypes.object,
  }),
  testID: PropTypes.string,

  // iOS
  source: PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
      method: PropTypes.string,
      headers: PropTypes.object,
      body: PropTypes.string,
    }),
    PropTypes.shape({
      html: PropTypes.string,
      baseUrl: PropTypes.string,
    }),
    PropTypes.number,
  ]),
  bounces: PropTypes.bool,
  decelerationRate: PropTypes.oneOfType([
    PropTypes.oneOf(['fast', 'normal']),
    PropTypes.number,
  ]),
  scrollEnabled: PropTypes.bool,
  dataDetectorTypes: PropTypes.oneOfType([
    PropTypes.oneOf(DataDetectorTypes),
    PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes)),
  ]),
  onShouldStartLoadWithRequest: PropTypes.func,
  allowsInlineMediaPlayback: PropTypes.bool,

  // Android
  onContentSizeChange: PropTypes.func,
  geolocationEnabled: PropTypes.bool,
  allowUniversalAccessFromFileURLs: PropTypes.bool,
  saveFormDataDisabled: PropTypes.bool,
  urlPrefixesForDefaultIntent: PropTypes.arrayOf(PropTypes.string),
  scrollBarThumbImage: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default WebViewPropTypes;
