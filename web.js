/* global process */
var app = require('express').createServer();

app.post('/wh', function (request, response) {
    response.send('Hello World!');
});

app.listen(process.env.PORT || 30000);