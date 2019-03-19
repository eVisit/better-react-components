import PropTypes                  from '@react-ameliorate/prop-types';
import StyleSheetPropType         from './style-sheet';
import ViewStylePropTypes         from './view-style';
import {
  ViewabilityConfig,
  ViewabilityConfigCallbackPair
}                                 from './viewablility-helpers';
import ScrollViewPropTypes        from './scroll-view';

const VirtualizedListPropTypes = {
  ...ScrollViewPropTypes,
  renderItem: PropTypes.func.isRequired, //(info: any) => ?React.Element<any>
  data: PropTypes.any,
  getItem: PropTypes.func.isRequired, //(data: any, index: number) => Item,
  getItemCount: PropTypes.func.isRequired, //(data: any) => number,
  debug: PropTypes.bool,
  disableVirtualization: PropTypes.bool,
  extraData: PropTypes.any,
  getItemLayout: PropTypes.func, //(data: any, index: number) => {length: number, offset: number, index: number}, // e.g. height, y
  horizontal: PropTypes.bool,
  initialNumToRender: PropTypes.number,
  initialScrollIndex: PropTypes.number,
  inverted: PropTypes.bool,
  keyExtractor: PropTypes.func, //(item: Item, index: number) => string,
  CellRendererComponent: PropTypes.any,
  ListEmptyComponent: PropTypes.any,
  ListFooterComponent: PropTypes.any,
  ListFooterComponentStyle: StyleSheetPropType(ViewStylePropTypes),
  ListHeaderComponent: PropTypes.any,
  ListHeaderComponentStyle: StyleSheetPropType(ViewStylePropTypes),
  listKey: PropTypes.string,
  maxToRenderPerBatch: PropTypes.number,
  onEndReached: PropTypes.func,//(info: {distanceFromEnd: number}) => void,
  onEndReachedThreshold: PropTypes.number, // units of visible length
  onLayout: PropTypes.func,
  onRefresh: PropTypes.func,
  onScrollToIndexFailed: PropTypes.func,//(info: { index: number, highestMeasuredFrameIndex: number, averageItemLength: number }) => void,
  onViewableItemsChanged: PropTypes.func,//(info: { viewableItems: Array<ViewToken>, changed: Array<ViewToken> }) => void,
  progressViewOffset: PropTypes.number,
  refreshControl: PropTypes.any,
  refreshing: PropTypes.bool,
  removeClippedSubviews: PropTypes.bool,
  renderScrollComponent: PropTypes.func, //(props: Object) => React.Element<any>,
  updateCellsBatchingPeriod: PropTypes.number,
  viewabilityConfig: ViewabilityConfig,
  viewabilityConfigCallbackPairs: PropTypes.arrayOf(ViewabilityConfigCallbackPair),
  windowSize: PropTypes.number
};

export default VirtualizedListPropTypes;
