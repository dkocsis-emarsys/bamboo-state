import State from '../src/index.js';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
global.expect = chai.expect;
global.sinon = sinon;

beforeEach(() => {
  global.sandbox = sinon.createSandbox();
});

afterEach(() => {
  global.sandbox.restore();
  delete global.sandbox;
});

global.EventTarget = () => {};

describe('State', () => {
  describe('.get([name])', () => {
    context('calling without name', () => {
      it('returns with empty object', () => {
        const state = new State();

        expect(state.get()).to.deep.equal({});
      });

      it('returns with default data given in constructor', () => {
        const defaultData = { a: 1, b: 2 };
        const state = new State(defaultData);

        expect(state.get()).to.deep.equal(defaultData);
      });
    });

    context('calling with name', () => {
      it('returns with the value from default data given in constructor', () => {
        const defaultData = { a: 1, b: 2 };
        const state = new State(defaultData);

        expect(state.get('a')).to.equal(1);
      });

      it('contains "." returns with the value from default data given in constructor', () => {
        const defaultData = {
          a: {
            b: 2
          }
        };
        const state = new State(defaultData);

        expect(state.get('a')).to.deep.equal({ b: 2 });
      });

      it('contains "." returns with the value from default data given in constructor', () => {
        const defaultData = {
          a: {
            b: 2
          }
        };
        const state = new State(defaultData);

        expect(state.get('a.b')).to.equal(2);
      });
    });
  });

  describe('.set(name, value, [options])', () => {
    context('calling without options', () => {
      it('sets simple data according to parameters', () => {
        const state = new State();

        state.set('a', 1);

        expect(state.get('a')).to.equal(1);
      });

      it('sets function as value', () => {
        const state = new State();
        const sampleFunction = value => ++value;

        state.set('a', 2);
        state.set('a', sampleFunction);

        expect(state.get('a')).to.equal(sampleFunction);
      });

      it('sets value as function', () => {
        const state = new State();

        state.set('a', 2);
        state.set('a', value => ++value, { isTransformFunction: true });

        expect(state.get('a')).to.equal(3);
      });

      it('sets deep data according to parameters', () => {
        const state = new State();

        state.set('a.b', { c: 3, d: 4 });

        expect(state.get('a')).to.deep.equal({ b: { c: 3, d: 4 } });
      });

      it('returns the value', () => {
        const state = new State();

        const result = state.set('a.b', { c: 3, d: 4 });

        expect(result).to.deep.equal({
          name: 'a.b',
          value: { c: 3, d: 4 }
        });
      });

      it('calls render function', () => {
        const renderSpy = sinon.spy();
        const state = new State({}, renderSpy);

        state.set('a', 1);

        expect(renderSpy).to.have.been.calledOnce;
      });

      it('does not call render function if value has not changed but returns the value', () => {
        const renderSpy = sinon.spy();
        const state = new State({}, renderSpy);

        state.set('a', 1);
        const result = state.set('a', 1);

        expect(renderSpy).to.have.been.calledOnce;
        expect(result).to.equal(1);
      });
    });

    context('calling with options', () => {
      it('does not call render function when triggerRender set to false', () => {
        const renderSpy = sinon.spy();
        const state = new State({}, renderSpy);

        state.set('a', 1, { triggerRender: false });

        expect(renderSpy).not.to.have.been.called;
      });

      it('does not call subscribe function when triggerCallback set to false', () => {
        const subscribeSpy = sinon.spy();

        const state = new State({});
        state.subscribe('a', subscribeSpy);
        state.set('a', 1, { triggerCallback: false });

        expect(subscribeSpy).not.to.have.been.called;
      });
    });
  });

  describe('.setMultiple(list, options = {})', () => {
    context('calling without options', () => {
      it('sets multiple simple data according to parameters', () => {
        const state = new State();

        state.setMultiple({ a: 1, b: 2 });

        expect(state.get('a')).to.equal(1);
        expect(state.get('b')).to.equal(2);
      });

      it('sets multiple deep data according to parameters', () => {
        const state = new State();

        state.setMultiple({ a: { c: 3 }, b: { d: 4 } });

        expect(state.get('a.c')).to.equal(3);
        expect(state.get('b.d')).to.equal(4);
      });

      it('returns the value', () => {
        const state = new State();

        const result = state.setMultiple({ a: 1, b: 2 });

        expect(result).to.deep.equal([
          { name: 'a', value: 1 },
          { name: 'b', value: 2 },
        ]);
      });

      it('calls render function', () => {
        const renderSpy = sinon.spy();
        const state = new State({}, renderSpy);

        state.setMultiple({ a: 1, b: 2 });

        expect(renderSpy).to.have.been.calledOnce;
      });
    });

    context('calling with options', () => {
      it('does not call render function when triggerRender set to false', () => {
        const renderSpy = sinon.spy();
        const state = new State({}, renderSpy);

        state.setMultiple({ a: 1, b: 2 }, { triggerRender: false });

        expect(renderSpy).not.to.have.been.called;
      });
    });
  });

  describe('.render()', () => {
    it('calls render function', () => {
      const renderSpy = sinon.spy();
      const state = new State({}, renderSpy);

      state.render();

      expect(renderSpy).to.have.been.calledOnce;
    });
  });

  describe('.subscribe(name, callback)', () => {
    it('calls callback function with value and name', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.subscribe('a', subscribeSpy);
      state.set('a', 1);

      expect(subscribeSpy).to.have.been.calledOnce;
      expect(subscribeSpy).to.have.been.calledWith(1, 'a');
    });

    it('subscribes to an array', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.subscribe(['a', 'b'], subscribeSpy);
      state.set('a', 1);

      expect(subscribeSpy).to.have.been.calledOnce;
      expect(subscribeSpy).to.have.been.calledWith(1, 'a');

      state.set('b', 2);

      expect(subscribeSpy).to.have.been.calledTwice;
      expect(subscribeSpy).to.have.been.calledWith(2, 'b');
    });

    it('name contains "." calls callback function with value and name', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.subscribe('a.b', subscribeSpy);
      state.set('a.b', 2);

      expect(subscribeSpy).to.have.been.calledOnce;
      expect(subscribeSpy).to.have.been.calledWith(2, 'a.b');
    });

    it('calls callback function with value and name for any changes occured in parent', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.subscribe('a', subscribeSpy);
      state.set('a', {});

      expect(subscribeSpy).to.have.been.calledOnce;
      expect(subscribeSpy.getCall(0)).to.have.been.calledWith({}, 'a');

      state.set('a.b', 2);

      expect(subscribeSpy).to.have.been.calledTwice;
      expect(subscribeSpy.getCall(1)).to.have.been.calledWith({b: 2}, 'a');
    });

   it('calls callback function with deep value for any changes', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.subscribe('a.b', subscribeSpy);
      state.set('a', { b: 2 });

      expect(subscribeSpy).to.have.been.calledOnce;
      expect(subscribeSpy).to.have.been.calledWith(2, 'a.b');
    });

    it('does not trigger another call after unsubscribe', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe('a', subscribeSpy);
      state.set('a', 1);
      subscription.unsubscribe();
      state.set('a', 2);

      expect(subscribeSpy).to.have.been.calledOnce;
    });

    it('does not trigger another call after unsubscribe if subscribed to array', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe(['a', 'b'], subscribeSpy);
      state.set('a', 1);
      state.set('b', 2);
      subscription.unsubscribe();
      state.set('a', 3);
      state.set('b', 4);

      expect(subscribeSpy).to.have.been.calledTwice;
    });

    it('triggering change manually calls callback function of unnamed subscriptions', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.set('a', 1);
      const subscription = state.subscribe('', subscribeSpy);
      state.triggerChange('a');

      expect(subscribeSpy).to.have.been.calledOnce;
      expect(subscribeSpy).to.have.been.calledWith({ a: 1 }, '');
    });
  });

  describe('.unsubscribeAll(name)', () => {
    it('does not trigger another call', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe('a', subscribeSpy);
      state.set('a', 1);
      state.unsubscribeAll('a');
      state.set('a', 2);

      expect(subscribeSpy).to.have.been.calledOnce;
    });

    it('does not trigger another call on the whole namespace', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe('a', subscribeSpy);
      state.set('a', 1);
      state.unsubscribeAll('a');
      state.set('a.b', 2);

      expect(subscribeSpy).to.have.been.calledOnce;
    });
  });

  describe('.triggerChange(name)', () => {
    it('triggers subscription callback', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe('a', subscribeSpy);
      state.triggerChange('a');

      expect(subscribeSpy).to.have.been.calledOnce;
    });

    it('name contains "." triggers subscription callback', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe('a', subscribeSpy);
      state.triggerChange('a.b');

      expect(subscribeSpy).to.have.been.calledOnce;
    });

    it('undefined name triggers callback on every subscription', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      const subscription = state.subscribe('a', subscribeSpy);
      state.triggerChange();

      expect(subscribeSpy).to.have.been.calledOnce;
    });
  });

  describe('.setOptions(name)', () => {
    it('sets then gets defaultValue', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.setOptions('a', { defaultValue: 1 });

      expect(state.getDefaultValue('a')).to.equal(1);
    });

    it('sets then gets defaultValue by group', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.setOptions('a', { defaultValue: 2 });
      state.setOptions('a.b', { defaultValue: 1 });

      expect(state.getDefaultValue('a.b')).to.equal(1);
    });

    it('sets then gets defaultValue of group', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.setOptions('a', { defaultValue: 1 });

      expect(state.getDefaultValue('a.b')).to.equal(1);
    });

    context('format', () => {
      it('number', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'number' });
        state.set('a', '1');

        expect(state.get('a')).to.equal(1);
      });

      it('number is NaN falls back to 0', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'number' });
        state.set('a', 'test');

        expect(state.get('a')).to.equal(0);
      });

      it('integer', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'integer' });
        state.set('a', '1.2');

        expect(state.get('a')).to.equal(1);
      });

      it('integer isNaN falls back to 0', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'integer' });
        state.set('a', 'test');

        expect(state.get('a')).to.equal(0);
      });

      it('float', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'float' });
        state.set('a', '1.2');

        expect(state.get('a')).to.equal(1.2);
      });

      it('float isNaN falls back to 0', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'float' });
        state.set('a', 'test');

        expect(state.get('a')).to.equal(0);
      });

      it('boolean', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'boolean' });
        state.set('a', 'false');

        expect(state.get('a')).to.equal(false);
      });

      it('json', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'json' });
        state.set('a', '{ "b": "2" }');

        expect(state.get('a')).to.deep.equal({ b: '2' });
      });

      it('wrong json not throws error', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'json' });

        expect(() => state.set('a', '{ b: "2" }')).to.not.throw();
      });

      it('json camelcase keys', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', { type: 'json' });
        state.set('a', '{ "php_like_name": 2 }');

        expect(state.get('a.phpLikeName')).to.equal(2);
        expect(state.get('a')).to.deep.equal({ phpLikeName: 2 });
      });

      it('custom', () => {
        const subscribeSpy = sinon.spy();
        const state = new State({});

        state.setOptions('a', {
          type: 'custom',
          transformFunction: value => value + 1
        });
        state.set('a', 1);

        expect(state.get('a')).to.equal(2);
      });
    });

    it('sets allowedValues', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.setOptions('a', { allowedValues: ['lorem', 'ipsum'] });
      state.set('a', 'dolor');

      expect(state.get('a')).to.equal(null);

      state.set('a', 'ipsum');

      expect(state.get('a')).to.equal('ipsum');
    });

    it('sets allowedValues and falls back to default value', () => {
      const subscribeSpy = sinon.spy();
      const state = new State({});

      state.setOptions('a', { allowedValues: ['lorem', 'ipsum'], defaultValue: 'ipsum' });
      state.set('a', 'dolor');

      expect(state.get('a')).to.equal('ipsum');
    });

  });

});
