import React from "react";
import ReactDOM from 'react-dom';
import * as BggMine from './bgg_mine.js';  // TODO improve this??
import { Formik, Form as FForm, useField } from 'formik'

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import BSForm from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
// import 'bootstrap/dist/css/bootstrap.min.css';  // THis isn't working

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

        // TODO React Recomments using the callback logic in componentDidUpdate instead.
    }

    getNextPage() {
        var cur_page = this.state.cur_page + 1;
        return BggMine.getBGGData(cur_page).
            then((data) => this.updateData(data, cur_page));
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

    componentDidUpdate(prevProps, prevState) {
        if (this.state.cur_page !== prevState.cur_page) {
            if (this.state.cur_page < this.max_pages) {
                return this.getNextPage();
            } else {
                return this.setState({
                    isLoading: false
                });
            }
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
            <Container fluid>
                <br />
                <Card>
                    <Card.Body>
                        <Row>
                            <Col>
                                {/* TODO remove this guy */}
                                <div>{'Loading: ' + this.state.isLoading}</div>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <SearchForm {...this.state.formdata} onDataChange={this.updateFormData} />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                <br />
                <Card>
                    <Card.Header>Results</Card.Header>
                    <Card.Body>
                        {(this.state.isLoading ? <Spinner animation="border" /> : null)}
                        <Table bordered>
                            <GameTableHeader />
                            <tbody>
                                {rows}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>
        );
    }
}

function GameTableHeader() {
    return (
        <thead>
            <tr>
                <th>Rank</th>
                <th></th>
                <th>Game</th>
                <th>Num Players</th>
                <th>Best Num Players</th>
            </tr>
        </thead>
    );
}

function GameTableRow(props) {
    var bggLink = 'http://www.boardgamegeek.com' + props.data.url;

    return (
        <tr>
            <td>{props.data.rank}</td>
            <td>
                <a href={bggLink} target='_blank'>
                    <img src={props.data.thumbnail} style={{ width: '60px' }} />
                </a>
            </td>
            <td>
                <a href={bggLink} target='_blank'>{props.data.bgname}</a>
            </td>
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
                <FForm>
                    <SearchInputToggle name='numplayers' label='Best Number of Players' type='number'  />
                    <BSForm.Row>
                        <Col>
                            <Button variant="primary" type="submit">Submit</Button>
                        </Col>
                    </BSForm.Row>
                </FForm>
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

const SearchInputToggle = ({ label, ...inpProps }) => {
    var checkProps = { ...inpProps };  // Copy props
    checkProps.name = inpProps.name + 'Check';
    checkProps.type = 'checkbox'
    const [checkField, checkMeta] = useField(checkProps);
    const [inpField, inpMeta] = useField(inpProps);

    return (
        <>
            <InputGroup className="mb-3">
                <BSForm.Group as={InputGroup.Prepend} controlId='test'>
                    <InputGroup.Text>          
                        <BSForm.Check label={label} {...checkField} {...checkProps} />
                    </InputGroup.Text>
                </BSForm.Group>
                <BSForm.Control {...inpField} {...inpProps} disabled={!checkMeta.value} />
            </InputGroup>
            { //<SearchInput label={label} {...props} disabled={!meta.value}/> 
            }
        </>
    );
}

const domContainer = document.querySelector('#main_container_react');
ReactDOM.render(React.createElement(GameTable), domContainer)