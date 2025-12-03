import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../provider/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { authenticated, jwt, isInitializing } = useAuth();
    const navigate = useNavigate();
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        if (isInitializing) return;
        if (!authenticated && !hasRedirected) {
            setHasRedirected(true);
            navigate('/auth/login', { replace: true });
        }
    }, [authenticated, isInitializing, navigate, hasRedirected]);

    if (isInitializing) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                Đang kiểm tra quyền truy cập...
            </div>
        );
    }

    if (!authenticated || !jwt) {
        return null;
    }

    return children;
};

export default ProtectedRoute;
