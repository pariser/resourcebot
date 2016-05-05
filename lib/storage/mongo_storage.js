var monk = require('monk'); //https://www.npmjs.com/package/monk
var logger = require("./../logger");

module.exports = function(config) {
  if (!config && !config.mongo_uri) throw new Error('Need to provide mongo address.');

  logger.info("Connecting to: " + config.mongo_uri);
  var db = monk(config.mongo_uri);

  var teams_db = db.get('teams');
  var users_db = db.get('users');
  var channels_db = db.get('channels');
  var resources_db = db.get('resources');

  var unwrapFromList = function(cb) {
    return function(err, data) {
      if (err) {
        cb(err, data);
      } else {
        cb(err, data[0]);
      }
    };
  };

  var storage = {
    teams: {
      get: function(team_id, cb) {
        teams_db.find({id: team_id}, unwrapFromList(cb));
      },
      save: function(team_data, cb) {
        teams_db.findAndModify({id: team_data.id}, team_data, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        teams_db.find({}, cb);
      }
    },
    users: {
      get: function(user_id, cb) {
        users_db.find({id: user_id}, unwrapFromList(cb));
      },
      save: function(user_data, cb) {
        users_db.findAndModify({id: user_data.id}, user_data, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        users_db.find({}, cb);
      }
    },
    channels: {
      get: function(channel_id, cb) {
        channels_db.find({id: channel_id}, unwrapFromList(cb));
      },
      save: function(channel_data, cb) {
        channels_db.findAndModify({id: channel_data.id}, channel_data, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        channels_db.find({}, cb);
      }
    },
    resources: {
      get: function(resource_id, cb) {
        resources_db.find({id: resource_id}, unwrapFromList(cb));
      },
      findOne: function(query, cb) {
        if (typeof cb === 'undefined') {
          cb = query;
          query = {};
        }

        resources_db.find(query, function(err, data) {
          if (err) {
            return cb(err, data);
          }
          if (data.length === 0) {
            return cb(null, null);
          }
          cb(null, data[0]);
        });
      },
      save: function(name, data, cb) {
        resource_data = data;
        resource_data.name = name;
        resources_db.findAndModify({ name: name }, resource_data, { upsert: true, new: true }, cb);
      },
      all: function(cb) {
        resources_db.find({}, cb);
      },
      find: function(query, cb) {
        resources_db.find(query, cb);
      }
    }
  };

  storage.db = db;
  storage.ObjectId = db.helper.id.ObjectID;

  return storage;
};
