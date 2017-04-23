var inherits = require('util').inherits;
var PanasonicViera = require('panasonic-viera-control/panasonicviera.js');
var ssdp = require('node-upnp-ssdp');
const EventEmitter = require('events');


class sspdUpnpDetection extends EventEmitter {
  constructor(uuid) {
    super();
    this._uuid = uuid;
    this.ssdp = ssdp;
    this.deviceUUID = PanasonicTV_UUID;
    ssdp.on('DeviceAvailable', this.deviceAvailable.bind(this));
    ssdp.on('DeviceUnavailable', this.doeviceUnavailable.bind(this));

  }

  deviceAvailable(upnpDevice){
    if (upnpDevice.nt == this.deviceUUID)
    {
      console.log('Panasonic TV is turned ON\n');
      this.emit('DeviceOn', 'TV');
    }
  }

  doeviceUnavailable(upnpDevice){
    if (upnpDevice.nt == this.deviceUUID)
    {
      console.log('Panasonic TV is turned OFF\n');
      this.emit('DeviceOff', 'TV');
    }
  }
}

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-panasonictv", "TV", PanasonicTV);
};

function PanasonicTV(log, config) {
  this.log = log;
  this.name = config.name;
  this.HOST = config.ip;
  this.UUID = config.uuid;
  this.powerState = false;


  // Init the panasonic controller
  this.tv = new PanasonicViera(this.HOST);

  this.SspdDiscovery = new sspdDiscovery(this.UUID);
  //this.Sspd = new ssdp;

  self = this;
  SspdDiscovery.on('DeviceOn', function (data) {
    self.log('DeviceOn', data);
    self.powerState = true;
    self.eventSet();
  });

  SspdDiscovery.on('DeviceOff', function (data) {
    self.log('DeviceOff', data);
    self.powerState = false;
    self.eventSet();
  });
}


PanasonicTV.prototype = {

  getOn: function(callback) {
    this.log(this.name, "Get Power State = ", this.powerState);
    callback(null, this.powerState);
  },

  togglePower: function(on, callback) {
    this.tv.send(PanasonicViera.POWER_TOGGLE);
    this.log('Toggle power');
  },

  eventSet: function() {
    this.service
    .setCharacteristic(Characteristic.On, this.powerState || false);
    this.log('Set power to', this.powerState);
  }
}

PanasonicTV.prototype.getServices = function() {

  this.informationService = new Service.AccessoryInformation();

  this.informationService
  .setCharacteristic(Characteristic.Manufacturer, "Panasonic")
  .setCharacteristic(Characteristic.Model, "55CX700")
  .setCharacteristic(Characteristic.SerialNumber, this.UUID);

  this.service = new Service.Switch(this.name);

  this.service
  .getCharacteristic(Characteristic.On)
  .on('set', this.togglePower.bind(this))
  .on('get', this.getOn.bind(this));

  // this.service
  // .addCharacteristic(Characteristic.Mute)
  // .on('get', this.getMuteStatus.bind(this))
  // .on('set', this.setMuteTV.bind(this));

  return [this.informationService, this.service];
}
