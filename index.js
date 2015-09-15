/* global process */
var config = require('integration-common/util').readConfig('RPM_CONFIG', 'config.json');

config.port = process.env.PORT || config.port;

require('./lib').startJsonPostServer(config, function (req, res) {
    console.info('Request headers',req.headers);
    console.info('Request body',req.body);
    res.contentType = 'plain/text';
    res.status(200).send('OK');
});
