const fs = require("fs");
const request = require("request");
const async = require("async");
const cron = require("node-cron");
const NodeCache = require( "node-cache" );
const cache = new NodeCache();
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

client.on('ready', () => {
  console.log(`Discord Logged in as ${client.user.tag}!`);
});

let task = cron.schedule("0 */15 * * * *", function() {
  console.log(new Date());
  console.log("---------------------");
  console.log("Running Cron Job");
  let options = { method: 'GET',
    url: 'https://gateway.chotot.com/v1/public/ad-listing',
    json: true,
    qs:
     { region_v2: '13000',
       cg: '5000',
       w: '1',
       limit: '20',
       st: 's,k',
       f: 'p',
       page: '1' },
    headers:
     { 'Postman-Token': '513bb4d8-22b2-44c6-b830-aa612fd2e2e3',
       'cache-control': 'no-cache' } };

  request(options, function (error, response, body) {
    if (error) {
      return console.error(error.message)
    }

    if (response.statusCode != 200) {
      return
    }

    console.log(body.ads.length)
    async.each(body.ads, (ad, callback) => {
      if (cache.get(ad.ad_id) != undefined) {
        console.log(`Already sent: ${ad.ad_id}`)
        console.log(ad);
        return
      }

      cache.set(ad.ad_id, true)
      let image = ad.image || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg"
      client.channels.get(config.channel_id).send(`
        ===============================================\n**${ad.subject}**\n***${ad.price_string}***\n*${ad.area_name} - ${ad.region_name}*\n*https://nha.chotot.com/${ad.list_id}.htm*
      `, {
        files: [`${image}?file=file.png`]
      }).then(() => {
        return callback()
      }).catch(err => {
        console.log(`Send to discord err: ${err.message}`)
        console.log(ad)
        return callback()
      })
    }, (err) => {

    });
  });
}, {
  schedule: false
});

const prefix = config.prefix;

client.on('message', msg => {
  if (msg.author.bot || !msg.content.startsWith(prefix)) {
    return;
  }
  console.log('Message: ' + msg);
  const args = msg.content.slice(prefix.length).trim().split(' ');
  // Remove first element in args and return it
  const cmd = args.shift().toLowerCase();
  console.log(args);
  if (cmd === 'ping') {
    msg.channel.send("I'm here!");
  } else if (cmd === 'start') {
    task.start();
    msg.channel.send("Started!");
  } else if (cmd === 'stop') {
    task.stop();
    msg.channel.send("Stopped!");
  } else {
    msg.channel.send("What do you want?");
  }
});

client.login(config.token);
