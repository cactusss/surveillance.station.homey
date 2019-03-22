"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class SurveillanceStationApp extends Homey.App {

  onInit() {
    this.log('Initializing Surveillance Station Homey app ...');

    new Homey.FlowCardTrigger('motionDetected').register();

    // CONDITION
    new Homey.FlowCardCondition('cameraEnabled')
      .register()
      .registerRunListener(async (args, state) => {
        let path = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&basic=true&method=GetInfo&cameraIds='+ args.camera.id +'&_sid=';
        let result = await util.sendCommandWrapper(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), path);
        if (result.data.cameras[0].state == 0) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener((query, args) => {
        return util.getCameras(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'));
      })

    new Homey.FlowCardCondition('cameraRecording')
      .register()
      .registerRunListener(async (args, state) => {
        let path = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&basic=true&method=GetInfo&cameraIds='+ args.camera.id +'&_sid=';
        let result = await util.sendCommandWrapper(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), path);
        if (result.data.cameras[0].recStatus !== 0) {
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener((query, args) => {
        return util.getCameras(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'));
      })

    // ACTIONS
    new Homey.FlowCardAction('setHomeMode')
      .register()
      .registerRunListener(async (args, state) => {
        try {
          let homemode = args.homemode == 'home' ? 'true' : 'false';
          let homemode_path = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.HomeMode&version=1&method=Switch&on='+ homemode +'&_sid=';
          let result = await util.sendCommandWrapper(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), homemode_path);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })

    new Homey.FlowCardAction('switchCameraState')
      .register()
      .registerRunListener(async (args, state) => {
        try {
          let path = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=8&cameraIds="'+ args.camera.id +'"&method="'+ args.state +'"&_sid=';
          let result = await util.sendCommandWrapper(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), path);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener((query, args) => {
        return util.getCameras(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'));
      })

    new Homey.FlowCardAction('emailSnapshot')
      .register()
      .registerRunListener(async (args, state) => {
        try {
          let image = await util.getSnapshot(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), args.camera.id, 'false');
          let result = await util.emailSnapshot(image, args.mailto);
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener((query, args) => {
        return util.getCameras(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'));
      })

    new Homey.FlowCardAction('saveSnapshot')
      .register()
      .registerRunListener(async (args, state) => {
        try {
          let result = await util.getSnapshot(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), args.camera.id, 'true');
          return Promise.resolve(result);
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener((query, args) => {
        return util.getCameras(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'));
      })

    new Homey.FlowCardAction('recordVideo')
      .register()
      .registerRunListener(async (args, state) => {
        try {
          let path = 'http://'+ args.device.getSetting('address') +':'+ args.device.getSetting('port') +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.ExternalRecording&version=2&cameraId='+ args.camera.id +'&method=Record&action='+ args.action +'&_sid=';
          let result = await util.sendCommandWrapper(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'), path);
          if (result.success == true) {
            return Promise.resolve(result);
          } else {
            return Promise.reject(Homey.__('Camera not available'));
          }
        } catch (error) {
          return Promise.reject(error);
        }
      })
      .getArgument('camera')
      .registerAutocompleteListener((query, args) => {
        return util.getCameras(args.device.getSetting('address'), args.device.getSetting('port'), args.device.getSetting('username'), args.device.getSetting('password'));
      })
  }

}

module.exports = SurveillanceStationApp;
