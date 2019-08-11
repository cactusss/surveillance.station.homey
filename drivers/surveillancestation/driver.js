"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class SurveillanceStationDriver extends Homey.Driver {

  onPair(socket) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let deviceArray = {};

    socket.on('list_devices', (data, callback) => {
      const devices = Object.values(discoveryResults).map(discoveryResult => {
        return {
          name: 'Surveillance Station ['+ discoveryResult.address +']',
          data: {
            id: discoveryResult.id,
          }
        };
      });
      callback(null, devices);
    });

    socket.on('list_devices_selection', (data, callback) => {
      callback();
      selectedDeviceId = data[0].data.id;
    });

    socket.on('login', (data, callback) => {
      const discoveryResult = discoveryResults[selectedDeviceId];
      if(!discoveryResult) return callback(new Error('Something went wrong'));

      let path = 'http://'+ discoveryResult.address +':'+ Number(discoveryResult.txt.admin_port) +'/webapi/query.cgi?api=SYNO.API.Info&method=Query&version=1&query=SYNO.API.Auth,SYNO.SurveillanceStation';
      util.sendCommand(path)
        .then(result => {
          deviceArray = {
            name: 'Surveillance Station ['+ discoveryResult.address +']',
            data: {
              id: discoveryResult.id,
            },
            settings: {
              address: discoveryResult.address,
              port: Number(discoveryResult.txt.admin_port),
      				username: data.username,
      				password: data.password
            }
          }
          callback(false, result);
        })
        .catch(error => {
          callback(error, false);
        })

    });

    socket.on('get_device', (data, callback) => {
      callback(false, deviceArray);
    });

  }

}

module.exports = SurveillanceStationDriver;
