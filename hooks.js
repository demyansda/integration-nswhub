var webhooks = require('integration-web/webhooks');
var promised = require('promised-io/promise');
var rpm = require('integration-common/api-wrappers');
var rpmUtil = require('integration-common/util');
var util = require('util');
var hub = require('./wh-hub');



function updateCompanyHistory(event, process, formID) {
    if (event !== webhooks.EVENT_FORM_EDIT || process !== contactsProcess) {
        console.log('Not for me');
        return;
    }
    promised.seq([
        function () {
            return contactProsses._api.getForm(formID);
        },
        function (form) {
            console.log('Form:', JSON.stringify(form));

        }
    ]);
}

var hooks = [updateCompanyHistory];

var config = rpmUtil.readConfig('RPM_CONFIG', 'config.json');
var contactsProcess = config.contactsProcess;

promised.seq([
    function () {
        return hub.getApiTree(config.subscriptions)
    },
    function (result) {
        apiTree = result;
        console.log('Tree:',apiTree);
        for (var instanceID in apiTree) {
            var instance = apiTree[instanceID];
            for (var subscriberID in instance) {
                var api = instance[subscriberID];
                var info = rpmUtil.getCache(api).info;
                if (info.Subscriber == contactsProcess.subscriber && info.Instance == contactsProcess.instance) {
                    contactsProcess.subscriber = info.SubscriberID;
                    contactsProcess.instance = info.InstanceID;
                    return api.getCachedProcesses();
                }
            }
        }
        return null;
    },
    function (processes) {
        var theProcess;
        if (processes) {
            var name = contactsProcess.name;
            for (var key in processes) {
                var proc = processes[key];
                if (proc.Process == name) {
                    theProcess = proc;
                    break;
                }
            }
        }
        if (theProcess) {
            contactsProcess = theProcess;
            hub.start(config, hooks, apiTree);
        } else {
            rpmUtil.getRejectedPromise(new Error('Cannot find process:' + JSON.stringify(contactsProcess)));
        }
    }
]);
var apiTree;


var x = {
    ObjectID: 67339,
    ObjectType: 520,
    ParentID: 842,
    ParentType: 510,
    EventName: 'form.edit',
    RequestID: 458,
    StatusID: 2044,
    InstanceID: '2001',
    Instance: 'Cube11',
    Subscriber: '1071'
};


var info = {
    SubscriberContact: '',
    InstanceID: '2001',
    Subscriber: 'Primary Development',
    SubscriberID: 1071,
    User: 'Dmitriy Serdyukov',
    UserID: 297095,
    Role: 'System Manager',
    Instance: 'Cube11'
};

var contactProsses = {
    Instance: 'Cube11',
    InstanceID: '2001',
    Name: 'ContactsSDA',
    Subscriber: 'Primary Development',
    SubscriberID: 1071,
};

