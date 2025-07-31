import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { StorageKey, StorageUtils } from "./Storage";

export enum LoginType {
  google = "google",
  normal = "normal",
}
interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  type: LoginType; // Optional type field for future use
}

interface AuthContextType {
  authState: AuthState;
  login: (token: string, type?: LoginType) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  token: undefined,
  type: LoginType.normal,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedState = StorageUtils.get<AuthState>(StorageKey.AUTH_STATE);
    return storedState || defaultAuthState;
  });

  const login = (token: string, type: LoginType = LoginType.normal) => {
    const newState: AuthState = {
      isAuthenticated: true,
      token: token,
      type: type,
    };
    setAuthState(newState);
    StorageUtils.set(StorageKey.AUTH_STATE, newState);
  };

  const logout = () => {
    setAuthState(defaultAuthState);
    StorageUtils.set(StorageKey.AUTH_STATE, defaultAuthState);
  };

  useEffect(() => {
    const storedState = StorageUtils.get<AuthState>(StorageKey.AUTH_STATE);
    if (storedState) {
      setAuthState(storedState);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
