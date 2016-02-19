require('dotenv').load();


var async = require('async');
var Botkit = require('./lib/Botkit.js')
var BotkitAPI = require('./lib/Slack_web_api.js');
var BotkitMongoStorage = require('./lib/storage/mongo_storage.js');

var SLACK_USERNAME = process.env.BOT_NAME || 'resourcebot';
var PACKAGE_INFORMATION = require('./package.json');
var PACKAGE_VERSION = PACKAGE_INFORMATION.version;

var LISTEN_ON = [
  'direct_message',
  'direct_mention',
  'mention'
];

var mongo_config = {
  mongo_uri: process.env.MONGO_URI
};

var slack_config = {
  token: process.env.SLACK_TOKEN
};

var storage = BotkitMongoStorage(mongo_config);
var ObjectId = storage.ObjectId;

var controller = Botkit.slackbot({
  debug: false,
  storage: storage
});

var bot = controller.spawn(slack_config);
var api = BotkitAPI(controller, slack_config);


var app = {
  version: PACKAGE_VERSION,
  LISTEN_ON: LISTEN_ON,
  slack_username: SLACK_USERNAME,
  mongo_config: mongo_config,
  slack_config: slack_config,
  storage: storage,
  controller: controller,
  bot: bot,
  api: api,
  command: function(commandDescription, func){
    return this.controller.hears(commandDescription, LISTEN_ON, func);
  }
};



(function bootApp() {

  function ensureResourceExists(resourceName, cb) {
    controller.storage.resources.findOne({
      name: resourceName
    }, function(err, resource) {
      if (err) { // Error? Bail!
        return cb(err);
      };

      if (resource) { // Resource already exists? Nothing to do here.
        console.log('Found resource with name:', resourceName);
        return cb();
      }

      var id = new ObjectId();
      // Resource doesn't exist. Add it!
      console.log('Adding resource with name:', resourceName, ", id:", id);
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






require('./commands/help')(app)
require('./commands/list')(app)
require('./commands/add')(app)
require('./commands/claim')(app)
require('./commands/release')(app)

