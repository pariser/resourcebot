var async = require('async');

module.exports = function(app) {
  app.command('^(release|unclaim) (claim (on )?)?([a-zA-Z0-9\-]+)', function(bot, message) {
    var resourceName = message.match[4];
    var now = new Date();

    function ResourceDoesNotExist() {}
    function ResourceNotClaimed() {}
    function ResourceNotClaimedByMessageUser(user) {
      this.user = user;
    }

    async.waterfall([
      function(cb) {
        app.storage.resources.findOne({
          name: resourceName
        }, cb);
      },
      function(resource, cb) {
        if (!resource) {
          return cb(new ResourceDoesNotExist());
        }

        if (!resource.claim_until || resource.claim_until < now) {
          return cb(new ResourceNotClaimed());
        }

        if (resource.user !== message.user) {
          return cb(new ResourceNotClaimedByMessageUser(resource.user));
        }

        app.storage.resources.save(resourceName, {
          claim_until: null,
          user: null
        }, cb);
      },
      function(updatedResource, cb) {
        bot.reply(message, 'Got it! You\'ve released your claim on `' + updatedResource.name + '`.', cb);
      }
    ], function(err) {
      if (err && err instanceof ResourceDoesNotExist) {
        bot.reply(message, 'Couldn\'t find resource with name: `' + resourceName + '`.');
        return;
      }

      if (err && err instanceof ResourceNotClaimed) {
        bot.reply(message, 'Resource `' + resourceName + '` is not currently claimed.');
        return;
      }

      if (err && err instanceof ResourceNotClaimedByMessageUser) {
        return app.api.users.info({ user: err.user }, function(apiErr, res) {
          var otherUserName = 'another user';

          if (!apiErr) {
            otherUserName = '@' + res.user.name;
          }

          bot.reply(message, 'You do not have a claim on `' + resourceName + '`. This resource is claimed by ' + otherUserName + '.');
        });
      }

      if (err) {
        console.error('Unexpected error:', err);
        return;
      }
    });
  });

};
