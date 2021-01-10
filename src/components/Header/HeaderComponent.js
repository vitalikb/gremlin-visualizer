import React from 'react';
import {connect} from 'react-redux';
import {Button, TextField} from '@material-ui/core';
import axios from 'axios';
import {ACTIONS, QUERY_ENDPOINT} from '../../constants';
import {onFetchQuery} from '../../logics/actionHelper';
import Autocomplete from '@material-ui/lab/Autocomplete';

class Header extends React.Component {
  dropGraph() {
    if (window.confirm("This will delete all nodes in the DB, are you sure?")) {
      const dropQuery = "g.V().drop()";
      axios.post(
          QUERY_ENDPOINT,
          {
            query: dropQuery,
            nodeLimit: this.props.nodeLimit,
          },
          { headers: { 'Content-Type': 'application/json' } },
      ).then((response) => {
        this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
      }).catch((error) => {
        this.props.dispatch(
            { type: ACTIONS.SET_ERROR, payload: error });
      });
      this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
    }
  }

  clearAndSendQuery() {
    this.props.dispatch({ type: ACTIONS.CLEAR_GRAPH });
    this.sendQuery();
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
          query: this.props.query,
          nodeLimit: this.props.nodeLimit,
        },
        { headers: { 'Content-Type': 'application/json' } },
    ).then((response) => {
      onFetchQuery(response, this.props.query, this.props.nodeLabels,
          this.props.dispatch);
    }).catch((error) => {
      this.props.dispatch(
          { type: ACTIONS.SET_ERROR, payload: error });
    });
  }

  onQueryChanged(query) {
    this.props.dispatch({ type: ACTIONS.SET_QUERY, payload: query });
  }

  onQueryKeyPress(event) {
    if (event.keyCode === 13) {
      if (event.metaKey) {
        this.clearAndSendQuery();
      } else {
        this.sendQuery();
      }
    }
  }

  render() {
    let buttonStyle = { width: '150px', marginLeft: '4px', marginRight: '4px' };

    // const filterOptions = (options, { inputValue }) => {return options;}
    // matchSorter(options, inputValue);

    return (
        <div className={ 'header' }>
          <form noValidate autoComplete="off" onSubmit={e => { e.preventDefault(); }}>
            <Autocomplete
                // filterOptions={ filterOptions }
                id="combo-box-demo"
                value={ this.props.query }
                options={ this.props.queryHistory }
                getOptionLabel={ (option) => option }
                style={ { width: "50%", display: 'inline' } }
                variant="outlined"
                defaultValue="g.V()"
                renderInput={ (params) =>
                    <TextField { ...params }
                               value={ this.props.query }
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
    query: state.gremlin.query,
    error: state.gremlin.error,
    nodes: state.graph.nodes,
    edges: state.graph.edges,
    nodeLabels: state.options.nodeLabels,
    nodeLimit: state.options.nodeLimit,
    queryHistory: state.options.queryHistory,
  };
})(Header);