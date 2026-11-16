import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { loginPath } from '../utils/authRedirect';

export default function RequireAuth({ children }) {
    const status = useAuthStore((state) => state.status);
    const user = useAuthStore((state) => state.user);
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}`;

    if (status !== 'authenticated' || !user) {
        return <Navigate to={loginPath(returnTo)} replace state={{ from: returnTo }} />;
    }

    return children;
}
