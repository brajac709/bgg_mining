
/********* REACT STUFF ******/

class GameTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            cur_page: 0,
            isLoading: false,
            numplayers: 2,
        }

        this.max_pages = 10;

        this.updateData = this.updateData.bind(this);
        this.updateFormData = this.updateFormData.bind(this);
    }

    updateFormData(formdata) {
        for (var prop in formdata) {
            var val = parseInt(formdata[prop]);
            if (!isNaN(val)) {
                formdata[prop] = val;
            }
        }

        this.setState(formdata );
    }


    

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
        var twoPlayerGames = this.state.data.filter((v) => v.bestVoted.numplayers == this.state.numplayers);
        var rows = twoPlayerGames.map((g) => {
            return (<GameTableRow key={g.id} data={g} />);
        })


        return (
            <React.Fragment>
                <div>{'Loading: ' + this.state.isLoading}</div>
                <SearchForm numplayers={this.state.numplayers} onDataChange={this.updateFormData} /> 
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

class SearchForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }


    handleChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ?
            target.checked : target.value;
        const name = target.name;

        var formdata = {
            [name] : value
        }
        this.props.onDataChange(formdata)
    }

    render() {
        return (
            <div>
                <label>Best Number of Players</label>
                <input type="number" name="numplayers" value={this.props.numplayers} onChange={this.handleChange}/>
            </div>

        );
    }
}

const domContainer = document.querySelector('#main_container_react');
ReactDOM.render(React.createElement(GameTable), domContainer)