
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

/********* REACT STUFF ******/

class GameTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            cur_page: 0,
            isLoading: false
        }
        this.updateData = this.updateData.bind(this);
    }

    max_pages = 10;

    // the quick and dirty anti-pattern
    // TODO change this to only set state in the component
    updateData(newdata, cur_page) {
        this._asyncRequest = null;
        var bothdata = this.state.data.concat(newdata);
        this.setState({
            data: bothdata,
            cur_page: cur_page
        });
    }

    getNextPage() {
        var cur_page = this.state.cur_page + 1;
        return getBGGData(cur_page).
            then((data) => this.updateData(data, cur_page))
            .then(() => {
                if (cur_page < this.max_pages) {
                    return this.getNextPage();
                } else {
                    return this.setState({
                        isLoading: false
                    });
                }
            })
    }

    componentDidMount() {
        this.setState({
            isLoading: true
        });
        this._asyncRequest = this.getNextPage();
    }

    componentWillUnmount() {
        // TODO cleanup/cancel any async calls
        if (this._asyncRequest) {
            this._asyncRequest.cancel()
        }
    }


    render() {
        var twoPlayerGames = this.state.data.filter((v) => v.bestVoted.numplayers == 2);
        var rows = twoPlayerGames.map((g) => {
            return (<GameTableRow key={g.id} data={g}  />);
        })
        

        return (
            <React.Fragment>
                <div>{'Loading: ' + this.state.isLoading}</div>
                <table>
                    <GameTableHeader />
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </React.Fragment>
        );
    }
}

function GameTableHeader() {
    return (
        <thead>
            <tr>
                <th>Rank</th>
                <th>Game</th>
                <th>Num Players</th>
                <th>Best Num Players</th>
            </tr>
        </thead>
    );
}

function GameTableRow(props) {
    return (
        <tr>
            <td>{props.data.rank}</td>
            <td>{props.data.bgname}</td>
            <td>{props.data.minplayers}-{props.data.maxplayers}</td>
            <td>{props.data.bestVoted.numplayers} ({props.data.bestVoted.best}/{props.data.totalBestVotes} votes) ({props.data.totalVotes} total votes)</td>
        </tr>
    );
}

const domContainer = document.querySelector('#main_container_react');
ReactDOM.render(React.createElement(GameTable), domContainer)




// $(document).ready(getBGGData);
