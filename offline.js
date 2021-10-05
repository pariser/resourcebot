var botkit = require('./lib/Botkit');
var logger = console;

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

var controller = botkit.slackbot({
    debug: true,
    logger: logger
});

var bot = controller.spawn(slackConfig);
var app = {
    version: PACKAGE_VERSION,
    LISTEN_ON: LISTEN_ON,
    slack_username: SLACK_USERNAME,
    mongo_config: mongoConfig,
    slack_config: slackConfig,
    controller: controller,
    bot: bot,
    command: function(commandDescription, func) {
        'use strict';
        return this.controller.hears(commandDescription, LISTEN_ON, func);
    }
};

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

module.exports = app;
