
var data_arr = [];
var page = 1;


var iterateXML = function (xpath, xml, func) {
    var xpathSnapshot = document.evaluate(xpath, 
                                          xml, 
                                          null, 
                                          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                          null)
    

    if (typeof func === 'function') {
        for (var i = 0; i < xpathSnapshot.snapshotLength; i++) {
            func(xpathSnapshot.snapshotItem(i));
        }
    }

    return xpathSnapshot;
}

var processXML = function(xml) {
    console.log(xml)
    
    var xpathName = '//boardgame[position()<5]/name[@primary="true"]';
    var xpathPollNumPlayers = '//boardgame/poll[@name="suggested_numplayers"]';
    //var nsResolver = document.createNSResolver(document.ownerDocument == null ? document.documentElement : document.ownerDocument.documentElement);

    iterateXML(xpathPollNumPlayers, xml, findBestNumPlayers);
  
}

var printXMLText = function (node) {
    console.log(node.textContent);
}

var findBestNumPlayers = function (pollNode) {
    // It's a DOM node so lets leverage JQuery here
    // XPATH is using the whole document, even when I pass a sub-node
    var $poll = $(pollNode); 
    var bgname = $poll.siblings('name[primary="true"]').text();
    var totalVotes = $poll.attr('totalvotes');
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
}


var processBrowsePage = function(data) {
    console.log("start processBrowsePage");
    
    // extract IDs and put together the request-
    // TODO probably need to use reduce to lock out some of the objects
    ids = data.map(function (v,i,a) {
        parts = v.split('/')
        if (parts[1] == 'boardgame') {
            return parts[2]
        } else {
            return 1;  // TESTING???
        }
    });
    ids_str = ids.join(',');
    
    
    // extract the XML poll data for num players
    $.get('/bgg/boardgames/' + ids_str)
     .done(processXML);
    
}

var getBGGData = function() {
    console.log("test start");
    
    //var pageNum = 1;
    //var baseurl = "http://www.boardgamegeek.com/browse/boardgame/page/";
    
    //$.get(baseurl+pageNum)
    //$.get("http://www.boardgamegeek.com/browse/boardgame")
    // .done(processBrowsePage)
    //;
    
    $.get('bgg')
     .done(function (data) { 
        data_arr = data_arr.concat(data);
        
        processBrowsePage(data);
        console.log(data_arr);
    });
}

$(document).ready(getBGGData);