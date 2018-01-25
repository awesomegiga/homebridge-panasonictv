
const EventEmitter = require('events');

class sspdUpnpDetection extends EventEmitter {
  constructor(uuid) {
    super();
    this._uuid = uuid;
    this.ssdp = ssdp;
    this.deviceUUID = uuid || {};
    ssdp.on('DeviceAvailable', this.deviceAvailable.bind(this));
    ssdp.on('DeviceUnavailable', this.doeviceUnavailable.bind(this));

  }

  deviceAvailable(upnpDevice){
    if (upnpDevice.nt == this.deviceUUID)
    {
      //console.log('Panasonic TV is turned ON\n');
      this.emit('DeviceOn', 'TV');
    }
  }

  doeviceUnavailable(upnpDevice){
    if (upnpDevice.nt == this.deviceUUID)
    {
      //console.log('Panasonic TV is turned OFF\n');
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
  this.sspdDiscovery = new sspdUpnpDetection(this.UUID);

  self = this;

  this.sspdDiscovery.on('DeviceOn', function (data) {
    self.powerState = true;
    self.eventSet();
  });

  
    this.sspdDiscovery.on('DeviceOff', function (data) {
      self.powerState = false;
      self.eventSet();
    });
  }


  PanasonicTV.prototype = {

    getOn: function(callback) {
      this.log(this.name, "Get Power State = ", this.powerState);
      callback(null, this.powerState);
    },

    togglePower: function(value, callback) {
      if (this.powerState !== value){
        this.tv.send(PanasonicViera.POWER_TOGGLE);
        this.log('Toggle power');
      }
      callback(null);
    },

    eventSet: function() {
      this.service
      .setCharacteristic(Characteristic.On, this.powerState || false);
      this.log('Set power to', this.powerState);
    }
  }
  
PanasonicTV.prototype.getServices = function() {
  this.service = new Service.Switch(this.name);
  this.service
    .getCharacteristic(Characteristic.On)
    .on('set', this.togglePower.bind(this))
    .on('get', this.getOn.bind(this));

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, "Panasonic")
    .setCharacteristic(Characteristic.Model, "55CX700")
    .setCharacteristic(Characteristic.SerialNumber, this.UUID);

  return [this.informationService, this.service];
}
