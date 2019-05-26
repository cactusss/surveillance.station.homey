const Homey = require('homey');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

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

exports.getCameras = function (path) {
  return new Promise(async function (resolve, reject) {
    try {
      let list = [];
      let result = await exports.sendCommand(path);
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

exports.getBufferSnapshot = function (path) {
  return new Promise(function (resolve, reject) {
    fetch(path, {
        method: 'GET'
      })
      .then(checkStatus)
      .then(res => res.buffer())
      .then(buffer => {
        return resolve(buffer);
      })
      .catch(error => {
        return reject(error);
      });
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
        content: image,
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
