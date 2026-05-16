import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NavDirection = 'left' | 'right' | 'up' | 'none';

interface NavigationContextType {
  direction: NavDirection;
  setDirection: (dir: NavDirection) => void;
  prevPath: string;
  setPrevPath: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  direction: 'none',
  setDirection: () => {},
  prevPath: '',
  setPrevPath: () => {},
});

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [direction, setDirection] = useState<NavDirection>('none');
  const [prevPath, setPrevPath] = useState('');

  return (
    <NavigationContext.Provider value={{ direction, setDirection, prevPath, setPrevPath }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => useContext(NavigationContext);
