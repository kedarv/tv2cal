import * as React from 'react';

const AuthContext = React.createContext({
  email: null,
  login: () => {}
});

const AuthProvider = ({ children }) => {
  const [email, setEmail] = React.useState(() => {
    return localStorage.getItem('email');
  });

  const login = (email) => {
    setEmail(email);
    localStorage.setItem('email', email);
  };

  return <AuthContext.Provider value={{ login, email }}>{children}</AuthContext.Provider>;
};

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error(`useAuth must be used within a AuthProvider`);
  }
  return context;
}
export { AuthProvider, useAuth };
