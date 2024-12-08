import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppContextType {}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<any> = ({ children }) => {
  useEffect(() => {}, []);

  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useFSM must be used within a FSMProvider');
  }

  const {} = context;

  return {};
};
