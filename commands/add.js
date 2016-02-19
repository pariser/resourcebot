var async = require('async');

module.exports = function(app){

  app.command(['add( resource)? ([^\\s]+)'], function(bot, message) {
    var resourceName = message.match[2];

    var ResourceAlreadyExistsError = function() {};

    var queryForResource = function(cb) {
      app.storage.resources.findOne({
        name: resourceName
      }, cb);
    }

    var errorIfResourceExists = function(resource, cb) {
      if (resource) {
        cb(new ResourceAlreadyExistsError);
      }else{
        cb();
      }
    };

    var createResource = function(cb) {
      app.storage.resources.save(resourceName, {
        created_at: new Date(),
      }, cb);
    };

    var respondWithSuccessMessage = function(resource, cb) {
      bot.reply(message, "Great, I've added a resource named `" + resourceName + "`", cb)
    };

    var onError = function(err) {
      if (err) {
        if (err instanceof ResourceAlreadyExistsError){
          bot.reply(message, "Sorry, it looks like there's an existing resource called `" + resourceName + "`");
        }else{
          console.error("Unexpected error:", err);
          bot.reply(message, "Unexpected error: " + err);
        }
      }
    };

    async.waterfall([
      queryForResource,
      errorIfResourceExists,
      createResource,
      respondWithSuccessMessage,
    ], onError);
  });

};
