'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class SurveillanceStationDevice extends Homey.Device {

  async onInit() {

    let cameras = await util.getCameras(this.getSetting('address'), this.getSetting('port'), this.getSetting('username'), this.getSetting('password'));
    for (let camera of cameras) {
      let cameraSnapshot = new Homey.Image('jpg');
      cameraSnapshot.setBuffer(async () => {
        try {
          return await util.getSnapshot(this.getSetting('address'), this.getSetting('port'), this.getSetting('username'), this.getSetting('password'), camera.id, 'false');
        } catch(error) {
          throw new Error(error);
        }
      });

      cameraSnapshot.register()
        .then(() => {
          let cameraSnapshotToken = new Homey.FlowToken(camera.name, {
            type: 'image',
            title: camera.name +' Snapshot'
          })

          cameraSnapshotToken
            .register()
            .then(() => {
              cameraSnapshotToken.setValue(cameraSnapshot);
            })
            .catch(this.error.bind(this, 'cameraSnapshotToken.register'));

        })
        .catch(this.error.bind(this, 'cameraSnapshot.register'));
    }

  }

}

module.exports = SurveillanceStationDevice;
