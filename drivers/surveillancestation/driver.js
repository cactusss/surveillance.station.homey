"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class SurveillanceStationDriver extends Homey.Driver {

  onPair(socket) {
    socket.on('testConnection', function(data, callback) {
      let path = 'http://'+ data.address +':'+ data.port +'/webapi/query.cgi?api=SYNO.API.Info&method=Query&version=1&query=SYNO.API.Auth,SYNO.SurveillanceStation';
      util.sendCommand(path)
        .then(result => {
          callback(false, result);
        })
        .catch(error => {
          callback(error, false);
        })
    });
  }

}

module.exports = SurveillanceStationDriver;
