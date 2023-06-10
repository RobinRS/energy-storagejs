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

  async requestFull () {
    if (this.opts.type === 'v') {
      this.__rawConfig = await this._requestV_ems_confjs()
      this.__rawData = await this._requestV_ems_datajs()
      this.__simple = false
    }
  }

  parse () {
    if (this.__rawData === null) throw new TypeError("requestFull/requestSimple must be called atleast once");
    if (this.opts.type === 'v') {
      this.__data = (this.__simple ? this._parseV_ems_dataxml() : this._parseV_ems_datajs())
    }
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

  getData () {
    return this.__data
  }

  getGridPower () {
    if (this.__simple) throw new TypeError("For this battery gridpower is only supported on full request, help here to improve https://github.com/RobinRS/energy-storagejs");
    if (this.opts.type === "v") {
      const c = this.__data.rawData.EMETER_Data
      this.__data.data.gridpower = Math.round((c.U_V_L1 * c.Iw_V_L1 + c.U_V_L2 * c.Iw_V_L2 + c.U_V_L3 * c.Iw_V_L3) / 100)
    }
    return this.__data.data.gridpower
  }

  _translateV_state () {
    return { 0: 'Busy', 1: 'Active', 2: 'Charging', 3: 'Discharging', 4: 'Standby', 5: 'Error', 6: 'Service/Update', 7: 'Emergencymode' }
  }

  async _requestV_ems_confjs () {
    const request = await fetch(`http://${this.opts.ip}${this.opts.paramsRequest}`)
    const response = await request.text()
    return response
  }

  async _requestV_ems_datajs () {
    const request = await fetch(`http://${this.opts.ip}${this.opts.fullRequest}`)
    const response = await request.text()
    return response
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

  _parseV_ems_datajs () {
    const data = {}

    const configData = this.__rawConfig.replace(/\n/g, "").split(";")
    this.__config = {}
    for (const cfg of configData) {
      const keyVal = cfg.split(" = ")
      this.__config[keyVal[0]] = eval(keyVal[1])
    }

    const rawdata = this.__rawData.replace(/\n/g, "").split(";")
    const rawdatax = {}

    for (const cfg of rawdata) {
      const keyVal = cfg.split(" = ")
      rawdatax[keyVal[0]] = eval(keyVal[1])
    }

    // Inverter Data
    data['WR_Data'] = {}
    for (let i = 0; i < rawdatax['WR_Data'].length; i++) {
      data['WR_Data'][this.__config['WR_Conf'][i]] = rawdatax['WR_Data'][i]
    }

    // Energy Meter Data
    data['EMETER_Data'] = {}
    for (let i = 0; i < rawdatax['EMETER_Data'].length; i++) {
      data['EMETER_Data'][this.__config['EMeter_Conf'][i]] = rawdatax['EMETER_Data'][i]
    }

    // ENS Data
    data['ENS_Data'] = {}
    for (let i = 0; i < rawdatax['ENS_Data'].length; i++) {
      data['ENS_Data'][this.__config['ENS_Conf'][i]] = rawdatax['ENS_Data'][i]
    }

    // Charger/Charger-Modules
    data['Charger_Data'] = {}
    for (let i = 0; i < rawdatax['Charger_Data'].length; i++) {
      data['Charger_Data'][i] = {}
      for (let x = 0; x < rawdatax['Charger_Data'][i].length; x++) {
        data['Charger_Data'][i][this.__config['Charger_Conf'][x]] = rawdatax['Charger_Data'][i][x]
        if (this.__config['Charger_Conf'][x] == 'BattData') {
          data['Charger_Data'][i][this.__config['Charger_Conf'][x]] = {}
          for (let y = 0; y < rawdatax['Charger_Data'][i][x].length; y++) {
            data['Charger_Data'][i][this.__config['Charger_Conf'][x]][this.__config['Batt_Conf'][y]] = rawdatax['Charger_Data'][i][x][y]
            // TODO: Implement Charger Battery Module Information
            /*if (this.__config['Batt_Conf'][y] === 'ModulData') {
              data['Charger_Data'][i][this.__config['Charger_Conf'][x]][this.__config['Batt_Conf'][y]] = {}
            }*/
          }
        }
      }
    }
    return { rawData: data, data: {} }
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