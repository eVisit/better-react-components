import PropTypes            from '@react-ameliorate/prop-types';
import EdgeInsetsPropType   from './edge-insets';
import StyleSheetPropType   from './style-sheet';
import ImageSourcePropType  from './image-source';
import ImageStylePropTypes  from './image-style';

const ImagePropTypes = {
  style: StyleSheetPropType(ImageStylePropTypes),
  source: ImageSourcePropType,
  defaultSource: PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
      scale: PropTypes.number,
    }),
    PropTypes.number,
  ]),
  accessible: PropTypes.bool,
  accessibilityLabel: PropTypes.node,
  blurRadius: PropTypes.number,
  capInsets: EdgeInsetsPropType,
  resizeMethod: PropTypes.oneOf(['auto', 'resize', 'scale']),
  resizeMode: PropTypes.oneOf([
    'cover',
    'contain',
    'stretch',
    'repeat',
    'center',
  ]),
  testID: PropTypes.string,
  onLayout: PropTypes.func,
  onLoadStart: PropTypes.func,
  onProgress: PropTypes.func,
  onError: PropTypes.func,
  onPartialLoad: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadEnd: PropTypes.func
};

export default ImagePropTypes;
