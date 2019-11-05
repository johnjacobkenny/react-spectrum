/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2019 Adobe
* All Rights Reserved.
*
* NOTICE: All information contained herein is, and remains
* the property of Adobe and its suppliers, if any. The intellectual
* and technical concepts contained herein are proprietary to Adobe
* and its suppliers and are protected by all applicable intellectual
* property laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe.
**************************************************************************/

import assert from 'assert';
import Clock from '../../src/Clock';
import moment from 'moment';
import {mount, shallow} from 'enzyme';
import React from 'react';
import sinon from 'sinon';

describe('Clock', () => {
  let clock;

  before(() => {
    clock = sinon.useFakeTimers();
  });

  after(() => {
    clock.runAll();
    clock.restore();
  });

  it('default', () => {
    const tree = shallow(<Clock />);
    assert(tree.hasClass('react-spectrum-Clock'));
    assert.equal(tree.prop('role'), 'group');
    assert(!tree.prop('aria-disabled'));
    assert(!tree.prop('aria-invalid'));

    const hour = findHourTextfield(tree);
    assert(!hour.prop('invalid'));
    assert(!hour.prop('disabled'));
    assert(!hour.prop('readOnly'));
    assert(!hour.prop('quiet'));
    assert.equal(hour.prop('value'), '');

    const minute = findMinuteTextfield(tree);
    assert(!minute.prop('invalid'));
    assert(!minute.prop('disabled'));
    assert(!minute.prop('readOnly'));
    assert(!minute.prop('quiet'));
    assert.equal(minute.prop('value'), '');
  });

  describe('dispatches onChange', () => {
    let now;
    let spy;
    let stopPropagationSpy;

    const assertChangeArgs = (element, value, compareDate, format = 'HH:mm') => {
      element.simulate('change', value, {stopPropagation: stopPropagationSpy, target: {value}});
      assert(stopPropagationSpy.called);

      const args = spy.lastCall.args;
      assert.deepEqual(args[0], compareDate.format ? compareDate.format(format) : compareDate);
      assert.deepEqual(+args[1], +compareDate);
    };

    beforeEach(() => {
      now = moment().second(0).millisecond(0);
      spy = sinon.spy();
      stopPropagationSpy = sinon.spy();
    });

    it('when hour changes', () => {
      const tree = shallow(<Clock onChange={spy} value={now} />);
      const hour = findHourTextfield(tree);
      assertChangeArgs(hour, '10', now.hour(10));
      assertChangeArgs(hour, '', '');
      tree.setState({value: null});
      assertChangeArgs(hour, '24', now.hour(23));
    });

    it('when minute changes', () => {
      now = now.hour(0);
      const tree = shallow(<Clock onChange={spy} value={now} />);
      const minute = findMinuteTextfield(tree);
      assertChangeArgs(minute, '50', now.minute(50));
      assertChangeArgs(minute, '', '');
      tree.setState({value: null});
      assertChangeArgs(minute, '60', now.minute(59));
    });

    it('maintains month, day, and year of value when hour/minute changes are made', () => {
      const date = new Date(2001, 0, 1);
      const valueFormat = 'YYYY-MM-DD HH:mm';
      const tree = shallow(<Clock onChange={spy} value={date} valueFormat={valueFormat} />);
      const minute = findMinuteTextfield(tree);
      assertChangeArgs(minute, '10', moment(date).minute(10), valueFormat);
    });

    it('maintains month, day, and year of defaultValue when hour/minutes changes are made', () => {
      const date = new Date(2001, 0, 1);
      const valueFormat = 'YYYY-MM-DD HH:mm';
      const tree = shallow(
        <Clock onChange={spy} defaultValue={date} valueFormat={valueFormat} />
      );
      const hour = findHourTextfield(tree);
      assertChangeArgs(hour, '3', moment(date).hour(3), valueFormat);
    });
  });

  it('supports defaultValue uncontrolled behavior', () => {
    const now = moment().second(0).millisecond(0);
    const tree = shallow(<Clock defaultValue={now} />);

    // Setting defaultValue later doesn't change the state. Only component interactions
    // change the state.
    tree.setProps({defaultValue: now.clone().add(7, 'day')});
    assert.deepEqual(+tree.state('value'), +now);

    // Component interaction should change the state.
    findHourTextfield(tree).simulate('change', 0, {stopPropagation: function () {}, target: {value: 0}});
    assert.deepEqual(+tree.state('value'), +now.clone().hours(0));
  });

  it('supports value controlled behavior', () => {
    const now = moment();
    const dateWeekLater = now.clone().add(7, 'day');

    const tree = shallow(<Clock value={now} />);

    // Changing value will change the state.
    tree.setProps({value: dateWeekLater});
    assert.deepEqual(+tree.state('value'), +dateWeekLater);

    // Component interaction should not change the state, only manually setting value
    // as a prop will change the state.
    findHourTextfield(tree).simulate('change', 0, {stopPropagation: function () {}, target: {value: 0}});
    assert.deepEqual(+tree.state('value'), +dateWeekLater);
  });

  it('supports quiet', () => {
    const tree = shallow(<Clock quiet />);
    assert.equal(findHourTextfield(tree).prop('quiet'), true);
    assert.equal(findMinuteTextfield(tree).prop('quiet'), true);
  });

  it('supports disabled', () => {
    const tree = shallow(<Clock disabled />);
    assert.equal(tree.prop('aria-disabled'), true);
    assert.equal(findHourTextfield(tree).prop('disabled'), true);
    assert.equal(findMinuteTextfield(tree).prop('disabled'), true);
  });

  it('supports invalid', () => {
    const tree = shallow(<Clock invalid />);
    assert.equal(tree.prop('aria-invalid'), true);
    assert.equal(findHourTextfield(tree).prop('invalid'), true);
    assert.equal(findMinuteTextfield(tree).prop('invalid'), true);
  });

  it('supports readOnly', () => {
    const tree = shallow(<Clock readOnly />);
    assert.equal(findHourTextfield(tree).prop('readOnly'), true);
    assert.equal(findMinuteTextfield(tree).prop('readOnly'), true);
  });

  it('supports required', () => {
    const tree = shallow(<Clock required />);
    assert.equal(findHourTextfield(tree).prop('required'), true);
    assert.equal(findMinuteTextfield(tree).prop('required'), true);
  });

  it('supports additional classNames', () => {
    const tree = shallow(<Clock className="myClass" />);
    assert.equal(tree.hasClass('myClass'), true);
  });

  it('supports additional properties', () => {
    const tree = shallow(<Clock aria-hidden />);
    assert.equal(tree.prop('aria-hidden'), true);
  });

  it('supports setting value as a prop', () => {
    const tree = shallow(<Clock />);
    // set valid value
    tree.setProps({value: '23:59'});
    assert.equal(tree.state('hourText'), '23');
    assert.equal(tree.state('minuteText'), '59');
    // set invalid value
    tree.setProps({value: '24:60'});
    assert.equal(tree.state('hourText'), '23');
    assert.equal(tree.state('minuteText'), '59');
    // invalid data without hourText or minuteText
    tree.setState({hourText: null, minuteText: null});
    tree.setProps({value: '24:60'});
    assert.equal(tree.state('hourText'), '');
    assert.equal(tree.state('minuteText'), '');
  });

  it('supports focus method', () => {
    const tree = mount(<Clock />);
    tree.instance().focus();
    assert.equal(document.activeElement, findHourTextfield(tree).at(0).getDOMNode());
    tree.unmount();
  });

  it('supports autoFocus', async () => {
    const tree = mount(<Clock autoFocus />);
    clock.runAll();
    assert.equal(document.activeElement, findHourTextfield(tree).at(0).getDOMNode());
    tree.unmount();
  });

  it('supports handleFocus, handleHourBlur, handleMinuteBlur', () => {
    const tree = shallow(<Clock />);
    findHourTextfield(tree).simulate('focus');
    assert(tree.state('focused'));
    findHourTextfield(tree).simulate('blur', {target: {value: '1'}});
    clock.runAll();
    tree.update();
    assert(!tree.state('focused'));
    assert.equal(tree.state('hourText'), '01');
    findMinuteTextfield(tree).simulate('focus');
    tree.update();
    assert(tree.state('focused'));
    findMinuteTextfield(tree).simulate('blur', {target: {value: '1'}});
    clock.runAll();
    tree.update();
    assert(!tree.state('focused'));
    assert.equal(tree.state('minuteText'), '01');
    findHourTextfield(tree).simulate('blur', {target: {value: '10'}});
    clock.runAll();
    tree.update();
    assert(!tree.state('focused'));
    assert.equal(tree.state('hourText'), '10');
    findMinuteTextfield(tree).simulate('blur', {target: {value: '10'}});
    clock.runAll();
    tree.update();
    assert(!tree.state('focused'));
    assert.equal(tree.state('minuteText'), '10');
  });

  it('supports looping at min/max and changing am/pm with arrow keys', () => {
    const preventDefaultSpy = sinon.spy();
    const tree = shallow(<Clock defaultValue="23:59" displayFormat="hh:mm a" />);
    assert.equal(tree.state('hourText'), '11');
    assert.equal(tree.state('minuteText'), '59');
    assert.equal(tree.state('meridiemVal'), 'pm');
    assert.equal(findTimeValue(tree).text(), '11:59 pm');
    let textfield = findHourTextfield(tree);
    textfield.simulate('keydown', {
      key: 'ArrowUp',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('hourText'), '12');
    assert.equal(tree.state('meridiemVal'), 'am');
    assert.equal(findTimeValue(tree).text(), '12:59 am');
    assert.equal(preventDefaultSpy.callCount, 1);

    textfield = findHourTextfield(tree);
    textfield.simulate('keydown', {
      key: 'Up',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('hourText'), '01');
    assert.equal(tree.state('meridiemVal'), 'am');
    assert.equal(findTimeValue(tree).text(), '01:59 am');
    assert.equal(preventDefaultSpy.callCount, 2);

    textfield = findHourTextfield(tree);
    textfield.simulate('keydown', {
      key: 'ArrowDown',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('hourText'), '12');
    assert.equal(tree.state('meridiemVal'), 'am');
    assert.equal(findTimeValue(tree).text(), '12:59 am');
    assert.equal(preventDefaultSpy.callCount, 3);

    textfield = findHourTextfield(tree);
    textfield.simulate('keydown', {
      key: 'Down',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('hourText'), '11');
    assert.equal(tree.state('meridiemVal'), 'pm');
    assert.equal(findTimeValue(tree).text(), '11:59 pm');
    assert.equal(preventDefaultSpy.callCount, 4);

    textfield = findMinuteTextfield(tree);
    textfield.simulate('keydown', {
      key: 'ArrowUp',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('minuteText'), '00');
    assert.equal(findTimeValue(tree).text(), '12:00 am');
    assert.equal(preventDefaultSpy.callCount, 5);

    textfield = findMinuteTextfield(tree);
    textfield.simulate('keydown', {
      key: 'ArrowDown',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('minuteText'), '59');
    assert.equal(findTimeValue(tree).text(), '11:59 pm');
    assert.equal(preventDefaultSpy.callCount, 6);

    textfield = findMinuteTextfield(tree);
    textfield.simulate('keydown', {
      key: 'Down',
      preventDefault: preventDefaultSpy
    });

    assert.equal(tree.state('minuteText'), '58');
    assert.equal(findTimeValue(tree).text(), '11:58 pm');
    assert.equal(preventDefaultSpy.callCount, 7);

    textfield = findHourTextfield(tree);
    textfield.simulate('keydown', {
      key: 'Tab',
      preventDefault: preventDefaultSpy
    });
    assert.equal(tree.state('hourText'), '11');
    assert.equal(findTimeValue(tree).text(), '11:58 pm');
    assert.equal(preventDefaultSpy.callCount, 7);
  });

  describe('Accessibility', () => {
    it('supports aria-labelledby', () => {
      const tree = shallow(<Clock />);
      const clockId = tree.instance().clockId;
      const timeValueId = findTimeValue(tree).prop('id');
      assert.equal(findFieldset(tree).prop('aria-labelledby'), timeValueId);
      assert.equal(findHourTextfield(tree).prop('aria-labelledby'), [clockId + '-group', clockId].join(' '));
      assert.equal(findMinuteTextfield(tree).prop('aria-labelledby'), [clockId + '-group', clockId + '-minutes'].join(' '));
      tree.setProps({'aria-labelledby': 'foo'});
      assert.equal(findHourTextfield(tree).prop('aria-labelledby'), ['foo', clockId].join(' '));
      assert.equal(findMinuteTextfield(tree).prop('aria-labelledby'), ['foo', clockId + '-minutes'].join(' '));
    });

    it('supports aria-label', () => {
      const tree = shallow(<Clock aria-label="foo" />);
      const clockId = tree.instance().clockId;
      const timeValueId = findTimeValue(tree).prop('id');
      assert.equal(findFieldset(tree).prop('aria-labelledby'), [clockId + '-group', timeValueId].join(' '));
      assert.equal(findFieldset(tree).prop('aria-label'), 'foo');
      assert.equal(findHourTextfield(tree).prop('aria-labelledby'), [clockId + '-group', clockId].join(' '));
      assert.equal(findMinuteTextfield(tree).prop('aria-labelledby'), [clockId + '-group', clockId + '-minutes'].join(' '));
    });

    describe('in Firefox', () => {
      it('has type="text" and role="spinbutton"', () => {
        let tree = shallow(<Clock value="13:00" displayFormat="hh:mm a" />);
        let instance =  tree.instance();

        // stub _useTextInputText value ('MozAppearance' in document.documentElement.style)
        instance._useTextInputType = true;

        // force update to re-render.
        instance.forceUpdate();

        let hourTextfield = findHourTextfield(tree);
        let minuteTextfield = findMinuteTextfield(tree);

        assert.equal(hourTextfield.prop('type'), 'text');
        assert.equal(hourTextfield.prop('role'), 'spinbutton');
        assert.equal(hourTextfield.prop('min'), null);
        assert.equal(hourTextfield.prop('max'), null);
        assert.equal(hourTextfield.prop('aria-valuemin'), 1);
        assert.equal(hourTextfield.prop('aria-valuemax'), 12);
        assert.equal(hourTextfield.prop('aria-valuenow'), 1);
        assert.equal(hourTextfield.prop('aria-valuetext'), '01');
        assert.equal(hourTextfield.prop('pattern'), '1[0-2]|0?[1-9]');

        assert.equal(minuteTextfield.prop('type'), 'text');
        assert.equal(minuteTextfield.prop('role'), 'spinbutton');
        assert.equal(minuteTextfield.prop('min'), null);
        assert.equal(minuteTextfield.prop('max'), null);
        assert.equal(minuteTextfield.prop('aria-valuemin'), 0);
        assert.equal(minuteTextfield.prop('aria-valuemax'), 59);
        assert.equal(minuteTextfield.prop('aria-valuenow'), 0);
        assert.equal(minuteTextfield.prop('aria-valuetext'), '00');
        assert.equal(minuteTextfield.prop('pattern'), '[0-5]?[0-9]');

        tree = shallow(<Clock value="13:00" displayFormat="HH:MM" />);
        instance =  tree.instance();

        // stub _useTextInputText value ('MozAppearance' in document.documentElement.style)
        instance._useTextInputType = true;

        // force update to re-render.
        instance.forceUpdate();

        hourTextfield = findHourTextfield(tree);
        minuteTextfield = findMinuteTextfield(tree);
        assert.equal(hourTextfield.prop('pattern'), '2[0-3]|[01]?[0-9]');
        assert.equal(hourTextfield.prop('aria-valuemin'), 0);
        assert.equal(hourTextfield.prop('aria-valuemax'), 23);
        assert.equal(hourTextfield.prop('aria-valuenow'), 13);
        assert.equal(hourTextfield.prop('aria-valuetext'), '13');
      });
    });

    describe('in other browsers', () => {
      it('has type="number"', () => {
        let tree = shallow(<Clock value="13:00" displayFormat="hh:mm a" />);

        let hourTextfield = findHourTextfield(tree);
        let minuteTextfield = findMinuteTextfield(tree);

        assert.equal(hourTextfield.prop('type'), 'number');
        assert.equal(hourTextfield.prop('role'), null);
        assert.equal(hourTextfield.prop('min'), 1);
        assert.equal(hourTextfield.prop('max'), 12);
        assert.equal(hourTextfield.prop('aria-valuemin'), 1);
        assert.equal(hourTextfield.prop('aria-valuemax'), 12);
        assert.equal(hourTextfield.prop('aria-valuenow'), 1);
        assert.equal(hourTextfield.prop('aria-valuetext'), '01');
        assert.equal(hourTextfield.prop('pattern'), '1[0-2]|0?[1-9]');

        assert.equal(minuteTextfield.prop('type'), 'number');
        assert.equal(minuteTextfield.prop('role'), null);
        assert.equal(minuteTextfield.prop('min'), 0);
        assert.equal(minuteTextfield.prop('max'), 59);
        assert.equal(minuteTextfield.prop('aria-valuemin'), 0);
        assert.equal(minuteTextfield.prop('aria-valuemax'), 59);
        assert.equal(minuteTextfield.prop('aria-valuenow'), 0);
        assert.equal(minuteTextfield.prop('aria-valuetext'), '00');
        assert.equal(minuteTextfield.prop('pattern'), '[0-5]?[0-9]');

        tree = shallow(<Clock value="13:00" displayFormat="HH:MM" />);

        hourTextfield = findHourTextfield(tree);
        minuteTextfield = findMinuteTextfield(tree);
        assert.equal(hourTextfield.prop('pattern'), '2[0-3]|[01]?[0-9]');
        assert.equal(hourTextfield.prop('min'), 0);
        assert.equal(hourTextfield.prop('max'), 23);
        assert.equal(hourTextfield.prop('value'), 13);
      });
    });
  });

  describe('AM/PM Support', () => {
    it('supports AM/PM format', () => {
      const tree = shallow(<Clock displayFormat="hh:mm a" />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(meridiemDropdown.length, 1);
      assert.equal(tree.state('displayMeridiem'), true);
    });

    it('does not display AM/PM dropdown by default', () => {
      const tree = shallow(<Clock />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(meridiemDropdown.length, 0);
      assert.equal(tree.state('displayMeridiem'), false);
    });

    it('displays am for 01:00', () => {
      const tree = shallow(<Clock value="01:00" displayFormat="hh:mm a" />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(meridiemDropdown.prop('value'), 'am');
    });

    it('displays pm for 13:00', () => {
      const tree = shallow(<Clock value="13:00" displayFormat="hh:mm a" />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(meridiemDropdown.prop('value'), 'pm');
    });

    it('supports lowercase AM', () => {
      const tree = mount(<Clock value="01:00" displayFormat="hh:mm a" />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(meridiemDropdown.find('.spectrum-Dropdown-label').text(), 'am');

      tree.unmount();
    });

    it('supports uppercase AM', () => {
      const tree = mount(<Clock value="01:00" displayFormat="hh:mm A" />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(meridiemDropdown.find('.spectrum-Dropdown-label').text(), 'AM');

      tree.unmount();
    });

    it('handles 13:00 as 1pm', () => {
      const tree = shallow(<Clock value="13:00" displayFormat="hh:mm a" />);
      assert.equal(tree.state('hourText'), '01');
      assert.equal(tree.state('meridiemVal'), 'pm');
      assert.equal(findTimeValue(tree).text(), '01:00 pm');
    });

    it('handles 00:30 as 12:30am', () => {
      const tree = shallow(<Clock value="00:30" displayFormat="hh:mm a" />);
      assert.equal(tree.state('hourText'), '12');
      assert.equal(tree.state('minuteText'), '30');
      assert.equal(tree.state('meridiemVal'), 'am');
      assert.equal(findTimeValue(tree).text(), '12:30 am');
    });

    it('can change from AM to PM', () => {
      const tree = shallow(<Clock value="00:30" displayFormat="hh:mm a" />);
      const meridiemDropdown = findMeridiemDropdown(tree);
      assert.equal(tree.state('meridiemVal'), 'am');
      meridiemDropdown.simulate('change', 'pm');
      assert.equal(tree.state('meridiemVal'), 'pm');
      assert.equal(findTimeValue(tree).text(), '12:30 pm');
      meridiemDropdown.simulate('change', 'am');
      assert.equal(tree.state('meridiemVal'), 'am');
      assert.equal(findTimeValue(tree).text(), '12:30 am');
    });
  });

});
const findFieldset = tree => tree.find('.react-spectrum-Clock');
const findHourTextfield = tree => tree.find('.react-spectrum-Clock-hour');
const findMinuteTextfield = tree => tree.find('.react-spectrum-Clock-minute');
const findTimeValue = tree => tree.find('VisuallyHidden[element="time"]').shallow();
const findMeridiemDropdown = tree => tree.find('.react-spectrum-Clock-meridiem');