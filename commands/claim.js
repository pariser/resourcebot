var async = require('async');
var _ = require('underscore');

module.exports = function(app) {

  app.command('^claim (resource )?([a-zA-Z\-]+)( .+)?', function(bot, message) {
    var resourceName = message.match[2];
    var resource;
    var length = message.match[3];
    var now = new Date();
    var claimUntil = null;

    function ClaimTooGreedy() {}
    function ClaimCouldNotParse() {}
    function ResourceDoesNotExist() {}
    function ResourceAlreadyClaimed(user, claimedUntil) {
      this.user = user;
      this.claim_until = claimedUntil;
    }

    async.waterfall([
      function(cb) {
        if (!length) {
          claimUntil = new Date(new Date().getTime() + 1000 * 60 * 30);
          return cb();
        }

        var matchFor = length.match(/ for ([0-9\.]+) ((minute|hour|day|week|month|year)s?)/i);
        if (matchFor) {
          var duration = parseFloat(matchFor[1], 10);
          if (_.isNaN(duration)) {
            return cb(new ClaimCouldNotParse());
          }

          switch (matchFor[3].toLowerCase()) {
          case 'minute':
            duration *= 1000 * 60;
            break;
          case 'hour':
            duration *= 1000 * 60 * 60;
            break;
          case 'day':
            duration *= 1000 * 60 * 60 * 24;
            break;
          case 'week':
            duration *= 1000 * 60 * 60 * 24 * 7;
            break;
          case 'month':
            duration *= 1000 * 60 * 60 * 24 * 7 * 30;
            break;
          case 'year':
            duration *= 1000 * 60 * 60 * 24 * 7 * 365;
            break;
          default:
            return cb(new ClaimCouldNotParse());
          }

          if (duration > 1000 * 60 * 60 * 24 * 7) {
            return cb(new ClaimTooGreedy());
          }

          claimUntil = new Date(new Date().getTime() + duration);
          return cb();
        }

        var matchUntil = length.match(/ until (tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|saturday)/i);
        if (matchUntil) {
          switch (matchUntil[1].toLowerCase()) {
          case 'tonight':
            if (now.getHours() >= 18) {
              return cb(new ClaimCouldNotParse());
            }
            claimUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18);
            break;
          case 'tomorrow':
            claimUntil = new Date(now.getTime() + 1000 * 60 * 60 * 24);
            break;
          case 'monday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 1);
            break;
          case 'tuesday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 2);
            break;
          case 'wednesday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 3);
            break;
          case 'thursday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 4);
            break;
          case 'friday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 5);
            break;
          case 'saturday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 6);
            break;
          case 'sunday':
            claimUntil = advanceDateTo8AMOnWeekday(now, 0);
            break;
          default:
            return cb(new ClaimCouldNotParse());
          }

          return cb();
        }

        cb(new ClaimCouldNotParse());
      },
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

        if (resource.claim_until > now) {
          return cb(new ResourceAlreadyClaimed());
        }

        app.api.users.info({ user: message.user }, function(err, res) {
          if (err) {
            return cb(err);
          }

          app.storage.resources.save(resourceName, {
            claim_until: claimUntil,
            user: message.user,
            username: res.user.name
          }, cb);
        });
      },
      function(updatedResource, cb) {
        bot.reply(message, 'Got it! You\'ve claimed ' + updatedResource.name + ' until ' + updatedResource.claim_until, cb);
      }
    ], function(err) {
      if (err && err instanceof ClaimCouldNotParse) {
        var text = 'I couldn\'t understand your claim request. Try: ```\n';
        text += 'claim <resource> for <duration> <unit(s)>\n';
        text += '  duration: any positive number (decimals allowed)\n';
        text += '  unit: minute, hour, day, week, month, year\n';
        text += '\n';
        text += '- or -\n';
        text += '\n';
        text += 'claim <resource> until <keyword>\n';
        text += '  keyword: tonight, tomorrow, sunday, monday, ...\n';
        text += '```';
        bot.reply(message, text);
        return;
      }

      if (err && err instanceof ClaimTooGreedy) {
        bot.reply(message, 'You\'re being greedy! The maximum claim length is currently 7 days.');
        return;
      }

      if (err && err instanceof ResourceDoesNotExist) {
        bot.reply(message, 'Couldn\'t find resource with name: `' + resourceName + '`.');
        return;
      }

      if (err && err instanceof ResourceAlreadyClaimed) {
        if (message.user === resource.user) {
          bot.reply(message, 'You already have `' + resourceName + '` claimed until ' + resource.claim_until + '.');
          return;
        }

        bot.reply(message, 'Sorry - `' + resourceName + '` is currently claimed by @' + resource.username + ' until ' + resource.claim_until + '.');
        return;
      }

      if (err) {
        console.error('Unexpected error:', err);
        return;
      }
    });
  });

  var advanceDateTo8AMOnWeekday = function(date, weekday) {
    // No need to advance more than 8 times
    for (var i = 0; i < 8; i++) {
      date = new Date(date.getTime() + 1000 * 60 * 60 * 24);
      if (date.getDay() === weekday) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8);
      }
    }
  };
};
