import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function RequireStaff({ children }) {
    const status = useAuthStore((state) => state.status);
    const user = useAuthStore((state) => state.user);

    if (status === 'loading') {
        return <p className="p-8 text-sm text-gray-600">Loading your session…</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!user.verified) {
        return <Navigate to="/verify-email" replace />;
    }

    if (!user.staff) {
        return <Navigate to="/" replace />;
    }

    return children;
}
