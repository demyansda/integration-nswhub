/* global process */
console.log(process.env);

var express = require('express');
var app = express();



app.post('/wh', function (request, response) {
    console.log(request);
    response.send('Hello World!');
});

app.get('/wh', function (request, response) {
    console.log(request);
    response.send('Hello World!');
});

app.listen(process.env.PORT || 30000);