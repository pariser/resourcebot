var bunyan = require('bunyan');
var logger = bunyan.createLogger({
  name: 'resourcebot'
});

module.exports = logger;