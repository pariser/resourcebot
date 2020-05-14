var async = require('async');

var formatter = require('../lib/formatter');

module.exports = function(app) {
  app.command('help', function(bot, message) {
    async.waterfall([
      function(cb) {
        bot.startPrivateConversation(message, cb);
      },
      function(convo, cb) {
        var helpTable = formatter.dataTable([
          [ 'list', 'List all resources' ],
          [ 'list available', 'List all resources which are currently available' ],
          [ 'add <name>', 'Add a resource with name <name>' ],
          [ 'remove <name>', 'Remove the resource with name <name>' ],
          [ 'claim <name> [duration]', 'Claim resource with name <name>' ],
          [ '', 'If [duration] is not applied, defaults to 1 hour.' ],
          [ '', 'Example durations are: "for 1 day", "until tonight"' ],
          [ 'release <name>', 'Release your claim on resource with name <name>' ],
          [ 'unclaim <name>', '' ],
          ['status <name> <status>', 'Sets the status of <name> to <status>']
        ]);

        var help = '@' + app.slack_username + ' v' + app.version + ':';
        help += '```' + helpTable + '```';

        convo.say(help, cb);
        convo.next();
      },
      function(convo, cb) {
        convo.stop();
        cb();
      }
    ], function(err) {
      if (err) {
        console.error('Unexpected error:', err);
        return;
      }
    });
  });

};
