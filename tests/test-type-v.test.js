const energyStorage = require('./../index')

const battery = energyStorage({
  ip: '0.0.0.0',
  fullRequest: '/cgi/ems_data.js',
  simpleRequest: '/cgi/ems_data.xml',
  paramsRequest: '/cgi/ems_conf.js',
  type: 'v',
})

battery.__debug_inject(`<root Timestamp="1684605007" id="000000000" ChargerCount="2" Description="YOUR-NAME">
<inverter id="C000000">
<var name="P" value="0"/>
<var name="SOC" value="955"/>
<var name="Capacity" value="8700"/>
<var name="State" value="4"/>
<var name="OG" value="4000"/>
<var name="UG" value="-4000"/>
</inverter>
</root>`, true)
battery.parse()

test('raw data should parse correct', () => {
  expect(battery._data()).not.toBeNull();
});

test('battery should return 95.5%', () => {
  expect(battery.getPercentageF()).toBe('95.5%');
});

test('battery should return 95.5%', () => {
  expect(battery.getPercentage()).toBe(95.5);
});

test('battery state should be "Standby"', () => {
  expect(battery.getStateText()).toBe('Standby');
});

test('battery description/name should be parsed to "YOUR-NAME"', () => {
  expect(battery.getDescription()).toBe('YOUR-NAME');
});