import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StatusContextType {
  isOpen: boolean;
  toggleStatus: () => void;
  hasMatch: boolean;
  setHasMatch: (value: boolean) => void;
  matchColor: string;
  setMatchColor: (color: string) => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const StatusProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMatch, setHasMatch] = useState(false);
  const [matchColor, setMatchColor] = useState('#FFFFFF');

  const toggleStatus = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Simuler une couleur aléatoire lors de l'activation
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
      setMatchColor(randomColor);
    }
  };

  return (
    <StatusContext.Provider value={{ isOpen, toggleStatus, hasMatch, setHasMatch, matchColor, setMatchColor }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
}; 