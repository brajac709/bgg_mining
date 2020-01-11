import React from "react";
import ReactDOM from 'react-dom';
import * as BggMine from './bgg_mine.js';  // TODO improve this??
import { Formik, useField } from 'formik'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';

class GameTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            cur_page: 0,
            isLoading: false,
            formdata: {
                numplayers: 2,
                numplayersCheck: true
            }
        }

        this.max_pages = 10;

        this.updateData = this.updateData.bind(this);
        this.updateFormData = this.updateFormData.bind(this);
    }

    updateFormData(formdata) {
        // Formik does the conversion for you.
        /*
        for (var prop in formdata) {
            var val = parseInt(formdata[prop]);
            if (!isNaN(val)) {
                formdata[prop] = val;
            }
        }
        */
        

        this.setState({ formdata });
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
        return BggMine.getBGGData(cur_page).
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
        const formdata = this.state.formdata;
        let filteredGames = this.state.data;
        if (formdata.numplayersCheck) {
            filteredGames = this.state.data.filter((v) => v.bestVoted.numplayers == formdata.numplayers);
        }
        let rows = filteredGames.map((g) => {
            return (<GameTableRow key={g.id} data={g} />);
        })


        return (
            <>
                <div>{'Loading: ' + this.state.isLoading}</div>
                <Container>
                    <SearchForm {...this.state.formdata} onDataChange={this.updateFormData} /> 
                </Container>
                <table>
                    <GameTableHeader />
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </>
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




const SearchForm = (props) => {
    return (
        <div>
            <Formik
                initialValues={{
                    numplayers: props.numplayers,
                    numplayersCheck: props.numplayersCheck
                }}
                onSubmit={props.onDataChange }
            >
                <Form>
                    <SearchInputToggle label='Best Number of Players' type='number' name='numplayers' />
                    <button type="submit">Submit</button>
                </Form>
            </Formik>

        </div>
    );
}

const SearchInput = ({ label, ...props }) => {
    const [field, meta] = useField(props);

    return (
        <>
            <label htmlFor={props.id || props.name}>{label}</label>
            <input {...field} {...props} />
        </>
     );
}

const SearchInputToggle = ({ label, ...props }) => {
    var myProps = { ...props };  // Copy props
    myProps.name = props.name + 'Check';
    myProps.type = 'checkbox'
    const [field, meta] = useField(myProps);
    const onChangeOrig = field.onChange;

    return (
        <>
            <Form.Group controlId="checkboxTest">
                <Form.Check label={label} {...field} {...myProps} />
            </Form.Group>
            <SearchInput label={label} {...props} disabled={!meta.value}/>
        </>
    );
}

const domContainer = document.querySelector('#main_container_react');
ReactDOM.render(React.createElement(GameTable), domContainer)