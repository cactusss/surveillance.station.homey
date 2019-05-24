'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class SurveillanceStationDevice extends Homey.Device {

  async onInit() {

    let cameras = await util.getCameras(this.getSetting('address'), this.getSetting('port'), this.getSetting('username'), this.getSetting('password'));
    for (let camera of cameras) {
      this.cameraSnapshot = new Homey.Image();
      this.cameraSnapshot.setStream(async (stream) => {
        try {
          const base64 = await util.getSnapshot(this.getSetting('address'), this.getSetting('port'), this.getSetting('username'), this.getSetting('password'), camera.id, 'false');
          return stream.write(base64);
        } catch(error) {
          throw new Error(error);
        }
      });

      this.cameraSnapshot.register()
        .then(() => {
          return this.setCameraImage(camera.name, camera.name +' Snapshot', this.cameraSnapshot);
        })
        .catch(this.error.bind(this, 'cameraSnapshot.register'));
    }

  }

}

module.exports = SurveillanceStationDevice;
