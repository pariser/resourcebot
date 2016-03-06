var async = require('async');

module.exports = function(app) {
  app.command('help', function(bot, message) {
    async.waterfall([
      function(cb) {
        bot.startPrivateConversation(message, cb);
      },
      function(convo, cb) {
        var help = '@' + app.slack_username + ' v' + app.version + ':';
        help += '```';
        help += 'Command                   Description\n';
        help += '--------------------------------------------------------------------------\n';
        help += 'list                      List all resources\n';
        help += 'list available            List all resources which are currently available\n';
        help += 'add <name>                Add a resource with name <name>\n';
        help += 'claim <name> [duration]   Claim resource with name <name>\n';
        help += '                          If [duration] is not applied, defaults to 1 hour.\n';
        help += '                          Example durations are: "for 1 day", "until tonight"\n';
        help += 'release <name>            Release your claim on resource with name <name>\n';
        help += '```';

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
