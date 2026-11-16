import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './stores/authStore';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
    const status = useAuthStore((state) => state.status);
    const restore = useAuthStore((state) => state.restore);

    useEffect(() => {
        restore();
    }, [restore]);

    return (
        <BrowserRouter>
            {status === 'loading' ? (
                <div className="flex min-h-screen items-center justify-center bg-mist text-sm text-gray-600">
                    Checking your session…
                </div>
            ) : (
                <AppRoutes />
            )}
            <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
        </BrowserRouter>
    );
}
