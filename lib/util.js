const Homey = require('homey');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

exports.sendCommandWrapper = function (address, port, username, password, command) {
  return new Promise(async function (resolve, reject) {
    try {
      let login_path = 'http://'+ address +':'+ port +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=6&account='+ username +'&passwd='+ password +'&session=SurveillanceStation&format=sid';
      let sid = await exports.sendCommand(login_path);
      let command_path = command + sid.data.sid;
      let result = await exports.sendCommand(command_path);
      let logout_path = 'http://'+ address +':'+ port +'/webapi/auth.cgi?api=SYNO.API.Auth&method=Logout&version=6&session=SurveillanceStation&_sid='+ sid.data.sid;
      let logout = await exports.sendCommand(logout_path);
      return resolve(result);
    } catch (error) {
      return reject(error);
    }
  })
}

exports.sendCommand = function (path) {
  return new Promise(function (resolve, reject) {
    fetch(path, {
        method: 'GET'
      })
      .then(checkStatus)
      .then(res => res.json())
      .then(json => {
        return resolve(json);
      })
      .catch(error => {
        return reject(error);
      });
  })
}

exports.sendCommandStream = function (path) {
  return new Promise(function (resolve, reject) {
    fetch(path, {
        method: 'GET',
        timeout: 10000
      })
      .then(checkStatus)
      .then(res => {
        return resolve(res);
      })
      .catch(error => {
        return reject(error);
      });
  })
}

exports.getCameras = function (address, port, username, password) {
  return new Promise(async function (resolve, reject) {
    try {
      let list = [];
      let command = 'http://'+ address +':'+ port +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.Camera&version=9&basic=true&method="List"&_sid=';
      let result = await exports.sendCommandWrapper(address, port, username, password, command);
      for (let camera of result.data.cameras) {
        list.push({
          icon: '/app/surveillance.station.homey/drivers/surveillancestation/assets/icon.svg',
          name: camera.newName,
          id: camera.id
        });
      }
      return resolve(list);
    } catch (error) {
      return reject(error);
    }
  })
}

exports.getSnapshot = function (address, port, username, password, camId, save) {
  return new Promise(async function (resolve, reject) {
    try {
      let command = 'http://'+ address +':'+ port +'/webapi/entry.cgi?api=SYNO.SurveillanceStation.SnapShot&version=1&camId='+ camId +'&method=TakeSnapshot&blSave='+ save +'&dsId=0&_sid=';
      let result = await exports.sendCommandWrapper(address, port, username, password, command);
      if (result.success == true) {
        if (save == 'false') {
          let image = new Buffer(result.data.imageData, 'base64');
          return resolve(image);
        } else {
          return resolve();
        }
      } else {
        return reject(Homey.__('Camera not available, unable to create snapshot.'));
      }
    } catch (error) {
      return reject(error);
    }
  })
}

exports.testEmail = function (args) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      host: args.body.email_hostname,
      port: args.body.email_port,
      secure: args.body.email_secure,
      auth: {
        user: args.body.email_username,
        pass: args.body.email_password
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Surveillance Station App <' + args.body.email_sender + '>',
      to: args.body.email_sender,
      subject: 'Test Email Surveillance Station App',
      text: Homey.__('This is a test email which confirms your email settings in the Surveillance Station App are correct.'),
      html: Homey.__('<h1>Surveillance Station App</h1><p>This is a test email which confirms your email settings in the Surveillance Station App are correct.</p>')
    }

    transporter.sendMail(mailOptions)
      .then(info => {
        return resolve(info);
      })
      .catch(error => {
        return reject(error);
      });
  });
}

exports.emailSnapshot = function (image, mailto) {
  return new Promise(function (resolve, reject) {
    var now = getDateTime();
    var cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

    var transporter = nodemailer.createTransport({
      host: Homey.ManagerSettings.get('email_hostname'),
      port: Homey.ManagerSettings.get('email_port'),
      secure: Homey.ManagerSettings.get('email_secure'),
      auth: {
        user: Homey.ManagerSettings.get('email_username'),
        pass: Homey.ManagerSettings.get('email_password')
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Surveillance Station App <' + Homey.ManagerSettings.get('email_sender') + '>',
      to: mailto,
      subject: 'Surveillance Station Snapshot - '+ now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min,
      text: '',
      html: Homey.__('<h1>Surveillance Station App</h1><p>This snapshot was taken at ') + now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min +'.</p><p><img src="cid:'+ cid +'" alt="Surveillance Station Snapshot" border="0" /></p>',
      attachments: [ {
        filename: 'surveillance_snapshot.jpg',
        content: new Buffer(image, 'base64'),
        cid: cid
      } ]
    }

    transporter.sendMail(mailOptions)
      .then(info => {
        return resolve(info);
      })
      .catch(error => {
        return reject(error);
      });
  })
}

function checkStatus(res) {
  if (res.ok) {
    return res;
  } else {
    throw new Error(res.status);
  }
}

function getDateTime() {
  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;

  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return { year: year, month: month, day: day, hour: hour, min: min };
}
