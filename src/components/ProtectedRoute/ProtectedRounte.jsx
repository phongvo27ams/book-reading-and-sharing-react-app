import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../provider/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { authenticated, jwt, loading } = useAuth();
    const navigate = useNavigate();
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        if (!loading && !authenticated && !hasRedirected) {
            setHasRedirected(true);
            navigate('/auth/login', { replace: true });
        }
    }, [authenticated, loading, navigate, hasRedirected]);

    if (loading) {
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
