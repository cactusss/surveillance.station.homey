'use strict';

const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

class Util {

  constructor(opts) {
    this.homey = opts.homey;
  }

  sendCommand(endpoint, timeout = 4000) {
    return new Promise((resolve, reject) => {
      fetch(endpoint, {
          method: 'GET',
          timeout: timeout
        })
        .then(this.checkStatus)
        .then(res => res.json())
        .then(json => {
          return resolve(json);
        })
        .catch(err => {
          return reject(err);
        });
    })
  }

  getBufferSnapshot(endpoint, returntype = 'buffer') {
    return new Promise((resolve, reject) => {
      fetch(endpoint, {
          method: 'GET',
          timeout: 10000
        })
        .then(this.checkStatus)
        .then(res => res.buffer())
        .then(buffer => {
          if (returntype == 'base64') {
            const image = 'data:image/jpeg;base64,' + buffer.toString('base64');
            return resolve(image);
          } else {
            return resolve(buffer);
          }
        })
        .catch(err => {
          return reject(err);
        });
    })
  }

  getStreamSnapshot(endpoint) {
    return new Promise((resolve, reject) => {
      fetch(endpoint, {
          method: 'GET',
          timeout: 10000
        })
        .then(this.checkStatus)
        .then(res => {
          return resolve(res);
        })
        .catch(error => {
          return reject(error);
        });
    })
  }

  getCameras(endpoint) {
    return new Promise(async (resolve, reject) => {
      try {
        let list = [];
        let result = await this.sendCommand(endpoint);
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

  testEmail(args) {
    var transporter = nodemailer.createTransport({
      host: args.email_hostname,
      port: args.email_port,
      secure: args.email_secure,
      auth: {
        user: args.email_username,
        pass: args.email_password
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Surveillance Station App <' + args.email_sender + '>',
      to: args.email_sender,
      subject: 'Test Email Surveillance Station App',
      text: this.homey.__('util.test_email_body_text'),
      html: this.homey.__('util.test_email_body_html')
    }

    return transporter.sendMail(mailOptions);
  }

  sendSnapshot(image, args) {
    var now = this.getDateTime();
    var cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

    var transporter = nodemailer.createTransport({
      host: this.homey.settings.get('email_hostname'),
      port: this.homey.settings.get('email_port'),
      secure: this.homey.settings.get('email_secure'),
      auth: {
        user: this.homey.settings.get('email_username'),
        pass: this.homey.settings.get('email_password')
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Surveillance Station App <' + this.homey.settings.get('email_sender') + '>',
      to: args.mailto,
      subject: 'Surveillance Station App Snapshot - '+ now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min,
      text: '',
      html: this.homey.__('util.email_snapshot_html') + now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min +'.</p><p><img src="cid:'+ cid +'" alt="Surveillance Station Snapshot" border="0" /></p>',
      attachments: [ {
        filename: 'surveillance_snapshot.jpg',
        content: image,
        cid: cid
      } ]
    }

    return transporter.sendMail(mailOptions);
  }

  getDateTime() {
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

  checkStatus = (res) => {
    if (res.ok) {
      return res;
    } else {
      if (error == 400) {
        throw new Error(this.homey.__('util.400'));
      } else if (error == 401) {
        throw new Error(this.homey.__('util.401'));
      } else if (error == 404) {
        throw new Error(this.homey.__('util.404'));
      } else if (error == 503) {
        throw new Error(this.homey.__('util.503'));
      } else {
        throw new Error(error.status);
      }
    }
  }

}

module.exports = Util;
