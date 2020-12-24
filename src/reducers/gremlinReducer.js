import {ACTIONS} from '../constants';

const initialState = {
  query: 'g.V()',
  error: null,
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case ACTIONS.SET_QUERY: {
      return { ...state, query: action.payload, error: null }
    }
    case ACTIONS.SET_ERROR: {
      const errorMsg = action.payload?.toString();
      return { ...state, error: errorMsg }
    }
    default:
      return state;
  }
};
