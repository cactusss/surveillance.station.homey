'use strict';

const Homey = require('homey');
const Util = require('/lib/util.js');

class SurveillanceStationDriver extends Homey.Driver {

  onInit() {
    if (!this.util) this.util = new Util({homey: this.homey});
  }

  onPair(session) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let deviceArray = {};

    session.setHandler('list_devices', async (data) => {
      const devices = Object.values(discoveryResults).map(discoveryResult => {
        return {
          name: 'Surveillance Station ['+ discoveryResult.address +']',
          data: {
            id: discoveryResult.id,
          }
        };
      });
      return devices;
    });

    session.setHandler('list_devices_selection', async (data) => {
      selectedDeviceId = data[0].data.id;
      return;
    });

    session.setHandler('login', async (data) => {
      try {
        const discoveryResult = discoveryResults[selectedDeviceId];
        if(!discoveryResult) throw new Error('Something went wrong');

        let endpoint = 'http://'+ discoveryResult.address +':'+ Number(discoveryResult.txt.admin_port) +'/webapi/query.cgi?api=SYNO.API.Info&method=Query&version=1&query=SYNO.API.Auth,SYNO.SurveillanceStation';
        let result = await this.util.sendCommand(endpoint);
        if (result) {
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
        }
        return Promise.resolve(true);
      } catch (error) {
        return Promise.reject(error);
      }
    });

    session.setHandler('add_device', async (data) => {
      return new Promise((resolve, reject) => {
        try {
          return resolve(deviceArray);
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

}

module.exports = SurveillanceStationDriver;
