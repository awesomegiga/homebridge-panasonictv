var inherits = require('util').inherits;
var PanasonicViera = require('panasonic-viera-control/panasonicviera.js');
var http = require('http');
var ssdp = require('node-upnp-ssdp');

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-panasonictv", "TV", PanasonicTV);
}

function PanasonicTV(log, config) {
  this.log = log;
  this.name = config.name;
  this.HOST = config.ip;
  this.UUID = config.uuid;
  this.maxVolume = config.maxVolume || 12;
  this.powerState;


  // Init the panasonic controller
  this.tv = new PanasonicViera(this.HOST);
  this.Sspd = new ssdp();

  Ssdp.on('DeviceAvailable', function output(self){
  if (self.nt == PanasonicTV){
    console.log('Panasonic TV is turned ON\n');
    console.log(self);}
  });


  Ssdp.on('DeviceUnavailable', function output(self){
  if (self.nt == PanasonicTV){
    console.log('Panasonic TV is turned OFF\n');
    console.log(self);}
  });
}


PanasonicTV.prototype = {

  getOn: function(callback) {
    this.getPowerState(this.UUID, this.powerState);
    this.log(this.name, "Get Power State = ", this.powerState);
    callback(null, this.powerState);
  },

  setOn: function(on, callback) {
    var self = this;
    self.setOnCallback = callback;

    // this.getPowerState(this.HOST, function(state) {
    //
    //   if (state == -1 && on) {
    //     self.tv.send(PanasonicViera.POWER_TOGGLE);
    //     self.setOnCallback(null, true);
    //   }
    //   else if (state == 0 && on) {
    //     self.setOnCallback(new Error("The TV is *really* off and cannot be woken up."));
    //   }
    //   else if (state == 1 && !on) {
    //    self.tv.send(PanasonicViera.POWER_TOGGLE);
    //     self.setOnCallback(null, false);
    //   }
    //   else {
    //    self.setOnCallback(new Error("Cannot fullfill " + (on ? "ON" : "OFF") + " request. Powerstate == " + state));
    //   }
    // })

    self.tv.send(PanasonicViera.POWER_TOGGLE);
    self.setOnCallback(null, true);
  },

  // setMuteTV: function(value, callback){
  //   this.tv.setMute(value);
  //   callback(null);
  // },
  //
  // getMuteStatus: function(callback){
  //   var self = this;
  //   self.muteCallback = callback;
  //
  //   this.getPowerState(this.HOST, function(state) {
  //       if (state == 1) {
  //         self.tv.getMute(function (muteStatus) {
  //           self.muteCallback(null, muteStatus);
  //         });
  //       }
  //       else {
  //         self.muteCallback(null, 0);
  //       }
  //   });
  // }

}

PanasonicTV.prototype.getPowerState = function(ipAddress, uuid) {

}


// Returns:
// -1 when the TV is in standby-mode (a 400-Bad Request is returned by the TV)
//  0 when the TV is off, or it's a TV that does not support the standby wake-up request(the request errors)
//  1 when the TV is on (a normal 200 response is returned)
// PanasonicTV.prototype.getPowerState = function(ipAddress, stateCallback) {
//
//   var path = "/dmr/control_0";
//   var body = '<?xml version="1.0" encoding="utf-8"?>\n' +
//              '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n' +
//              ' <s:Body>\n' +
//              '  <u:getVolume xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">\n' +
//              '   <InstanceID>0</InstanceID><Channel>Master</Channel>\n' +
//              '  </u:getVolume>\n' +
//              ' </s:Body>\n' +
//              '</s:Envelope>\n';
//
//   var post_options = {
//     host: ipAddress,
//     port: '55000',
//     path: path,
//     method: 'POST',
//     headers: {
//       'Content-Length': body.length,
//       'Content-Type': 'text/xml; charset="utf-8"',
//       'User-Agent': 'net.thlabs.nodecontrol',
//       'SOAPACTION': '"urn:schemas-upnp-org:service:RenderingControl:1#getVolume"'
//     }
//   }
//
//   // The request intermittently TIMES OUT, ERRORS, OR BOTH(!) when the TV is not
//   // available. Therefore we're maintaining state whether the callback is called
//   // since you're only allowed to call the Homekit-callback once.
//   var calledBack = false;
//
//   var req = http.request(post_options, function(res) {
//     res.setEncoding('utf8');
//     res.on('data', function(data) {
//       // do nothing here, but without attaching a 'data' event, the 'end' event is not called
//     });
//     res.on('end', function() {
//       if(res.statusCode == 200) {
//         if (!calledBack) {
//           stateCallback(1);
//         }
//       }
//       else {
//         if (!calledBack) {
//           stateCallback(-1);
//         }
//       }
//     });
//   });
//
//  req.on('error', function(e) {
//     console.log('errored');
//     console.log(e);
//     if (!calledBack) {
//       stateCallback(0);
//       calledBack = true;
//     }
//     else {
//       console.log ("already called callback");
//     }
//   });
//   req.on('timeout', function() {
//     console.log('timed out');
//     if (!calledBack) {
//       stateCallback(0);
//       calledBack = true;
//     }
//     else {
//       console.log ("already called callback");
//     }
//   });
//
//   req.setTimeout(2000);
//
//   req.write(body);
//   req.end();
// }

PanasonicTV.prototype.getServices = function() {

  this.informationService = new Service.AccessoryInformation();

  this.informationService
  .setCharacteristic(Characteristic.Manufacturer, "Panasonic")
  .setCharacteristic(Characteristic.Model, "55CX700")
  .setCharacteristic(Characteristic.SerialNumber, "Panasonic SN");

  this.service = new Service.Switch(this.name);

  this.service
  .getCharacteristic(Characteristic.On)
  .on('set', this.setOn.bind(this))
  .on('get', this.getOn.bind(this));

  // this.service
  // .addCharacteristic(Characteristic.Mute)
  // .on('get', this.getMuteStatus.bind(this))
  // .on('set', this.setMuteTV.bind(this));

  return [this.informationService, this.service];
}
