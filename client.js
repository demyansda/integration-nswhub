/* global process */
var webhooks = require('integration-web/webhooks');
var rpmUtil = require('integration-common/util');
var util = require('util');
var config = rpmUtil.readConfig(undefined, 'config.json').webHook;
var host = 'localhost:' + config.port;
host = 'whtest.herokuapp.com';
var cpath = util.format('https://%s/%s',host, config.path);
console.log(cpath);
var RESTClient = require('node-rest-client').Client;

function send(headers, data) {
    new RESTClient().post(cpath, { headers: headers, data: data }, function (data, response) {});
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
var data = new webhooks.WebHooksRequestData(100, 12, 'form.start');
send(new webhooks.WebHooksRequestHeader(2001, 1071, data, config.signSecret), data);
