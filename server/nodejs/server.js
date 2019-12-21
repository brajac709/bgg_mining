'use strict';
const express = require('express');
const path = require('path');

var port = process.env.PORT || 1337;
const app = express();

// map HTML file extension to EJS renderer  (probably not needed here)
// app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, '..', '..', 'client'));

app.get('/', function (req, res) {
    var options = {
        root: path.join(__dirname, '..', '..', 'client')
    }
    res.sendFile('index.html', options);
});

app.listen(port);

// Console will print the message
console.log('Server running at http://127.0.0.1:' + port + '/');
