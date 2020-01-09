
var data_arr = [];

var iterateXML = function (xpath, xml, func) {
    var xpathSnapshot = document.evaluate(xpath, 
                                          xml, 
                                          null, 
                                          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                          null)
    

    if (typeof func === 'function') {
        for (var i = 0; i < xpathSnapshot.snapshotLength; i++) {
            func(i, xpathSnapshot.snapshotItem(i));
        }
    }

    return xpathSnapshot;
}

var processXML = function(xmltext, curlen) {
    var xml = (new window.DOMParser()).parseFromString(xmltext, 'text/xml');
    console.log(xml)
    
    var xpathName = '//boardgame[position()<5]/name[@primary="true"]';
    var xpathPollNumPlayers = '//boardgame/poll[@name="suggested_numplayers"]';
    
    //var nsResolver = document.createNSResolver(document.ownerDocument == null ? document.documentElement : document.ownerDocument.documentElement);

    var result = [];

    var findBestAndMakeTable = function (idx, pollNode) {
        var res = findBestNumPlayers(idx, pollNode, curlen);
        result.push(res);

        /*
        if(res.bestVoted.numplayers == 2) {

            $('<tr></tr>')
                .append('<td>' + res.rank + '</td>')  // rank
                .append('<td>' + res.bgname + '</td>')  // name
                .append('<td>' + res.minplayers + ' - ' + res.maxplayers + '</td>')  // numplayers
                .append('<td>' + res.bestVoted.numplayers + ' (' + res.bestVoted.best + '/' + res.totalBestVotes + ' votes) (' + res.totalVotes + ' total votes) </td>')  // best numplayers
                .appendTo('#main_container #games tbody');
        }
        */
    }


    iterateXML(xpathPollNumPlayers, xml, findBestAndMakeTable);

    return result;
  
}

var printXMLText = function (idx, node) {
    console.log(node.textContent);
}

var findBestNumPlayers = function (idx, pollNode, curlen) {
    // It's a DOM node so lets leverage JQuery here
    // XPATH is using the whole document, even when I pass a sub-node

    // TODO lets try and take out JQuery 
    // (these are pretty simple DOM queries so it shouldn't be too bad)
    var $poll = $(pollNode); 
    var bgname = $poll.siblings('name[primary="true"]').text();
    var minplayers = $poll.siblings('minplayers').text();
    var maxplayers = $poll.siblings('maxplayers').text();
    var totalVotes = $poll.attr('totalvotes');
    var bgID = $poll.parent('boardgame').attr('objectid');
    var $results = $poll.find('results');
    var votes = $results.map(function (idx) {
        var $elm = $(this);
        var numplayers = parseInt($elm.attr('numplayers'));
        var best = parseInt($elm.find('result[value="Best"]').attr('numvotes'));
        var good = parseInt($elm.find('result[value="Recommended"]').attr('numvotes'));
        var bad = parseInt($elm.find('result[value="Not Recommended"]').attr('numvotes'));

        return {
            "numplayers": numplayers,
            "best": best,
            "good": good,
            "bad": bad
        }
    }).get();
    var totalBestVotes = 0;

    // TODO handle the empty case
    var bestVoted = votes.reduce(function (acc, v, i, a) {
        totalBestVotes += v.best;
        if (acc.best < v.best) {
            return v;
        } else {
            return acc;
        }
    });

    console.log(bgname + ', Best Num Players: ' + bestVoted.numplayers + ' (' + bestVoted.best + '/' + totalBestVotes + ' votes) (' + totalVotes + ' total votes)');

    return {
        "id": bgID,
        "rank": idx + 1 + curlen,
        "bgname": bgname,
        "minplayers": minplayers,
        "maxplayers": maxplayers,
        "bestVoted": bestVoted,
        "totalBestVotes": totalBestVotes,
        "totalVotes": totalVotes
    }


    
}


var processBrowsePage = function(page, data, curlen) {
    console.log("start processBrowsePage");
    
    // extract IDs and put together the request-
    // TODO probably need to use reduce to lock out some of the objects
    var ids = data.map(function (v,i,a) {
        var parts = v.split('/')
        if (parts[1] == 'boardgame') {
            return parts[2]
        } else {
            return 1;  // TESTING???
        }
    });
    var ids_str = ids.join(',');
    
    
    // extract the XML poll data for num players
    return fetch('/bgg/boardgames/' + ids_str)
        .then((res) => res.text())
        .then((xml) => processXML(xml, curlen));

}

var getBGGData = function(page) {
    console.log("test start");
    
    //var pageNum = 1;
    //var baseurl = "http://www.boardgamegeek.com/browse/boardgame/page/";
    
    //$.get(baseurl+pageNum)
    //$.get("http://www.boardgamegeek.com/browse/boardgame")
    // .done(processBrowsePage)
    //;

    var curlen = data_arr.length;
    var p = fetch('bgg?page=' + page)
        .then((res) => res.json())
        .then((data) => {
            data_arr = data_arr.concat(data);
            console.log(data_arr)
            return data;
        });

    return p.then(function (data) {
        return processBrowsePage(page, data, curlen)
        });
}




// $(document).ready(getBGGData);
