'use strict';

const Homey = require('homey');
const Util = require('/lib/util.js');

class SurveillanceStationDevice extends Homey.Device {

  async onInit() {
    if (!this.util) this.util = new Util({homey: this.homey});

    // INITIALLY SET DEVICE AS AVAILABLE
    this.setAvailable();

    // UPDATE SESSION
    this.updateSessionId();
    this.updateSessionIdInterval = setInterval(this.updateSessionId.bind(this), 60 * 60 * 1000);

    // SNAPSHOT TOKENS
    let path_cameras = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ this.getStoreValue('sid');
    let cameras = await this.util.getCameras(path_cameras);
    for (let camera of cameras) {
      this.cameraSnapshot = await this.homey.images.createImage();
      this.cameraSnapshot.setStream(async (stream) => {
        let endpoint = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&cameraId='+ camera.id +'&method=GetSnapshot&_sid='+ this.getStoreValue('sid');
        let image = await this.util.getStreamSnapshot(endpoint);

        if (image.headers.get('Content-Type') == 'image/jpeg') {
          return image.body.pipe(stream);
        } else if (image.headers.get('Content-Type') == 'application/json; charset="UTF-8"') {
          var json = await image.json();
          if (json.error.code === 402) {
            var img = 'disabled.png';
          } else {
            var img = 'offline.png';
          }
          let offline_endpoint = `http://${ await this.homey.cloud.getLocalAddress() }/app/surveillance.station.homey/assets/`+ img;
          let offline = await this.util.getStreamSnapshot(offline_endpoint);
          return offline.body.pipe(stream);
        }

        stream.on('error', () => {
          throw new Error('Image Stream Error');
        });

        stream.on('timeout', () => {
          throw new Error('Image Stream Timeout');
        });
      });
      await this.setCameraImage(camera.name, camera.name +' Snapshot', this.cameraSnapshot);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  }

  onDeleted() {
    clearInterval(this.updateSessionIdInterval);
  }

  // HELPER FUNCTIONS
  async updateSessionId() {
    try {
      /* saving current sid */
      if (this.getStoreValue('sid')) {
        var current_sid = this.getStoreValue('sid');
      }

      /* get new id */
      let login_endpoint = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=6&account='+ this.getSetting('username') +'&passwd='+ this.getSetting('password') +'&session=SurveillanceStation&format=sid';
      let sid = await this.util.sendCommand(login_endpoint, 5000);
      if (sid) {
        this.setStoreValue('sid', sid.data.sid);
        this.setAvailable();
      } else {
        throw new Error('No session ID');
      }

      /* logout old session */
      if (current_sid) {
        let logout_endpoint = 'http://'+ this.getSetting('address') +':'+ this.getSetting('port') +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Logout&version=6&session=SurveillanceStation&_sid='+ current_sid;
        let logout = await this.util.sendCommand(logout_endpoint, 5000);
      }

      return Promise.resolve(true);
    } catch (error) {
      this.log(error);
      return Promise.reject(error);
    }
  }

}

module.exports = SurveillanceStationDevice;
