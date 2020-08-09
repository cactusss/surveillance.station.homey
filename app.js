'use strict';

const Homey = require('homey');
const Util = require('/lib/util.js');

class SurveillanceStationApp extends Homey.App {

  onInit() {
    this.log('Initializing Surveillance Station Homey app ...');

    if (!this.util) this.util = new Util({homey: this.homey});

    this.homey.flow.getTriggerCard('motionDetected');

    // CONDITION
    this.homey.flow.getConditionCard('cameraEnabled')
      .registerRunListener(async (args) => {
        let endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&basic=true&method=GetInfo&cameraIds='+ args.camera.id +'&_sid='+ args.device.getStoreValue('sid');
        let result = await this.util.sendCommand(endpoint);
        if (result.data.cameras[0].enabled) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })

    this.homey.flow.getConditionCard('cameraRecording')
      .registerRunListener(async (args) => {
        let endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&basic=true&method=GetInfo&cameraIds='+ args.camera.id +'&_sid='+ args.device.getStoreValue('sid');
        let result = await this.util.sendCommand(endpoint);
        if (result.data.cameras[0].recStatus !== 0) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })

    // ACTIONS
    this.homey.flow.getActionCard('setHomeMode')
      .registerRunListener(async (args) => {
        try {
          let homemode = args.homemode == 'home' ? 'true' : 'false';
          let homemode_endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.HomeMode&version=1&method=Switch&on='+ homemode +'&_sid='+ args.device.getStoreValue('sid');
          let result = await this.util.sendCommand(homemode_endpoint);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })

    this.homey.flow.getActionCard('setMotionState')
      .registerRunListener(async (args) => {
        try {
          let motionstate = args.motionstate == 'disabled' ? '-1' : '1';
          let motionstate_endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?source='+ motionstate +'&api=SYNO.SurveillanceStation.Camera.Event&version=1&camId="'+ args.camera.id +'"&method=MDParamSave&_sid='+ args.device.getStoreValue('sid');
          let result = await this.util.sendCommand(motionstate_endpoint);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })

    this.homey.flow.getActionCard('switchCameraState')
      .registerRunListener(async (args) => {
        try {
          let endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&cameraIds="'+ args.camera.id +'"&method="'+ args.state +'"&_sid='+ args.device.getStoreValue('sid');
          let result = await this.util.sendCommand(endpoint);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })

    this.homey.flow.getActionCard('emailSnapshot')
      .registerRunListener(async (args) => {
        try {
          let endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&cameraId='+ args.camera.id +'&method=GetSnapshot&_sid='+ args.device.getStoreValue('sid');
          let image = await this.util.getBufferSnapshot(endpoint, 'buffer');
          let result = await this.util.sendSnapshot(image, args);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })

    this.homey.flow.getActionCard('saveSnapshot')
      .registerRunListener(async (args, state) => {
        try {
          let endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.SnapShot&version=1&camId='+ args.camera.id +'&method=TakeSnapshot&blSave=true&dsId=0&_sid='+ args.device.getStoreValue('sid');
          let result = await this.util.sendCommand(endpoint);
          if (result.success == true) {
            return Promise.resolve(result);
          } else {
            return Promise.reject(this.homey.__('app.not_available'));
          }
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })

    this.homey.flow.getActionCard('recordVideo')
      .registerRunListener(async (args, state) => {
        try {
          let endpoint = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.ExternalRecording&version=2&cameraId='+ args.camera.id +'&method=Record&action='+ args.action +'&_sid='+ args.device.getStoreValue('sid');
          let result = await this.util.sendCommand(endpoint);
          if (result.success == true) {
            return Promise.resolve(result);
          } else {
            return Promise.reject(this.homey.__('app.not_available'));
          }
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener(async (query, args) => {
        let endpoint_cameras = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid='+ args.device.getStoreValue('sid');
        return this.util.getCameras(endpoint_cameras);
      })
  }

}

module.exports = SurveillanceStationApp;
