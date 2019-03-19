import PropTypes          from '@react-ameliorate/prop-types';
import ViewPropTypes      from './view';
import ColorPropType      from './color';
import DataDetectorTypes  from './data-detector';
import TextPropTypes      from './text';

const TextInputPropTypes = {
  ...ViewPropTypes,
  autoCapitalize: PropTypes.oneOf([
    'none',
    'sentences',
    'words',
    'characters'
  ]),
  autoCorrect: PropTypes.bool,
  spellCheck: PropTypes.bool,
  autoFocus: PropTypes.bool,
  allowFontScaling: PropTypes.bool,
  editable: PropTypes.bool,
  keyboardType: PropTypes.oneOf([
    // Cross-platform
    'default',
    'email-address',
    'numeric',
    'phone-pad',
    'number-pad',
    // iOS-only
    'ascii-capable',
    'numbers-and-punctuation',
    'url',
    'name-phone-pad',
    'decimal-pad',
    'twitter',
    'web-search',
    // Android-only
    'visible-password'
  ]),
  keyboardAppearance: PropTypes.oneOf(['default', 'light', 'dark']),
  returnKeyType: PropTypes.oneOf([
    // Cross-platform
    'done',
    'go',
    'next',
    'search',
    'send',
    // Android-only
    'none',
    'previous',
    // iOS-only
    'default',
    'emergency-call',
    'google',
    'join',
    'route',
    'yahoo'
  ]),
  returnKeyLabel: PropTypes.string,
  maxLength: PropTypes.number,
  numberOfLines: PropTypes.number,
  disableFullscreenUI: PropTypes.bool,
  enablesReturnKeyAutomatically: PropTypes.bool,
  multiline: PropTypes.bool,
  textBreakStrategy: PropTypes.oneOf(['simple', 'highQuality', 'balanced']),
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onChange: PropTypes.func,
  onChangeText: PropTypes.func,
  onContentSizeChange: PropTypes.func,
  onTextInput: PropTypes.func,
  onEndEditing: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onSubmitEditing: PropTypes.func,
  onKeyPress: PropTypes.func,
  onLayout: PropTypes.func,
  onScroll: PropTypes.func,
  placeholder: PropTypes.string,
  placeholderTextColor: ColorPropType,
  scrollEnabled: PropTypes.bool,
  secureTextEntry: PropTypes.bool,
  selectionColor: ColorPropType,
  selectionState: PropTypes.any,
  selection: PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number
  }),
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  clearButtonMode: PropTypes.oneOf([
    'never',
    'while-editing',
    'unless-editing',
    'always'
  ]),
  clearTextOnFocus: PropTypes.bool,
  selectTextOnFocus: PropTypes.bool,
  blurOnSubmit: PropTypes.bool,
  style: TextPropTypes.style,
  underlineColorAndroid: ColorPropType,
  inlineImageLeft: PropTypes.string,
  inlineImagePadding: PropTypes.number,
  dataDetectorTypes: PropTypes.oneOfType([
    PropTypes.oneOf(DataDetectorTypes),
    PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes))
  ]),
  caretHidden: PropTypes.bool,
  contextMenuHidden: PropTypes.bool,
  inputAccessoryViewID: PropTypes.string,
  textContentType: PropTypes.oneOf([
    'none',
    'URL',
    'addressCity',
    'addressCityAndState',
    'addressState',
    'countryName',
    'creditCardNumber',
    'emailAddress',
    'familyName',
    'fullStreetAddress',
    'givenName',
    'jobTitle',
    'location',
    'middleName',
    'name',
    'namePrefix',
    'nameSuffix',
    'nickname',
    'organizationName',
    'postalCode',
    'streetAddressLine1',
    'streetAddressLine2',
    'sublocality',
    'telephoneNumber',
    'username',
    'password'
  ]),
};

export default TextInputPropTypes;
