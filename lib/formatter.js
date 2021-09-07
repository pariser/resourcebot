var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;
var moment = require('moment-timezone');

function dataTable(listOfRows) {
  var longestStringsPerColumn = [];

  _.each(listOfRows, function(row) {
    if (longestStringsPerColumn.length === 0) {
      longestStringsPerColumn = new Array(row.length);
    }

    _.each(row, function(column, index) {
      if (!longestStringsPerColumn[index] || longestStringsPerColumn[index] < column.length) {
        longestStringsPerColumn[index] = column.length;
      }
    });
  });

  var formatString = _.map(longestStringsPerColumn, function(longestStringThisColumn) {
    return '%-' + longestStringThisColumn + 's';
  }).join(' ') + '\n';

  return _.map(listOfRows, function(row) {
    var args = row;
    args.unshift(formatString);
    return sprintf.apply(this, args);
  }).join('');
};

function dateAsPSTString(date) {
  return moment.tz(date, "America/Los_Angeles").format('YYYY-MM-DD hh:mma z');
}

function dateAsESTString(date) {
  return moment.tz(date, "America/New_York").format('YYYY-MM-DD hh:mma z');
}

module.exports = {
  dataTable: dataTable,
  dateAsESTString: dateAsESTString
};
