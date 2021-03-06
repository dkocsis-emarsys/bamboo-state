import camelcaseKeys from 'camelcase-keys-recursive';
import { deepMerge, isPlainObject } from './deep-merge.js';

export default class State {
  constructor(defaults = {}) {
    this._subscriptions = [];
    this._data = {};
    this._options = {};
    this._defaultOptions = {
      defaultValue: undefined,
      triggerSubscriptionCallback: undefined,
      isFunction: false,
      sameReferenceCheck: true
    };

    this._setDefaults(defaults);
  }

  get(name) {
    return this._get(name, this._data);
  }

  set(name, value, options = {}) {
    if (typeof name === 'object') {
      return this._setMultiple(name, value);
    }

    if (options.defaultValue !== undefined) {
      this.setOptions(name, { defaultValue: options.defaultValue });
    }

    const stateOptions = this._getOptions(name);
    const oldValue = this._get(name, this._data);

    if (typeof value === 'function' && options.isFunction) {
      value = value(oldValue, this._getDefaultValue(name));
    }

    value = this._transformValue(value, oldValue, stateOptions);

    const modifiedData = name.split('.').reduceRight((previous, current) => ({ [current]: previous }), value);
    const sameReferenceCheck = stateOptions && stateOptions.sameReferenceCheck;

    if (sameReferenceCheck && this._get(name, this._data) === this._get(name, modifiedData)) { return { name, value }; }

    this._data = deepMerge(this._data, modifiedData);

    if (options.triggerSubscriptionCallback === undefined || options.triggerSubscriptionCallback) {
      this._triggerSubscriptionCallbacks(name, modifiedData, options);
    }

    return { name, value };
  }

  setOptions(name, options) {
    this._options[name] = options;

    if (options.defaultValue !== undefined && this.get(name) === undefined) {
      const modifiedData = name.split('.').reduceRight((previous, current) => ({ [current]: previous }), options.defaultValue);
      this._data = deepMerge(this._data, modifiedData);
    }
  }

  getDefaultValue(name) {
    return this._getDefaultValue(name);
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

  triggerSubscriptionCallbacks(name, options) {
    this._triggerSubscriptionCallbacks(name, false, options);
  }

  _get(name, data) {
    return name ? name.split('.').reduce((item, index) => item ? item[index] : undefined, data) : data;
  }

  _setMultiple(list, options = {}) {
    const result = Object.keys(list).map(name => this.set(name, list[name], {
      ...options, triggerSubscriptionCallback: false
    }));

    this._triggerSubscriptionCallbacks();

    return result;
  }

  _setDefaults(defaults) {
    const modifiedData = this._objectToDotNotation(defaults);

    Object.keys(modifiedData).forEach(key => this.setOptions(key, { defaultValue: modifiedData[key] }));
  }

  _getDefaultValue(name) {
    const options = this._getOptions(name);

    if (!options) { return; }

    return options.defaultValue;
  }

  _hasSubArray(master, sub) {
    return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
  };

  _triggerSubscriptionCallbacks(name, modifiedData, options) {
    if (!this._subscriptions) { return; }

    const modifiedKeys = typeof modifiedData === 'object' && modifiedData.constructor === Object ?
      Object.keys(this._objectToDotNotation(modifiedData)) : [];

    this._subscriptions.forEach(subscription => {
      if (!name || !subscription.name || this._hasSubArray(name.split('.'), subscription.name.split('.')) || modifiedKeys.indexOf(subscription.name) !== -1) {
        subscription.callback(this._get(subscription.name, this._data), subscription.name, options);
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

  _objectToDotNotation(data, prefix = '', result = {}) {
    return Object.entries(data).reduce((list, [key, value]) => {
      const flattenedKey = `${prefix}${key}`;

      if (isPlainObject(value)) {
        this._objectToDotNotation(value, `${flattenedKey}.`, list);
      } else {
        result[flattenedKey] = value;
      }

      return list;
    }, result);
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

    return { ...this._defaultOptions, ...options };
  }

  _transformValue(value, oldValue, rule = {}) {
    if (!rule) { return value; }

    switch (rule.type) {
      case 'custom': {
        value = rule.function(value, oldValue, rule.defaultValue);
      } break;
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
      case 'boolean': value = this._toBoolean(value); break;
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

  _toBoolean(value) {
    return value !== undefined && value !== null && value !== false && value !== 'false';
  }
}
