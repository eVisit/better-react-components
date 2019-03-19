import PropTypes          from '@react-ameliorate/prop-types';
import StyleSheetPropType from './style-sheet';
import ViewStylePropTypes from './view-style';
import VirtualizedListPropTypes from './virtualized-list';

const FlatListPropTypes = {
  ...VirtualizedListPropTypes,
  ItemSeparatorComponent: PropTypes.any,
  columnWrapperStyle: StyleSheetPropType(ViewStylePropTypes),
  numColumns: PropTypes.number
};

export default FlatListPropTypes;
