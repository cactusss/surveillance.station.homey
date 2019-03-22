const Homey = require('homey');
const util = require('/lib/util.js');

module.exports = [
	{
		description: 'Motion Detected',
		method   : 'GET',
		path     : '/motion/:camera',
		public   : true,
		fn: function(args, callback) {
      Homey.ManagerFlow.getCard('trigger', 'motionDetected').trigger({ camera: args.params.camera })
        .then(callback(null, true))
        .catch(callback('error', false));
		}
	},
  {
		description: 'Test email',
		method     : 'PUT',
		path       : '/testemail/',
		public     : false,
		fn: function(args, callback) {
			util.testEmail(args)
        .then(result => {
          callback(false, true);
        })
        .catch(error => {
          callback(error, false);
        })
		}
	}
]
