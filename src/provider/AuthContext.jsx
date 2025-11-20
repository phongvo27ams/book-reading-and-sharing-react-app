import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken, userLogin, userLogout } from '../api/authApi';
import { getUserInfo, register } from "../api/userApi";
import { useNavigate } from "react-router-dom";
import { Messages } from "../components/FoxCharacter/FoxCharacter";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [userInfo, setUserInfo] = useState(null);
  const [jwt, setJwt] = useState(() => localStorage.getItem('jwt'));
  const [message, setMessage] = useState(Messages.LOGIN);
  const [loading, setLoading] = useState(true); // Start with loading state
  const [authenticated, setAuthenticated] = useState(false);

  const navigate = useNavigate();

  // Save token to localStorage every time it changes
  useEffect(() => {
    if (jwt) {
      localStorage.setItem('jwt', jwt);
    } else {
      localStorage.removeItem('jwt');
    }
  }, [jwt]);

  // Check token and getUserInfo on startup
  useEffect(() => {
    const initializeAuth = async () => {
      if (!jwt) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const response = await getUserInfo(jwt);
        setUserInfo(response.data);
        setAuthenticated(true);
      } catch (error) {
        console.error("Failed to fetch user info", error);
        await logout(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [jwt]);

  const userRegister = async (request) => {
    try {
      setLoading(true);
      const response = await register(request);

      if (response.statusCode === 0) {
        setMessage(Messages.AFTER_SIGNUP_SUCCESS);
        return { success: true };
      }

      if (response.statusCode === 1002) {
        setMessage(Messages.USERNAME_EXIST);
      } else if (response.statusCode === 2004) {
        setMessage(Messages.EMAIL_EXIST);
      } else {
        setMessage(Messages.SIGNUP_FAIL);
      }
      return { success: false };
    } catch (error) {
      if (error?.response?.data?.statusCode === 1002) {
        setMessage(Messages.USERNAME_EXIST);
      } else if (error?.response?.data?.statusCode === 2004) {
        setMessage(Messages.EMAIL_EXIST);
      } else {
        setMessage(Messages.SIGNUP_FAIL);
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await userLogin(credentials);

      if (response.data.authenticated) {
        const token = response.data.token;
        setJwt(token);
        setAuthenticated(true);

        const userResponse = await getUserInfo(token);
        setUserInfo(userResponse.data);

        setMessage(Messages.LOGIN);
        navigate("/");
        return true;
      } else {
        setMessage(Messages.LOGIN_FAIL);
        return false;
      }
    } catch (error) {
      setMessage(Messages.LOGIN_FAIL);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (shouldNavigate = true) => {
    try {
      if (jwt) {
        await userLogout(jwt);
        if (shouldNavigate) navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setJwt(null);
      setAuthenticated(false);
      setUserInfo(null);
      setMessage(Messages.LOGIN);
    }
  };

  // Refresh token every 1 hour
  useEffect(() => {
    if (!jwt) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await refreshToken(jwt);
        if (response.data.isAuthenticated) {
          setJwt(response.data.token);
        } else {
          await logout(false);
        }
      } catch (error) {
        await logout(false);
      }
    }, 3600000);

    return () => clearInterval(intervalId);
  }, [jwt]);

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        userRegister,
        login,
        logout,
        loading,
        message,
        setMessage,
        jwt,
        setJwt,
        userInfo,
        setUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);