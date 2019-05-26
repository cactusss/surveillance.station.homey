'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');
const fetch = require('node-fetch');

class SurveillanceStationDevice extends Homey.Device {

  async onInit() {

    this.updateSessionId();
    this.updateSessionIdInterval = setInterval(this.updateSessionId.bind(this), 60 * 60 * 1000);

    let path_cameras = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ this.getStoreValue('sid');
    let cameras = await util.getCameras(path_cameras);
    for (let camera of cameras) {
      this.cameraSnapshot = new Homey.Image();
      this.cameraSnapshot.setStream(async (stream) => {
        let path = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&cameraId='+ camera.id +'&method=GetSnapshot&_sid='+ this.getStoreValue('sid');
        let image = await util.sendCommandStream(path);

        if (image.headers.get('Content-Type') == 'image/jpeg') {
          return image.body.pipe(stream);
        } else if (image.headers.get('Content-Type') == 'application/json; charset="UTF-8"') {
          var json = await image.json();
          if (json.error.code === 402) {
            var img = 'disabled.png';
          } else {
            var img = 'offline.png';
          }
          let offline_path = `http://${ await Homey.ManagerCloud.getLocalAddress() }/app/surveillance.station.homey/assets/`+ img;
          let offline = await util.sendCommandStream(offline_path);
          return offline.body.pipe(stream);
        }

        stream.on('error', () => {
          throw new Error('Image Stream Error');
        });

        stream.on('timeout', () => {
          throw new Error('Image Stream Timeout');
        });
      });

      this.cameraSnapshot.register()
        .then(() => {
          return this.setCameraImage(camera.name, camera.name +' Snapshot', this.cameraSnapshot);
        })
        .catch(this.error.bind(this, 'cameraSnapshot.register'));

      await new Promise(resolve => setTimeout(resolve, 1000));

    }

  }

  onDeleted() {
    clearInterval(this.updateSessionIdInterval);
  }

  // HELPER FUNCTIONS
  async updateSessionId() {
    /* saving current sid */
    if (this.getStoreValue('sid')) {
      var current_sid = this.getStoreValue('sid');
    }

    /* get new id */
    let login_path = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=6&account='+ this.getSetting('username') +'&passwd='+ this.getSetting('password') +'&session=SurveillanceStation&format=sid';
    let sid = await util.sendCommand(login_path);
    this.setStoreValue('sid', sid.data.sid);

    /* logout old session */
    if (current_sid) {
      let logout_path = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Logout&version=6&session=SurveillanceStation&_sid='+ current_sid;
      let logout = await util.sendCommand(logout_path);
    }
  }

}

module.exports = SurveillanceStationDevice;
