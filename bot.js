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
var ObjectId = storage.ObjectId;

var controller = botkit.slackbot({
  debug: false,
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

  function ensureResourceExists(resourceName, cb) {
    controller.storage.resources.findOne({
      name: resourceName
    }, function(err, resource) {
      if (err) { // Error? Bail!
        return cb(err);
      }

      if (resource) { // Resource already exists? Nothing to do here.
        logger.info('Found resource with name:', resourceName);
        return cb();
      }

      var id = new ObjectId();
      // Resource doesn't exist. Add it!
      logger.info('Adding resource with name:', resourceName, ', id:', id);
      controller.storage.resources.save(resourceName, {
        created_at: new Date()
      }, cb);
    });
  }

  function ensureResourcesExist(cb) {
    async.each([ 'staging', 'beta', 'demo' ], function(resourceName, next) {
      ensureResourceExists(resourceName, next);
    }, cb);
  }

  async.series([
    ensureResourcesExist,
    function(cb) {
      bot.startRTM();
      cb();
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
require('./commands/claim')(app);
require('./commands/release')(app);

// exit handling
var exitHandler = function(options, err) {
  if (options.cleanup) {
    logger.info('in exitHandler(), process.exit()');
  }

  if (err) {
    logger.error(err.stack);
  }

  if (options.exit) {
    logger.info("Process exiting");
    process.exit();
  }
};

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit:true
}));