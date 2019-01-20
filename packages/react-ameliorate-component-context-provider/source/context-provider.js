import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import styleSheet                       from './context-provider-styles';

export const ContextProvider = componentFactory('ContextProvider', ({ Parent, componentName }) => {
  return class ContextProvider extends Parent {
    static styleSheet = styleSheet;
    static propTypes = {
      context: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired
    };

    construct() {
      this._contextCache = {};
    }

    provideContext() {
      if (typeof this.props.context === 'function') {
        var context = this.props.context.call(this);
        if (this.propsDiffer(context, this._contextCache))
          this._contextCache = context;
      } else if (this.props.context !== this._contextCache) {
        this._contextCache = this.props.context;
      }

      return this._contextCache;
    }

    render(children) {
      return (
        <View {...this.filterProps(/^(context)$/)}>
          {this.getChildren(children)}
        </View>
      );
    }
  };
});

export { styleSheet as contextProviderStyles };
