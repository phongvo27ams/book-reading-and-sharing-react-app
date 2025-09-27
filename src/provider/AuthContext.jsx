import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken, userLogin, userLogout } from '../api/authApi';
import { getUserInfo, register } from "../api/userApi";
import { useNavigate } from "react-router-dom";
import { Messages } from "../components/FoxCharacter/FoxCharacter";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [userInfo, setUserInfo] = useState(null)
    const [jwt, setJwt] = useState(() => localStorage.getItem('jwt'));
    const [message, setMessage] = useState(Messages.LOGIN)
    const [loading, setLoading] = useState(false);
    const [authenticated, setAuthenticated] = useState(false)
    const [hasFetchedUser, setHasFetchedUser] = useState(false);

    const navigate = useNavigate()

    useEffect(() => {
        if (jwt) {
            localStorage.setItem('jwt', jwt);
        } else {
            localStorage.removeItem('jwt');
        }
    }, [jwt]);

    useEffect(() => {
        const fetchUser = async () => {
            if (!jwt || hasFetchedUser) return;
            try {
                const response = await getUserInfo(jwt);
                setUserInfo(response.data);
                setAuthenticated(true);
                setHasFetchedUser(true);
            } catch (error) {
                console.error("Failed to fetch user info", error);
                await logout();
            }
        };

        fetchUser();
    }, [jwt, hasFetchedUser]);

    const userRegister = async (request) => {
        try {
            setLoading(true)
            const response = await register(request)
            if (response.statusCode === 0) setMessage(Messages.AFTER_SIGNUP_SUCCESS)
            return true
        } catch (error) {
            console.log(error)
            if (error.response?.data?.statusCode === 1002) setMessage(Messages.USERNAME_EXIST)
            if (error.response?.data?.statusCode === 2004) setMessage(Messages.EMAIL_EXIST)
            return false
        } finally {
            setLoading(false)
        }
    }

    const login = async (credentials) => {
        try {
            setLoading(true);
            const response = await userLogin(credentials);

            if (response.data.authenticated) {
                const token = response.data.token;
                setJwt(token);
                setAuthenticated(true)

                const userResponse = await getUserInfo(token)
                setUserInfo(userResponse.data)
                setHasFetchedUser(true)

                // Reset message after successful login
                setMessage(Messages.LOGIN)
                
                navigate("/")
                return true
            } else {
                setMessage(Messages.LOGIN_FAIL)
                return false
            }

        } catch (error) {
            setMessage(Messages.LOGIN_FAIL)
            return false
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (jwt) {
                await userLogout(jwt);
                navigate("/")
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setJwt(null);
            setAuthenticated(false)
            setUserInfo(null)
            setMessage(Messages.LOGIN) // Reset message to default LOGIN state
        }
    };

    useEffect(() => {
        if (!jwt) return;

        const intervalId = setInterval(async () => {
            try {
                const response = await refreshToken(jwt);

                if (response.data.isAuthenticated) {
                    setJwt(response.data.token);
                } else {
                    await logout();
                }
            } catch (error) {
                await logout();
            }
        }, 3600000);

        return () => clearInterval(intervalId);

    }, [jwt]);

    return (
        <AuthContext.Provider value={
            {
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
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
