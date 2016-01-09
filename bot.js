require('dotenv').load();

var Botkit = require('./lib/Botkit.js')
var os = require('os');
var async = require('async');
var _ = require('underscore');

var mongo_config = {
  mongo_uri: process.env.MONGO_URI
};
var mongo_storage = require('./lib/storage/mongo_storage.js')(mongo_config);

var controller = Botkit.slackbot({
  debug: false,
  storage: mongo_storage
});

var bot = controller.spawn(
  {
    token:process.env.SLACK_TOKEN
  }
).startRTM();

var communication_methods = [
  'direct_message',
  'direct_mention',
  'mention'
];

controller.hears('list( unclaimed| available)?( resources?)? ?([a-zA-Z]*)?', communication_methods, function(bot, message) {
  var unclaimed = message.match[1];
  var resourceString = message.match[3];

  async.waterfall([
    function(cb) {
      var query = {};

      if (resourceString && resourceString.length > 0) {
        query.name = {
          '$regex': resourceString
        }
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
          },
        ]
      }

      controller.storage.resources.find(query, cb);
    },
    function(resources, cb) {
      if (resources.length === 0) {
        if (resourceString && resourceString.length > 0) {
          if (unclaimed) {
            bot.reply(message, "No unclaimed resources match `" + resourceString + "`.", cb);
            return;
          }

          bot.reply(message, "No resources match `" + resourceString + "`.", cb);
          // TODO: ask if the user would like to add it now?
          return;
        }

        bot.reply(message, "There are no resources yet. Add one now `@resourcebot add resource <resource_name>`", cb);
        return;
      }

      var resource_names = _.map(resources, function(resource) {
        return resource.name
      }).join("\n");

      var intro = "";
      if (unclaimed) {
        intro = "Unclaimed resources:";
      } else {
        intro = "Resources:";
      }

      bot.reply(message, intro + "```" + resource_names + "```", cb);
    }
  ], function(err) {
    if (err) {
      console.error("Caught error:", err);
      bot.reply(message, "Caught error: " + err);
    }
  });
});

controller.hears(['add( resource)? ([a-zA-Z]+)'], communication_methods, function(bot, message) {
  var name = message.match[2];

  function ResourceAlreadyExistsError() {}

  async.waterfall([
    function(cb) {
      controller.storage.resources.findOne({
        name: name
      }, cb);
    },
    function(resource, cb) {
      if (resource) {
        return cb(new ResourceAlreadyExistsError());
      }

      cb();
    },
    function(cb) {
      controller.storage.resources.save({
        name: name,
        created_at: new Date(),
      }, cb);
    },
    function(resource, cb) {
      bot.reply(message, "Great, I've added a resource named `" + name + "`", cb)
    }
  ], function(err) {
    console.log('finished, err:', err);
    if (err && err instanceof ResourceAlreadyExistsError) {
      bot.reply(message, "Sorry, it looks like there's an existing resource called `" + name + "`");
      return;
    };

    if (err) {
      console.error("Caught error: ", err);
      bot.reply(message, "Caught error: " + err);
    }
  });
});

controller.hears('release (claim (on )?)?([a-zA-Z]+)', communication_methods, function(bot, message) {
  var name = message.match[3];
  var now = new Date();

  function ResourceDoesNotExist() {}
  function ResourceNotClaimed() {}
  function ResourceNotClaimedByMessageUser(user) {
    this.user = user;
  }

  async.waterfall([
    function(cb) {
      controller.storage.resources.findOne({
        name: name
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

      controller.storage.resources.save({
        name: name,
        claim_until: null,
        user: null
      }, cb);
    },
    function(updatedResource, cb) {
      bot.reply(message, "Got it! You've released your claim on `" + updatedResource.name + "`.", cb);
    }
  ], function(err) {
    if (err && err instanceof ResourceDoesNotExist) {
      bot.reply(message, "Couldn't find resource with name: `" + name + "`.");
      return;
    }

    if (err && err instanceof ResourceNotClaimed) {
      bot.reply(message, "Resource `" + name + "` is not currently claimed.");
      return;
    }

    if (err && err instanceof ResourceNotClaimedByMessageUser) {
      bot.reply(message, "You do not have a claim on `" + name + "`. This resource is claimed by " + err.user + ".");
      return;
    }

    if (err) {
      console.error("Unexpected error:", err);
      return;
    }
  });
});

function advanceDateTo8AMOnWeekday(date, weekday) {
  while (true) {
    date = new Date(date.getTime() + 1000 * 60 * 60 * 24);
    if (date.getDay() === weekday) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8);
    }
  }
}

controller.hears('claim (resource )?([a-zA-Z]+)( .+)?', communication_methods, function(bot, message) {
  var name = message.match[2];
  var length = message.match[3];
  var now = new Date();
  var claimUntil = null;

  function ClaimTooGreedy() {}
  function ClaimCouldNotParse() {}
  function ResourceDoesNotExist() {}
  function ResourceAlreadyClaimed(user, claim_until) {
    this.user = user;
    this.claim_until = claim_until;
  }

  async.waterfall([
    function(cb) {
      if (!length) {
        claimUntil = new Date(new Date().getTime() + 1000 * 60 * 60);
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
      controller.storage.resources.findOne({
        name: name
      }, cb);
    },
    function(resource, cb) {
      if (!resource) {
        return cb(new ResourceDoesNotExist());
      }

      if (resource.claim_until > now) {
        return cb(new ResourceAlreadyClaimed(resource.user, resource.claim_until));
      }

      controller.storage.resources.save({
        name: name,
        claim_until: claimUntil,
        user: message.user
      }, cb);
    },
    function(updatedResource, cb) {
      bot.reply(message, "Got it! You've claimed " + updatedResource.name + " until " + updatedResource.claim_until, cb);
    }
  ], function(err) {
    if (err && err instanceof ClaimCouldNotParse) {
      var text = "I couldn't understand your claim request. Try: ```\n";
      text += "claim <resource> for <duration> <unit(s)>\n";
      text += "  duration: any positive number (decimals allowed)\n";
      text += "  unit: minute, hour, day, week, month, year\n";
      text += "\n";
      text += "- or -\n";
      text += "\n";
      text += "claim <resource> until <keyword>\n";
      text += "  keyword: tonight, tomorrow, sunday, monday, ...\n";
      text += "```";
      bot.reply(message, text);
      return;
    }

    if (err && err instanceof ClaimTooGreedy) {
      bot.reply(message, "You're being greedy! The maximum claim length is currently 7 days.");
      return;
    }

    if (err && err instanceof ResourceDoesNotExist) {
      bot.reply(message, "Couldn't find resource with name: `" + name + "`.");
      return;
    }

    if (err && err instanceof ResourceAlreadyClaimed) {
      if (message.user === err.user) {
        bot.reply(message, "You already have `" + name + "` claimed until " + err.claim_until + ".");;
        return;
      }

      bot.reply(message, "Sorry - `" + name + "` is currently claimed by " + err.user + " until " + err.claim_until + ".");;
      return;
    }

    if (err) {
      console.error("Unexpected error:", err);
      return;
    }
  });
});
