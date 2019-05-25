'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');
const fetch = require('node-fetch');

class SurveillanceStationDevice extends Homey.Device {

  async onInit() {

    let cameras = await util.getCameras(this.getSetting('address'), this.getSetting('port'), this.getSetting('username'), this.getSetting('password'));
    for (let camera of cameras) {
      this.cameraSnapshot = new Homey.Image();
      this.cameraSnapshot.setStream(async (stream) => {
        try {
          let login_path = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=6&account='+ this.getSetting('username') +'&passwd='+ this.getSetting('password') +'&session=SurveillanceStation&format=sid';
          let sid = await util.sendCommand(login_path);
          let path = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&cameraId='+ camera.id +'&method=GetSnapshot&_sid='+ sid.data.sid;
          let image = await util.sendCommandStream(path);
          if(!image.ok)
            throw new Error('Invalid Response');

          setTimeout(() => {
            let logout_path = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Logout&version=6&session=SurveillanceStation&_sid='+ sid.data.sid;
            let logout = util.sendCommand(logout_path);
          }, 3000);

          return image.body.pipe(stream);

        } catch (error) {
          return reject(error);
        }
      });

      this.cameraSnapshot.register()
        .then(() => {
          return this.setCameraImage(camera.name, camera.name +' Snapshot', this.cameraSnapshot);
        })
        .catch(this.error.bind(this, 'cameraSnapshot.register'));

      await new Promise(resolve => setTimeout(resolve, 1000));

    }

  }

}

module.exports = SurveillanceStationDevice;
