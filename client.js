/* global process */
var webhooks = require('integration-web/webhooks');
var rpmUtil = require('integration-common/util');
var util = require('util');
var config = rpmUtil.readConfig(undefined, 'config.json');
var host = 'localhost:' + config.port;
host = 'whtest.herokuapp.com';
var cpath = util.format('http://%s/%s',host, config.path);
console.log(cpath);
var RESTClient = require('node-rest-client').Client;

function send(headers, data) {
    new RESTClient().post(cpath, { headers: headers, data: data }, function (data, response) {
        console.log('data',data.toString());
        // console.log(response);
    });
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
send(new webhooks.WebHooksRequestHeader('telco', 100), new webhooks.WebHooksRequestData(100, 12, 'form.start'));
