require('integration-web/lib').startJsonPostServer(require('integration-common/util').readConfig('RPM_CONFIG', 'config.json'), function (req, res) {
    console.log('Request headers',req.headers);
    console.log('Request body',req.body);
    res.contentType = 'plain/text';
    res.send();
});
