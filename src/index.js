import camelcaseKeys from 'camelcase-keys-recursive';
import deepMerge from './deep-merge';

export default class State {
  constructor(defaultData = {}, renderFunction = () => {}) {
    this._defaultData = defaultData;
    this._data = deepMerge({}, this._defaultData);
    this._renderFunction = renderFunction;
    this._subscriptions = [];
    this._options = {};
  }

  _get(name, data) {
    return name ? name.split('.').reduce((item, index) => item ? item[index] : false, data) : data;
  }

  get(name) {
    return this._get(name, this._data);
  }

  set(name, value, options = {}) {
    const stateOptions = this._getOptions(name);

    if (typeof value === 'function' && options.isTransformFunction) {
      value = value(this._get(name, this._data));
    }

    value = this._transformValue(value, stateOptions);

    const modifiedData = name.split('.').reduceRight((previous, current) => ({ [current]: previous }), value);

    if (this._get(name, this._data) === this._get(name, modifiedData)) { return value; }

    this._data = deepMerge(this._data, modifiedData);

    if (options.triggerCallback === undefined || options.triggerCallback) { this._triggerCallback(name, modifiedData); }
    if (options.triggerRender === undefined || options.triggerRender) { this._renderFunction(); }

    return { name, value };
  }

  setMultiple(list, options = {}) {
    const result = Object.keys(list).map(name => this.set(name, list[name], { triggerRender: false }));

    if (options.triggerRender === undefined || options.triggerRender) { this._renderFunction(); }

    return result;
  }

  setOptions(name, options) {
    this._options[name] = options;
  }

  getDefaultValue(name) {
    const options = this._getOptions(name);

    if (!options) { return; }

    return options.defaultValue;
  }

  subscribe(name, callback) {
    const id = Symbol();

    if (Array.isArray(name)) {
      name.forEach(value => {
        const subscription = { id, name: value, callback };
        this._subscriptions.push(subscription);
      });
    } else {
      const subscription = { id, name, callback };
      this._subscriptions.push(subscription);
    }

    return { unsubscribe: this._unsubscribe.bind(this, id) };
  }

  unsubscribeAll(name) {
    this._subscriptions.forEach((subscription, index) => {
      if (subscription.name === name) {
        delete this._subscriptions[index];
      }
    });
  }

  triggerChange(name) {
    this._triggerCallback(name);
  }

  render() {
    this._renderFunction();
  }

  _hasSubArray(master, sub) {
    return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
  };

  _triggerCallback(name, modifiedData) {
    if (!this._subscriptions) { return; }

    const modifiedKeys = typeof modifiedData === 'object' && modifiedData.constructor === Object ? this._objectToDotNotation(modifiedData) : [];

    this._subscriptions.forEach(subscription => {
      if (!name || !subscription.name || this._hasSubArray(name.split('.'), subscription.name.split('.')) || modifiedKeys.indexOf(subscription.name) !== -1) {
        subscription.callback(this._get(subscription.name, this._data), subscription.name);
      }
    });
  }

  _unsubscribe(id) {
    this._subscriptions.forEach((subscription, index) => {
      if (subscription.id === id) {
        delete this._subscriptions[index];
      }
    });
  }

  _objectToDotNotation(data, prefix = '', keys = []) {
    return Object.entries(data).reduce((list, [key, value]) => {
      const flattenedKey = `${prefix}${key}`;

      if (value && typeof value === 'object' && value.constructor === Object) {
        this._objectToDotNotation(value, `${flattenedKey}.`, list);
      } else {
        keys.push(flattenedKey);
      }

      return list;
    }, keys);
  }

  _getOptions(name) {
    const options = Object.keys(this._options).filter(optionName => {
      return !name ||
        !optionName ||
        this._hasSubArray(name.split('.'), optionName.split('.'))
    });

    const optionsList = options.reduce((list, current) => {
      list[current] = this._options[current];
      return list;
    }, {});

    return this._findOptionsByName(name, optionsList);
  }

  _findOptionsByName(name, optionsList) {
    let options = null;
    const nameParts = name.split('.');

    for (let index = 1; index <= nameParts.length; ++index) {
      const partialName = nameParts.slice(0, index).join('.');
      options = optionsList[partialName] || options;
    }

    return options;
  }

  _transformValue(value, rule = {}) {
    if (!rule) { return value; }

    switch (rule.type) {
      case 'custom': value = rule.transformFunction(value); break;
      case 'number': {
        value = Number(value);
        if (isNaN(value)) { value = 0; }
      } break;
      case 'integer': {
        value = parseInt(value);
        if (isNaN(value)) { value = 0; }
      } break;
      case 'float': {
        value = parseFloat(value);
        if (isNaN(value)) { value = 0; }
      } break;
      case 'boolean': value = this._convertAttributeToBoolean(value); break;
      case 'json': {
        if (typeof value !== 'string') { break; }

        try { value = JSON.parse(value); } catch(error) {}
        try { value = camelcaseKeys(value); } catch(error) {}
      } break;
    }

    if (rule.allowedValues && rule.allowedValues.filter(allowedValue => value === allowedValue).length === 0) {
      return rule.defaultValue !== undefined ? rule.defaultValue : null;
    }

    return value;
  }

  _convertAttributeToBoolean(value) {
    return value !== undefined && value !== null && value !== false && value !== 'false';
  }
}
