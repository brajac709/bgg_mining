
var data_arr = [];
var page = 1;


var iterateXML = function (xpath, xml) {
    var xpathSnapshot = document.evaluate(xpath, 
                                          xml, 
                                          null, 
                                          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                          null)
    
    
    return xpathSnapshot;
    
    /*
    try {
      var thisNode = xpathIterator.iterateNext();
      
      while (thisNode) {
        console.log( thisNode.textContent );
        thisNode = xpathIterator.iterateNext();
      }	
    }
    catch (e) {
      alert( 'Error: Document tree modified during iteration ' + e );
    }
    */
}

var processXML = function(xml) {
    console.log(xml)
    
    var xpathName = '//boardgame[position()<5]/name[@primary="true"]';
    var xpathNumPlayers = '//boardgame[1]/poll[@name="suggested_numplayers"]'
    //var nsResolver = document.createNSResolver(document.ownerDocument == null ? document.documentElement : document.ownerDocument.documentElement);
    
    var xpathIterator = document.evaluate(xpath, 
                                          xml, 
                                          null, 
                                          XPathResult.ORDERED_NODE_ITERATOR_TYPE, 
                                          null)
    
    try {
      var thisNode = xpathIterator.iterateNext();
      
      while (thisNode) {
        console.log( thisNode.textContent );
        thisNode = xpathIterator.iterateNext();
      }	
    }
    catch (e) {
      alert( 'Error: Document tree modified during iteration ' + e );
    }
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