import React from 'react';
import {connect} from 'react-redux';
import {Button, TextField} from '@material-ui/core';
import axios from 'axios';
import {ACTIONS, QUERY_ENDPOINT, COMMON_GREMLIN_ERROR} from '../../constants';
import {onFetchQuery} from '../../logics/actionHelper';
import Autocomplete from '@material-ui/lab/Autocomplete';

class Header extends React.Component {
  dropGraph() {
    if (window.confirm("This will delete all nodes in the DB, are you sure?")) {
      const dropQuery = "g.V().drop()";
      axios.post(
          QUERY_ENDPOINT,
          {
            host: this.props.host,
            port: this.props.port,
            query: dropQuery,
            nodeLimit: this.props.nodeLimit,
          },
          { headers: { 'Content-Type': 'application/json' } },
      ).then((response) => {
        this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
      }).catch((error) => {
        this.props.dispatch(
            { type: ACTIONS.SET_ERROR, payload: COMMON_GREMLIN_ERROR });
      });
      this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
    }
  }

  clearAndSendQuery() {
    this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
    this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    axios.post(
        QUERY_ENDPOINT,
        {
          host: this.props.host,
          port: this.props.port,
          query: this.props.query,
          nodeLimit: this.props.nodeLimit,
        },
        { headers: { 'Content-Type': 'application/json' } },
    ).then((response) => {
      onFetchQuery(response, this.props.query, this.props.nodeLabels,
          this.props.dispatch);
    }).catch((error) => {
      this.props.dispatch(
          { type: ACTIONS.SET_ERROR, payload: COMMON_GREMLIN_ERROR });
    });

  }

  clearGraph() {
    this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
    this.props.dispatch({ type: ACTIONS.CLEAR_QUERY_HISTORY });
  }

  sendQuery() {
    this.props.dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    axios.post(
        QUERY_ENDPOINT,
        {
          host: this.props.host,
          port: this.props.port,
          query: this.props.query,
          nodeLimit: this.props.nodeLimit,
        },
        { headers: { 'Content-Type': 'application/json' } },
    ).then((response) => {
      onFetchQuery(response, this.props.query, this.props.nodeLabels,
          this.props.dispatch);
    }).catch((error) => {
      this.props.dispatch(
          { type: ACTIONS.SET_ERROR, payload: COMMON_GREMLIN_ERROR });
    });
  }

  onHostChanged(host) {
    this.props.dispatch({ type: ACTIONS.SET_HOST, payload: host });
  }

  onPortChanged(port) {
    this.props.dispatch({ type: ACTIONS.SET_PORT, payload: port });
  }

  onQueryChanged(query) {
    this.props.dispatch({ type: ACTIONS.SET_QUERY, payload: query });
  }

  onQueryKeyPress(event) {
    if (event.keyCode === 13) {
      if (event.shiftKey) {
        this.clearAndSendQuery();
      } else {
        this.sendQuery();
      }
    }
  }

  render() {
    let buttonStyle = { width: '150px', marginLeft: '4px', marginRight: '4px' };

    const filterOptions = (options, { inputValue }) => {return options;}
    // matchSorter(options, inputValue);

    return (
        <div className={ 'header' }>
          <form noValidate autoComplete="off">
            <TextField value={ this.props.host }
                       onChange={ (event => this.onHostChanged(
                           event.target.value)) }
                       id="standard-basic" label="host"
                       style={ { width: '200px' } }/>
            <TextField value={ this.props.port }
                       onChange={ (event => this.onPortChanged(
                           event.target.value)) }
                       id="standard-basic" label="port"
                       style={ { width: '70px' } }/>

            <Autocomplete
                // filterOptions={ filterOptions }
                id="combo-box-demo"
                options={ this.props.queryHistory }
                getOptionLabel={ (option) => option }
                style={ { width: "50%", display: 'inline' } }
                variant="outlined"
                defaultValue="g.V()"
                renderInput={ (params) =>
                    <TextField { ...params }
                               value={ this.props.query }
                               autoFocus
                               onChange={ (event => this.onQueryChanged(
                                   event.target.value)) }
                               onKeyDown={ this.onQueryKeyPress.bind(this) }
                               id="standard-basic"
                               label="gremlin query"
                               tabIndex={ 1 }
                               style={ { width: '50%' } }/> }
            />

            <Button variant="contained" color="primary"
                    onClick={ this.clearAndSendQuery.bind(this) }
                    style={ buttonStyle }>Reload</Button>
            <Button variant="contained" color="primary"
                    onClick={ this.sendQuery.bind(this) }
                    style={ buttonStyle }>Execute</Button>
            <Button variant="outlined" color="secondary"
                    onClick={ this.clearGraph.bind(this) }
                    style={ buttonStyle }>Clear Graph</Button>
            <Button variant="outlined" color="secondary"
                    onClick={ this.dropGraph.bind(this) }
                    style={ buttonStyle }>
              Drop Graph</Button>
          </form>

          <br/>
          <div style={ { color: 'red' } }>{ this.props.error }</div>
        </div>

    );
  }

}

export const HeaderComponent = connect((state) => {
  return {
    host: state.gremlin.host,
    port: state.gremlin.port,
    query: state.gremlin.query,
    error: state.gremlin.error,
    nodes: state.graph.nodes,
    edges: state.graph.edges,
    nodeLabels: state.options.nodeLabels,
    nodeLimit: state.options.nodeLimit,
    queryHistory: state.options.queryHistory,
  };
})(Header);