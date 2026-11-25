import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Auth, Users } from '../api';
import { tokenStore } from '../api/client';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setReady(true); return; }
    try { setUser(await Users.me()); } catch { setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => {
    load();
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [load]);

  const finish = (d) => { tokenStore.set({ accessToken: d.accessToken, refreshToken: d.refreshToken }); setUser(d.user); return d.user; };
  const login = async (email, password) => finish(await Auth.login({ email, password }));
  const register = async (body) => finish(await Auth.register(body));
  const logout = async () => {
    const t = tokenStore.get();
    try { if (t) await Auth.logout(t.refreshToken); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, login, register, logout, reload: load }}>{children}</Ctx.Provider>;
}
