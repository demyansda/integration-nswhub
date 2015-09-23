var webhooks = require('integration-web/webhooks');
var promised = require('promised-io/promise');
var rpm = require('integration-common/api-wrappers');
var rpmUtil = require('integration-common/util');
var util = require('util');
var hub = require('./wh-hub');


function getHistoryTableValue(row, historySubFieldUid) {
    var result = row.Fields.find(function (field) {
        return field.Uid === historySubFieldUid;
    });
    if (result) {
        return result.Values[0];
    }
    throw new Error('Field not found Uid=' + historySubFieldUid);
}

function updateForm(formID) {
    var process = this;
    promised.seq([
        function () {
            return process._api.getForm(formID);
        },
        function (response) {
            var mainField = response.Form.getField(process.mainField, true);

            var theID = mainField.ID;
            var theValue = mainField.Value;

            if (!theID && !theValue) {
                console.log('There is nothing to put to the History');
                return;
            }

            var historyField = response.Form.getField(process.historyField, true);

            var defRow = historyField.Rows.find(function (row) {
                return row.IsDefinition;
            });
            if (!defRow) {
                throw new Error('Definition row is not found for the field ' + process.historyField)
            }


            if (historyField.Rows.find(function (row) {
                if (row.isDefinition) {
                    return;
                }
                var value = getHistoryTableValue(row, process.historySubField);
                return value && (theID && value.ID == theID || !theID && value.Value == theValue);
            })) {
                console.log('Value found in history');
                return;
            }

            historyField.Rows.push({
                Fields: defRow.Fields.map(function (field) {
                    return {
                        Uid: field.Uid,
                        Values: field.Uid === process.historySubField ? [
                            {
                                "ID": theID,
                                "Value": theValue
                            }
                        ] : [],
                    };
                })
            });

            return process._api.editForm(formID, [historyField]);
        }
    ]).then(
        function () { },
        function (error) {
            console.error(error);
        });

}


function initApiTree() {
    return promised.seq([
        function () {
            return hub.getApiTree(config.subscriptions)
        },
        function (result) {
            apiTree = result;
            return result;
        }]);
}

function initHistoryUpdater() {
    var process;
    var historyUpdaterConfig = config.historyUpdater;
    return promised.seq([
        function () {
            for (var instanceID in apiTree) {
                var instance = apiTree[instanceID];
                for (var subscriberID in instance) {
                    var api = instance[subscriberID];
                    var info = rpmUtil.getCache(api).info;
                    if (info.Subscriber == historyUpdaterConfig.subscriber && info.Instance == historyUpdaterConfig.instance) {
                        historyUpdaterConfig.subscriber = info.SubscriberID;
                        historyUpdaterConfig.instance = info.InstanceID;
                        return api.getCachedProcesses();
                    }
                }
            }
        },
        function (processes) {
            if (processes) {
                var name = historyUpdaterConfig.process;
                for (var key in processes) {
                    var proc = processes[key];
                    if (proc.Process == name) {
                        process = proc;
                        break;
                    }
                }
            }
            if (!process) {
                return rpmUtil.getRejectedPromise(new Error('Cannot find process: ' + historyUpdaterConfig.process));
            }
            ['mainField', 'historyField', 'historySubField'].forEach(function (property) {
                process[property] = historyUpdaterConfig[property];
            });
            return process.getFields();
        },
        function (fields) {
            fields = fields.Fields;

            function getField(fields, fieldName) {
                var result = fields.find(function (field) {
                    return field.Name === fieldName;
                });
                if (!result) {
                    throw new Error('Field not found: ', fieldName);
                }
                return result;
            }

            try {

                var mainField = getField(fields, historyUpdaterConfig.mainField);
                var historyField = getField(fields, historyUpdaterConfig.historyField);

                if (historyField.FieldType != rpm.OBJECT_TYPE.CustomField || historyField.SubType != rpm.DATA_TYPE.FieldTable) {
                    throw new Error('Invalid History field type. FieldTable type is expected for the field ', historyField);
                }

                var row = historyField.Rows.find(function (row) {
                    return row.IsDefinition;
                });
                if (!row) {
                    throw new Error('Definition row is not found for the field ', historyField);
                }
                var historySubField = getField(row.Fields, historyUpdaterConfig.historySubField);

                ['FieldType', 'SubType'].forEach(function (property) {
                    if (historySubField[property] != mainField[property]) {
                        throw new Error('Field types dont match', mainField, historySubField);
                    }
                });

                process.historySubField = historySubField.Uid;
            } catch (error) {
                return rpmUtil.getRejectedPromise(error);
            }

            process.updateForm = updateForm;
            console.log('Process:', process);
            

            hooks.push(function (event, process, formID) {
                (event === webhooks.EVENT_FORM_EDIT && process === process) ? process.updateForm(formID) : console.log('Not for me');
            });

        }]);

}


var hooks = [];
var config = rpmUtil.readConfig('RPM_CONFIG', 'config.json');
var apiTree;

promised.seq([
    initApiTree,
    initHistoryUpdater,
]).then(
    function () {
        if (hooks.length) {
            hub.start(config, hooks, apiTree);
        }
    },
    function (error) {
        console.error(error);
    });
