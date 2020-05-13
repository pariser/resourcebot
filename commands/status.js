var async = require('async');

module.exports = function(app) {
  app.command('status( resource)? ([A-Za-z0-9\-]+) ([A-Za-z0-9\s]+)$', function(bot, message) {
    var resourceName = message.match[2];
    var newStatus = message.match[3];
    var resource;

    function ResourceDoesNotExist() {}

    async.waterfall([
      function(cb) {
        app.storage.resources.findOne({
          name: resourceName
        }, cb);
      },
      function(_resource, cb) {
        resource = _resource;
        cb();
      },
      function(cb) {
        if (!resource) {
          return cb(new ResourceDoesNotExist());
        } 
      
        app.storage.resources.save(resourceName, {
          status: newStatus
        }, cb);
      },
      function(cb) {
        bot.reply(message, 'Okay, I\'ve updated the status for `' + resourceName + '`', cb);
      }
    ], function(err) {
      if (err) {
        if (err instanceof ResourceDoesNotExist) {
          bot.reply(message, 'Sorry, it looks like there\'s no existing resource called `' + resourceName + '`');
        } else {
          console.error('Unexpected error:', err);
          bot.reply(message, 'Unexpected error: ' + err);
        }
      }
    });
  });
};
