// {"log":"{\"name\":\"resourcebot\",\"hostname\":\"1b169c84cf28\",\"pid\":57,\"level\":30,\"msg\":\"No handler for  rtm_close\",\"time\":\"2021-08-18T02:43:35.191Z\",\"v\":0}\n","stream":"stdout","time":"2021-08-18T02:43:35.191524379Z"}

require('dotenv').load();

var async = require('async');
var botkit = require('./lib/Botkit.js');
var botkitAPI = require('./lib/Slack_web_api.js');
var botkitMongoStorage = require('./lib/storage/mongo_storage.js');
var logger = require('./lib/logger');

var SLACK_USERNAME = process.env.BOT_NAME || 'resourcebot';
var PACKAGE_INFORMATION = require('./package.json');
var PACKAGE_VERSION = PACKAGE_INFORMATION.version;

var LISTEN_ON = [
  'direct_message',
  'direct_mention',
  'mention'
];

var mongoConfig = {
  mongo_uri: process.env.MONGO_URI
};

var slackConfig = {
  token: process.env.SLACK_TOKEN
};

var storage = botkitMongoStorage(mongoConfig);

var controller = botkit.slackbot({
  debug: true,
  storage: storage,
  logger: logger
});

var bot = controller.spawn(slackConfig);
var api = botkitAPI(controller, slackConfig);

var app = {
  version: PACKAGE_VERSION,
  LISTEN_ON: LISTEN_ON,
  slack_username: SLACK_USERNAME,
  mongo_config: mongoConfig,
  slack_config: slackConfig,
  storage: storage,
  controller: controller,
  bot: bot,
  api: api,
  command: function(commandDescription, func) {
    'use strict';
    return this.controller.hears(commandDescription, LISTEN_ON, func);
  }
};

(function bootApp() {
  'use strict';

  async.series([
    function(cb) {
      bot.startRTM(cb);
    }
  ], function(err) {
    if (err) {
      console.error('Failed booting app:', err);
      process.exit(1);
    }
  });
}());

require('./commands/help')(app);
require('./commands/list')(app);
require('./commands/add')(app);
require('./commands/remove')(app);
require('./commands/claim')(app);
require('./commands/release')(app);

// Exit handling
var exitHandler = function(options, err) {
  if (options.cleanup) {
    logger.info('in exitHandler(), process.exit()');
  }

  if (err) {
    logger.error(err.stack);
  }

  if (options.exit) {
    logger.info('Process exiting');
    process.exit();
  }
};

process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// Catch Ctrl-c
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// Catch uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit:true
}));
