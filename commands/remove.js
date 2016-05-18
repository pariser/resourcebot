var async = require('async');

module.exports = function(app) {
  app.command('remove( resource)? ([^\\s]+)', function(bot, message) {
    var resourceName = message.match[2];

    var ResourceDoesntExistsError = function() {};

    var queryForResource = function(cb) {
      app.storage.resources.findOne({
        name: resourceName
      }, cb);
    };

    var errorIfResourceDoesntExists = function(resource, cb) {
      if (resource) {
        cb();
      } else {
        cb(new ResourceDoesntExistsError());
      }
    };

    var deleteResource = function(cb) {
      app.storage.resources.remove({ name: resourceName }, cb);
    };

    var respondWithSuccessMessage = function(resource, cb) {
      bot.reply(message, 'Great, I\'ve added a resource named `' + resourceName + '`', cb);
    };

    var onError = function(err) {
      if (err) {
        if (err instanceof ResourceDoesntExistsError) {
          bot.reply(message, 'Sorry, I can\'t find a resource called `' + resourceName + '`');
        } else {
          console.error('Unexpected error:', err);
          bot.reply(message, 'Unexpected error: ' + err);
        }
      }
    };

    async.waterfall([
      queryForResource,
      errorIfResourceDoesntExists,
      deleteResource,
      respondWithSuccessMessage
    ], onError);
  });
};
