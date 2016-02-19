var async = require('async');

module.exports = function(app){

  app.command(['add( resource)? ([a-zA-Z]+)'], function(bot, message) {
    var resourceName = message.match[2];

    function ResourceAlreadyExistsError() {}

    async.waterfall([
      function(cb) {
        app.storage.resources.findOne({
          name: resourceName
        }, cb);
      },
      function(resource, cb) {
        if (resource) {
          return cb(new ResourceAlreadyExistsError());
        }

        cb();
      },
      function(cb) {
        app.storage.resources.save(resourceName, {
          created_at: new Date(),
        }, cb);
      },
      function(resource, cb) {
        bot.reply(message, "Great, I've added a resource named `" + resourceName + "`", cb)
      }
    ], function(err) {
      if (err && err instanceof ResourceAlreadyExistsError) {
        bot.reply(message, "Sorry, it looks like there's an existing resource called `" + resourceName + "`");
        return;
      };

      if (err) {
        console.error("Unexpected error:", err);
        return;
      }
    });
  });

};
