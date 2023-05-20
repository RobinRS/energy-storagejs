"use strict";
const fetch = require("node-fetch")
const xmljs = require('xml-js');


class EnergyStorage {

  constructor (opts) {
    if (typeof opts.ip !== "string") throw new TypeError("IP must be defined");
    if (typeof opts.fullRequest !== "string" && typeof opts.simpleRequest !== "string") throw new TypeError("One request url must be defined");
    if (typeof opts.fullRequest === "string" && typeof opts.paramsRequest !== "string") throw new TypeError("Full request mode requires params");
    if (opts.type !== "v") throw new TypeError("Lib only supports storage type v currently, help to support a wider rage https://github.com/RobinRS/energy-storagejs");
    this.opts = opts
    this.__rawData = null
    this.__data = null
  }

  async requestSimple () {
    if (this.opts.type === 'v') {
      this.__rawData = await this._requestV_ems_dataxml()
      this.__simple = true
    }
  }

  requestFull () {
    this.__simple = false
  }

  parse () {
    if (this.__rawData === null) throw new TypeError("requestFull/requestSimple must be called atleast once");
    if (this.__simple && this.opts.type === 'v') {
      this.__data = this._parseV_ems_dataxml()
    }
    console.log(this.__data)
  }

  getTimeStamp () {
    return this.__data.timestamp
  }

  getChargerCount () {
    return this.__data.metadata.chargercount
  }

  getDescription () {
    return this.__data.name
  }

  getState () {
    return this.__data.data.state
  }

  getStateText () {
    return this.__data.data.stateF
  }

  getPercentageF () {
    return this.__data.data.percentageF
  }

  getPercentage () {
    return this.__data.data.percentage
  }

  _translateV_state () {
    return { 0: 'Busy', 1: 'Active', 2: 'Charging', 3: 'Discharging', 4: 'Standby', 5: 'Error', 6: 'Service/Update', 7: 'Emergencymode' }
  }

  async _requestV_ems_datajs () {

  }

  async _requestV_ems_dataxml () {
    const request = await fetch(`http://${this.opts.ip}${this.opts.simpleRequest}`)
    const response = await request.text()
    const json = JSON.parse(xmljs.xml2json(response))
    return json
  }

  _parseV_ems_dataxml () {
    const data = {}
    const head = this.__rawData.elements[0]
    const inverter = this.__rawData.elements[0].elements[0]
    const inverterData = this.__rawData.elements[0].elements[0].elements
    data.timestamp = head.attributes.Timestamp
    data.timeDate = new Date(parseInt(head.attributes.Timestamp) * 1000)
    data.name = head.attributes.Description
    data.metadata = { chargercount: head.attributes.ChargerCount, id: head.attributes.id, inverterId: inverter.attributes.id }
    data.rawData = Object.assign({}, ...inverterData.map((x) => ({ [x.attributes.name]: x.attributes.value })));
    data.data = {
      percentage: data.rawData.SOC / 10,
      percentageF: (data.rawData.SOC / 10) + "%",
      capacity: data.rawData.Capacity,
      capacityF: (data.rawData.Capacity) + "Wh",
      state: data.rawData.State,
      stateF: this._translateV_state()[data.rawData.State + ""],
      powerInverter: data.rawData.P,
      powerInverterF: (data.rawData.P) + "W"
    }
    return data
  }

  _rawData () {
    return this.__rawData
  }

  _data () {
    return this.__data
  }


  __debug_inject (str, simple) {
    this.__simple = simple
    this.__rawData = JSON.parse(xmljs.xml2json(str))
  }
}

module.exports = EnergyStorage