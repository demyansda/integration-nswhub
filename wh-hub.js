/* global process */

var promised = require('promised-io/promise');
var rpm = require('integration-common/api-wrappers');
var rpmUtil = require('integration-common/util');
var util = require('util');
var webHooks = require('integration-web/webhooks');





function getApis(subscriptions) {

    var apis = subscriptions.map(function (subscription) {
        return new rpm.RpmApi(subscription);
    });

    return promised.seq([
        function () {
            return promised.all(apis.map(function (api) {
                return rpmUtil.getResultOrError(api.getInfo(), true);
            }));
        },
        function (infos) {
            var apisTree = {};
            infos.forEach(function (info, index) {
                if (info instanceof Error) {
                    return;
                }
                var instance = rpmUtil.getOrCreate(apisTree, info.InstanceID, {});
                if (instance[info.SubscriberID]) {
                    console.warn('Skipping duplicate API definition', info);
                } else {
                    instance[info.SubscriberID] = apis[index];
                }
            });
            return apisTree;
        }]);
}

exports.start = function (config, listeners) {
    function processWebHook(webHook) {
        console.info('Processing event', webHook);

        if (!listeners.length) {
            return;
        }
        var api = rpmUtil.getDeepValue(apis, [webHook.InstanceID, webHook.Subscriber]);
        if (!api) {
            console.error('API is not found');
            return;
        }
        promised.seq([
            api.getCachedProcesses.bind(api),
            function (processes) {
                var process = processes[webHook.ParentID];
                var formId = webHook.ObjectID;
                if (process) {
                    promised.all(listeners.map(function (hook) {
                        return hook(webHook.EventName, process, formId);
                    }));
                } else {
                    console.error('Process not found');
                }
            }
        ]);
    }

    var apis;

    promised.seq([
        function () {
            return getApis(config.subscriptions);
        },
        function (result) {
            apis = result;
            webHooks.start(config.webHook, processWebHook);
        }
    ]);

};