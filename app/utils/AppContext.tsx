import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AppContextType {
  isLoading: Boolean;
  setIsLoading: (loading?: Boolean) => void;
}

interface AppProviderProps {
  children: ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [loader, setLoader] = useState<Boolean>(false);

  const setIsLoading = (loading: Boolean = false) => {
    setLoader(loading);
  };

  useEffect(() => {}, []);

  return (
    <AppContext.Provider value={{ isLoading: loader, setIsLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
