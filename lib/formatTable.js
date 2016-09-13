var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

module.exports = function formatTable(listOfRows) {
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
