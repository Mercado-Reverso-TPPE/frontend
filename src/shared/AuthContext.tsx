import { createContext, useContext, useState, ReactNode } from "react";
import { User, ME } from "./data";

interface AuthCtx {
  user: User | null;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, isLoggedIn: false,
  login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      login: () => setUser(ME),
      logout: () => setUser(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
