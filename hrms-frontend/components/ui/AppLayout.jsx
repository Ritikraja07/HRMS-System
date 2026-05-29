'use client';
import { useEffect } from 'react';
import { useTitleContext } from './TitleContext';

export const AppLayout = ({ children, title }) => {
  const { setTitle } = useTitleContext();

  useEffect(() => {
    setTitle(title || '');
  }, [title, setTitle]);

  return <>{children}</>;
};

export default AppLayout;
