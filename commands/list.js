var async = require('async');
var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var formatTable = require('../lib/formatTable');

module.exports = function(app) {
  app.command('list( unclaimed| available)?( resources?)? ?([a-zA-Z\-]*)?', function(bot, message) {
    var unclaimed = message.match[1];
    var resourceString = message.match[3];

    async.waterfall([
      function(cb) {
        var query = {};

        if (resourceString && resourceString.length > 0) {
          query.name = {
            '$regex': resourceString
          };
        }

        if (unclaimed) {
          query['$or'] = [
            {
              claimed_until: null
            },
            {
              claimed_until: {
                '$lt': new Date()
              }
            }
          ];
        }

        app.storage.resources.find(query, cb);
      },
      function(resources, cb) {
        if (resources.length === 0) {
          if (resourceString && resourceString.length > 0) {
            if (unclaimed) {
              bot.reply(message, 'No unclaimed resources match `' + resourceString + '`.', cb);
              return;
            }

            bot.reply(message, 'No resources match `' + resourceString + '`.', cb);
            // TODO: ask if the user would like to add it now?
            return;
          }

          bot.reply(message, 'There are no resources yet. Add one now `@'+app.slack_username+' add resource <resource_name>`', cb);
          return;
        }

        var resourceRows = [];
        _.each(resources, function(resource) {
          var claimedByString = '';
          if (resource.claim_until && resource.claim_until > new Date()) {
            if (unclaimed) {
              return;
            }
            claimedByString = sprintf('Claimed by @%s until %s', resource.username, resource.claim_until);
          }
          resourceRows.push([ resource.name, claimedByString ]);
        });

        var resourceText = formatTable(resourceRows);

        var intro = '';
        if (unclaimed) {
          intro = 'Unclaimed resources:';
        } else {
          intro = 'Resources:';
        }

        bot.reply(message, intro + '```' + resourceText + '```', cb);
      }
    ], function(err) {
      if (err) {
        console.error('Unexpected error:', err);
        return;
      }
    });
  });

};
