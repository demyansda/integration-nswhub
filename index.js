var config = require('integration-common/util').readConfig('RPM_CONFIG', 'config.json');

config.port = process.env.PORT || config.port;

require('integration-web/lib').startJsonPostServer(config, function (req, res) {
    console.log('Request headers',req.headers);
    console.log('Request body',req.body);
    res.contentType = 'plain/text';
    res.send();
});
