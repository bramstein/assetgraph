var util = require('util'),
    extendWithGettersAndSetters = require('../util/extendWithGettersAndSetters'),
    Asset = require('./Asset');

function RequireJsConfig(config) {
    Asset.call(this, config);
    if (!this._parseTree) {
        throw new Error('RequireJsConfig: parseTree config option is mandatory');
    }
}

util.inherits(RequireJsConfig, Asset);

extendWithGettersAndSetters(RequireJsConfig.prototype, {
    type: 'RequireJsConfig',

    contentType: null, // Avoid reregistering application/octet-stream

    supportedExtensions: []
});

module.exports = RequireJsConfig;
