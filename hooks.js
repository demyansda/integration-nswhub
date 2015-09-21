var webhooks = require('integration-web/webhooks');

var hooks = [
    function () {
        console.log(arguments);
    }
];

var config = require('integration-common/util').readConfig('RPM_CONFIG', 'config.json');
require('./wh-hub').start(config, hooks);