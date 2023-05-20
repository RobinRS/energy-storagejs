const EnergyStorage = require('./energystorage')

module.exports = function (opts) {
  if (typeof opts !== "object") throw new TypeError("energy-storagejs needs an object containing the configuration");
  return new EnergyStorage(opts);
};