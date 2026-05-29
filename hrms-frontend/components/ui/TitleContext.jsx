'use client';
import { createContext, useContext, useState } from 'react';

const TitleContext = createContext({ title: '', setTitle: () => {} });

export const TitleProvider = ({ children }) => {
  const [title, setTitle] = useState('');
  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitleContext = () => useContext(TitleContext);
