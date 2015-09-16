/* global process */
var express = require('express');
var app = express();

app.post('/wh', function (request, response) {
    response.send('Hello World!');
});

app.listen(process.env.PORT || 30000);