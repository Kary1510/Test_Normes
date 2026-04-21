import { useCallback, useReducer } from 'react';
import { WORLD_ORDER } from '../game/constants.js';

const initial = {
  worldId: 'forest',
  coins: 0,
  activeSkin: 'default',
  toasts: [],
  tab: 'game',        // 'game' | 'shop'
  paused: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_WORLD':
      return { ...state, worldId: action.worldId };
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.amount };
    case 'SET_COINS':
      return { ...state, coins: action.coins };
    case 'SET_SKIN':
      return { ...state, activeSkin: action.skinId };
    case 'PUSH_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Date.now(), text: action.text }] };
    case 'POP_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'SET_TAB':
      return { ...state, tab: action.tab };
    case 'SYNC_PROFILE':
      return { ...state, coins: action.coins, activeSkin: action.activeSkin };
    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, initial);

  const setWorld  = useCallback((worldId) => dispatch({ type: 'SET_WORLD', worldId }), []);
  const addCoins  = useCallback((amount)  => dispatch({ type: 'ADD_COINS', amount }), []);
  const setCoins  = useCallback((coins)   => dispatch({ type: 'SET_COINS', coins }), []);
  const setSkin   = useCallback((skinId)  => dispatch({ type: 'SET_SKIN', skinId }), []);
  const setTab    = useCallback((tab)     => dispatch({ type: 'SET_TAB', tab }), []);

  const pushToast = useCallback((text) => {
    dispatch({ type: 'PUSH_TOAST', text });
  }, []);

  const popToast = useCallback((id) => {
    dispatch({ type: 'POP_TOAST', id });
  }, []);

  const syncProfile = useCallback((profile) => {
    if (!profile) return;
    dispatch({ type: 'SYNC_PROFILE', coins: profile.coins, activeSkin: profile.activeSkin });
  }, []);

  return { state, setWorld, addCoins, setCoins, setSkin, setTab, pushToast, popToast, syncProfile };
}
