'use strict';
const express = require('express');
const path = require('path');
const request = require('request');
const xml2js = require('xml2js');
const xpathm = require('xpath');
const parse5 = require('parse5');
const xmlser = require('xmlserializer');
const dom = require('xmldom').DOMParser;

var port = process.env.PORT || 1337;
const app = express();

// map HTML file extension to EJS renderer  (probably not needed here)
// app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, '..', '..', 'client'));

app.use(function (req, res, next) {
    console.log('Request: ' + req.url);
    next();
})

app.use('/', express.static(path.join(__dirname, '..', '..', 'client')));



app.get('/', function (req, res) {
    var options = {
        root: path.join(__dirname, '..', '..', 'client')
    }
    res.sendFile('index.html', options);
});

app.get('/bgg', function (req, res) {
    var page, xpath_link, xpath_rank;

    if (typeof req.query.page === 'undefined') {
        page = '1';
    } else {
        page = req.query.page;
    }
    if (typeof req.query.xpath === 'undefined') {
        // xpath = '//table[@id="collectionitems"]//tr[@id="row_"]//td[@class="collection_thumbnail"]//a/@href';
        xpath_link = '//x:table[@id="collectionitems"]//x:tr[@id="row_"]//x:td[@class="collection_thumbnail"]//x:a/@href';
        // TODO maybe send down the rank as well???
        xpath_rank = '//x:table[@id="collectionitems"]//x:tr[@id="row_"]//x:td[@class="collection_rank"]//x:a/@name';
    } else {
        xpath = req.query.page;
    }

    request.get('http://www.boardgamegeek.com/browse/boardgame/page/' + page,
        function (err, resp, body) {

            const document = parse5.parse(body);
            const xhtml = xmlser.serializeToString(document);
            const doc = new dom().parseFromString(xhtml);
            const select = xpathm.useNamespaces({ "x": "http://www.w3.org/1999/xhtml" });
            const nodes_link = select(xpath_link, doc);
            const values = nodes_link.map(function (v) { return v.value });

            res.json(values);

        });
});

app.get('/bgg/boardgames/:ids', function (req, res) {
    request.get('http://www.boardgamegeek.com/xmlapi/boardgame/' + req.params.ids,
        function (err, resp, body) {
            res.set('Content-Type', 'text/xml');
            res.send(body);
        });
});

app.listen(port);

// Console will print the message
console.log('Server running at http://127.0.0.1:' + port + '/');
