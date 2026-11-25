import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  DEFAULT_TITLE,
  MAX_EXPO_ITEMS,
  expoReducer,
  loadExpoFromStorage,
  saveExpoToStorage,
} from '../lib/art';

const ExpoContext = createContext(null);

const initialExpoState = {
  title: DEFAULT_TITLE,
  items: [],
};

export function ExpoProvider({ children }) {
  const [state, dispatch] = useReducer(expoReducer, initialExpoState, (init) => {
    const saved = loadExpoFromStorage();
    return saved || init;
  });

  useEffect(() => {
    saveExpoToStorage(state);
  }, [state]);

  const addToExpo = (artwork) => {
    dispatch({ type: 'ADD_ITEM', payload: artwork });
  };

  const removeFromExpo = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const moveUp = (index) => {
    dispatch({ type: 'MOVE_UP', payload: index });
  };

  const moveDown = (index) => {
    dispatch({ type: 'MOVE_DOWN', payload: index });
  };

  const setTitle = (title) => {
    dispatch({ type: 'SET_TITLE', payload: title });
  };

  const sortChronologically = () => {
    dispatch({ type: 'SORT_CHRONOLOGICAL' });
  };

  const clearExpo = () => {
    dispatch({ type: 'CLEAR' });
  };

  const isInExpo = (id) => {
    return state.items.some((item) => item.id === id);
  };

  const isFull = state.items.length >= MAX_EXPO_ITEMS;

  return (
    <ExpoContext.Provider
      value={{
        state,
        dispatch,
        addToExpo,
        removeFromExpo,
        moveUp,
        moveDown,
        setTitle,
        sortChronologically,
        clearExpo,
        isInExpo,
        isFull,
      }}
    >
      {children}
    </ExpoContext.Provider>
  );
}

export function useExpo() {
  const ctx = useContext(ExpoContext);
  if (!ctx) {
    throw new Error('useExpo must be used within an ExpoProvider');
  }
  return ctx;
}
