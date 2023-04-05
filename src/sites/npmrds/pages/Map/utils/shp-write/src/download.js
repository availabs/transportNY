var zip = require('./zip');
var saveAs = require("file-saver").saveAs;

module.exports = function(gj, options, aliasString, tmcMetaString) {
    zip(gj, options, aliasString, tmcMetaString).then(function(blob) { saveAs(blob, options.file + '.zip'); });
};
