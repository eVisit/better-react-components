import { utils as U }                   from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Field }                        from '@react-ameliorate/component-field';
import styleSheet                       from './form-styles';

export const Form = componentFactory('Form', ({ Parent, componentName }) => {
  return class Form extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      columns: PropTypes.number,
      horizontalSpacing: PropTypes.number,
      verticalSpacing: PropTypes.number,
      calcChildColspan: PropTypes.func,
      calcChildKey: PropTypes.func,
      data: PropTypes.oneOfType([ PropTypes.object, PropTypes.array ]),
      mask: PropTypes.number
    };

    static defaultProps = {
      columns: 1,
      mask: 0xFFFF
    };

    construct() {
      this._registeredFields = {};
    }

    componentMounted() {
      super.componentMounted();

      var parentForm = this.getParentForm();
      if (parentForm)
        parentForm.registerField(this);
    }

    componentUnmounting() {
      super.componentUnmounting();

      var parentForm = this.getParentForm();
      if (parentForm)
        parentForm.unregisterField(this);
    }

    getFieldDataValue(fieldName) {
      var data = this.props.data,
          parentForm = this.getParentForm();

      if (!data && parentForm)
        return parentForm.getFieldDataValue(fieldName);

      return U.get(data, fieldName);
    }

    getParentForm() {
      return this.context._raParentForm;
    }

    getParentField() {
      return this.context._raParentField;
    }

    getFieldID() {
      return this.getComponentID();
    }

    provideContext() {
      return {
        _raParentForm: this
      };
    }

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          currentData: props.data
        })
      };
    }

    registerField(field) {
      if (!field)
        return;

      this._registeredFields[field.getFieldID()] = field;
    }

    unregisterField(field) {
      if (!field)
        return;

      delete this._registeredFields[field.getFieldID()];
    }

    focusNext(currentField) {
      var registeredFields  = this._registeredFields,
          fieldIDs          = Object.keys(registeredFields).sort(),
          currentFieldID    = currentField.getFieldID(),
          currentFieldIndex = fieldIDs.indexOf(currentFieldID);

      if (currentFieldIndex < 0)
        return;

      var nextFieldID = fieldIDs[(currentFieldIndex + 1) % fieldIDs.length],
          field       = registeredFields[nextFieldID];

      if (field && typeof field.focus === 'function')
        field.focus();
    }

    onFieldValueChange(args) {
      var { ref, value } = args;
      var currentData = this.getState('currentData', {}),
          field       = ref.getField();

      if (!field)
        return;

      currentData[field] = value;

      return this.callProvidedCallback((args.userInitiated) ? 'onChange' : 'onValueChange', { ...args, value: currentData, data: this.props.data });
    }

    onChange(args) {
    }

    onValueChange(args) {
    }

    value() {
      var fields = this._registeredFields,
          keys = Object.keys(fields),
          values = {};

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            field = fields[key];

        if (!field)
          continue;

        var fieldName = (field.props && field.getField());
        if (!fieldName)
          continue;

        values[fieldName] = field.value();
      }

      return values;
    }

    async validate() {
      const validateField = async (field) => {
        try {
          var result = await field.validate();
          return { result, field };
        } catch (e) {
          return { result: e, field };
        }
      };

      const addResultsToErrors = (results, errors) => {
        for (var i = 0, il = results.length; i < il; i++) {
          var result = results[i];
          if (!result)
            continue;

          var validationResult  = result.result,
              field             = result.field,
              fieldName         = (field && field.getField());

          if (!fieldName || !validationResult)
            continue;

          if (validationResult instanceof Array) {
            addResultsToErrors(validationResult, errors);
            continue;
          }

          if (validationResult instanceof Error)
            validationResult = { type: 'error', message: validationResult.message };

          errors.push(Object.assign({ field, fieldName }, validationResult));
        }
      };

      var fields    = this._registeredFields,
          keys      = Object.keys(fields),
          promises  = [];

      for (var i = 0, il = keys.length; i < il; i++) {
        var key = keys[i],
            field = fields[key];

        if (!field)
          continue;

        promises.push(validateField(field));
      }

      var results = await Promise.all(promises),
          errors  = [];

      addResultsToErrors(results, errors);

      return (errors.length) ? { errors, message: errors.map((error) => (error && error.message)).filter(Boolean).join('. ') } : undefined;
    }

    getChildColSpan(args) {
      return this.callProvidedCallback('calcChildColspan', args, 1);
    }

    getChildKey(args) {
      var { index } = args;
      return this.callProvidedCallback('calcChildKey', args, `child-${index}`);
    }

    getRowCount(args) {
      var { children, columns } = args;

      var totalColumns = 0;
      for (var i = 0, il = children.length; i < il; i++) {
        var child = children[i],
            colSpan = this.getChildColSpan(Object.assign({}, args, { child, index: i }));

        totalColumns += colSpan;
      }

      return Math.ceil(totalColumns / columns);
    }

    getChildColumn(args) {
      var { children, index } = args;

      var column = 0;

      for (var i = 0, il = children.length; i < il; i++) {
        if (i >= index)
          break;

        var child = children[i],
            colSpan = this.getChildColSpan(Object.assign({}, args, { child }));

        column += colSpan;
      }

      return column;
    }

    getChildRow(args) {
      var { column, columns } = args;
      if (column == null)
        column = this.getChildColumn(args);

      return Math.floor(column / columns);
    }

    getChildWrapperStyle(args) {
      var colSpan = this.getChildColSpan(args);
      return {
        flex: colSpan,
        flexGrow: colSpan,
        flexShrink: colSpan
      };
    }

    renderHorizontalSpacer({ row, column, horizontalSpacing }) {
      return (
        <View
          className={this.getClassName(componentName, 'horizontalSpacer')}
          style={this.style('horizontalSpacer', { width: horizontalSpacing })}
          key={`horizontal-spacer-${row}-${column}`}
        />
      );
    }

    renderVerticalSpacer({ row, verticalSpacing }) {
      return (
        <View
          className={this.getClassName(componentName, 'horizontalSpacer')}
          style={this.style('verticalSpacer', { height: verticalSpacing })}
          key={`vertical-spacer-${row}-0`}
        />
      );
    }

    renderChild(args) {
      var { child } = args,
          key = this.getChildKey(args),
          wrapperStyle = this.getChildWrapperStyle(args);

      if (!child)
        child = null;

      return (
        <View
          className={this.getClassName(componentName, 'childWrapper', (child === null) && 'blankChildWrapper')}
          style={this.style('childWrapper', wrapperStyle)}
          key={key}
        >
          {child}
        </View>
      );
    }

    renderChildren(_args) {
      var args = Object.assign({}, _args || {}),
          {
            children,
            horizontalSpacing,
            verticalSpacing,
            columns
          } = args;

      var masterMask = this.props.mask;
      children = args.children = (children || []).filter((child) => {
        if (!child || child === true)
          return false;

        var mask = U.get(child, 'props.mask');
        if (typeof mask !== 'number' || !isFinite(mask))
          return true;

        return !!(masterMask & mask);
      });

      var rowCount          = this.getRowCount(args),
          oldRow            = 0,
          totalColumns      =  rowCount * columns,
          totalUsedColumns  = this.getChildColumn(Object.assign({}, args, {
            children,
            child: null,
            index: children.length + 1,
            rowCount
          })),
          currentRow        = [],
          allRows           = [currentRow];

      const renderChild = (child, index) => {
        var thisArgs = Object.assign({}, args, {
          child,
          index,
          rowCount
        });

        var column = thisArgs.column = this.getChildColumn(thisArgs),
            row = thisArgs.row = this.getChildRow(thisArgs),
            renderHorizontalSpacer = false;

        if (row !== oldRow) {
          oldRow = row;
          currentRow = [];
          allRows.push(currentRow);
        }

        if (currentRow.length && horizontalSpacing && (column % columns) !== 0)
          renderHorizontalSpacer = true;

        if (renderHorizontalSpacer)
          currentRow.push(this.renderHorizontalSpacer(thisArgs));

        currentRow.push(this.renderChild(thisArgs));
      };

      // Render children
      for (var i = 0, il = children.length; i < il; i++) {
        var child = children[i];
        renderChild(child, i);
      }

      // Add blank columns (if any)
      for (var i = 0, il = (totalColumns - totalUsedColumns); i < il; i++)
        renderChild(null, totalUsedColumns + i);

      var finalChildren = [];
      for (var i = 0, il = allRows.length; i < il; i++) {
        var thisRow = allRows[i],
            thisArgs = Object.assign({}, args, {
              row: i,
              rowCount
            });

        if (i > 0 && verticalSpacing)
          finalChildren.push(this.renderVerticalSpacer(thisArgs));

        finalChildren.push(
          <View
            className={this.getClassName(componentName, 'row')}
            style={this.style('row')}
            key={`form-row-${i}`}
          >
            {thisRow}
          </View>
        );
      }

      return finalChildren;
    }

    render(_children) {
      var children          = this.getChildren(_children, true),
          horizontalSpacing = this.props.horizontalSpacing || 0,
          verticalSpacing   = this.props.verticalSpacing || 0,
          columns           = this.props.columns;

      return super.render(
        <View
          className={this.getRootClassName(componentName)}
          style={this.style('rootContainer')}
          data-columns={columns}
        >
          {this.renderChildren({ children, horizontalSpacing, verticalSpacing, columns })}
        </View>
      );
    }
  };
}, Field);

export { styleSheet as formStyles };
