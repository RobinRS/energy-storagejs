const energyStorage = require('../index')

const battery = energyStorage({
  ip: '192.168.2.230',
  fullRequest: '/cgi/ems_data.js',
  simpleRequest: '/cgi/ems_data.xml',
  paramsRequest: '/cgi/ems_conf.js',
  type: 'v',
})

battery.requestFull().then(() => {
  battery.parse()
  console.log(battery.getGridPower())
}) 