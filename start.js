/* global process */
var config = require('integration-common/util').readConfig('RPM_CONFIG', 'config.json');

require('integration-web/lib').startJsonPostServer(config, function (req, res) {
    console.info('Request headers', req.headers);
    console.info('Request body', req.body);
    res.contentType = 'plain/text';
    res.status(200).send('OKEY');
});
