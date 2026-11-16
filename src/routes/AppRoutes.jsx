import { Navigate, Route, Routes, useParams } from 'react-router-dom';

function LegacyFoodRedirect() {
    const { id } = useParams();

    return <Navigate to={`/movies/${id}/book/food`} replace />;
}
import GuestLayout from '../layouts/GuestLayout';
import AccountPage from '../pages/AccountPage';
import CinemasPage from '../pages/admin/CinemasPage';
import AdminBookingPage from '../pages/admin/AdminBookingPage';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage';
import AdminOrderPage from '../pages/admin/AdminOrderPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdministratorsPage from '../pages/admin/AdministratorsPage';
import CustomersPage from '../pages/admin/CustomersPage';
import DashboardPage from '../pages/admin/DashboardPage';
import ManagedUserPage from '../pages/admin/ManagedUserPage';
import RoleFormPage from '../pages/admin/RoleFormPage';
import RolesPage from '../pages/admin/RolesPage';
import SettingsPage from '../pages/admin/SettingsPage';
import FoodCategoriesPage from '../pages/admin/FoodCategoriesPage';
import FoodFormPage from '../pages/admin/FoodFormPage';
import FoodProductsPage from '../pages/admin/FoodProductsPage';
import GenresPage from '../pages/admin/GenresPage';
import MovieFormPage from '../pages/admin/MovieFormPage';
import AdminMoviesPage from '../pages/admin/MoviesPage';
import ScreensPage from '../pages/admin/ScreensPage';
import SeatsPage from '../pages/admin/SeatsPage';
import ShowtimesPage from '../pages/admin/ShowtimesPage';
import TicketCheckPage from '../pages/admin/TicketCheckPage';
import BookingPage from '../pages/BookingPage';
import BookingsPage from '../pages/BookingsPage';
import BookCinemaPage from '../pages/book/BookCinemaPage';
import BookFoodPage from '../pages/book/BookFoodPage';
import BookReviewPage from '../pages/book/BookReviewPage';
import BookSchedulePage from '../pages/book/BookSchedulePage';
import BookSeatsPage from '../pages/book/BookSeatsPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import LoginPage from '../pages/LoginPage';
import MoviePage from '../pages/MoviePage';
import MoviesPage from '../pages/MoviesPage';
import PaymentPage from '../pages/PaymentPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import SitePage from '../pages/SitePage';
import TicketPage from '../pages/TicketPage';
import TwoFactorPage from '../pages/TwoFactorPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import RequireAuth from './RequireAuth';
import RequireStaff from './RequireStaff';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<MoviesPage />} />
            <Route path="/blog" element={<SitePage />} />
            <Route path="/pricing" element={<SitePage />} />
            <Route path="/about" element={<SitePage />} />
            <Route path="/faq" element={<SitePage />} />
            <Route path="/contact" element={<SitePage />} />
            <Route path="/terms" element={<SitePage />} />
            <Route path="/movies/:id" element={<MoviePage />} />
            <Route path="/movies/:id/book/cinema" element={<BookCinemaPage />} />
            <Route path="/movies/:id/book/schedule" element={<BookSchedulePage />} />
            <Route path="/movies/:id/book/seats" element={<BookSeatsPage />} />
            <Route path="/movies/:id/book/food" element={<BookFoodPage />} />
            <Route path="/movies/:id/book/review" element={<BookReviewPage />} />
            <Route path="/movies/:id/food" element={<LegacyFoodRedirect />} />
            <Route element={<GuestLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/two-factor" element={<TwoFactorPage />} />
                <Route
                    path="/verify-email"
                    element={(
                        <RequireAuth>
                            <VerifyEmailPage />
                        </RequireAuth>
                    )}
                />
            </Route>
            <Route path="/tickets" element={<RequireAuth><BookingsPage /></RequireAuth>} />
            <Route path="/bookings" element={<RequireAuth><BookingsPage /></RequireAuth>} />
            <Route path="/bookings/:id" element={<RequireAuth><BookingPage /></RequireAuth>} />
            <Route path="/bookings/:id/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
            <Route path="/bookings/:id/ticket" element={<RequireAuth><TicketPage /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/admin/dashboard" element={<RequireStaff><DashboardPage /></RequireStaff>} />
            <Route path="/admin/cinemas" element={<RequireStaff><CinemasPage /></RequireStaff>} />
            <Route path="/admin/screens" element={<RequireStaff><ScreensPage /></RequireStaff>} />
            <Route path="/admin/seats" element={<RequireStaff><SeatsPage /></RequireStaff>} />
            <Route path="/admin/movies" element={<RequireStaff><AdminMoviesPage /></RequireStaff>} />
            <Route path="/admin/movies/create" element={<RequireStaff><MovieFormPage /></RequireStaff>} />
            <Route path="/admin/movies/:id/edit" element={<RequireStaff><MovieFormPage /></RequireStaff>} />
            <Route path="/admin/genres" element={<RequireStaff><GenresPage /></RequireStaff>} />
            <Route path="/admin/showtimes" element={<RequireStaff><ShowtimesPage /></RequireStaff>} />
            <Route path="/admin/food-categories" element={<RequireStaff><FoodCategoriesPage /></RequireStaff>} />
            <Route path="/admin/food" element={<RequireStaff><FoodProductsPage /></RequireStaff>} />
            <Route path="/admin/food/create" element={<RequireStaff><FoodFormPage /></RequireStaff>} />
            <Route path="/admin/food/:id/edit" element={<RequireStaff><FoodFormPage /></RequireStaff>} />
            <Route path="/admin/tickets/check" element={<RequireStaff><TicketCheckPage /></RequireStaff>} />
            <Route path="/admin/bookings" element={<RequireStaff><AdminBookingsPage /></RequireStaff>} />
            <Route path="/admin/bookings/:id" element={<RequireStaff><AdminBookingPage /></RequireStaff>} />
            <Route path="/admin/orders" element={<RequireStaff><AdminOrdersPage /></RequireStaff>} />
            <Route path="/admin/orders/:id" element={<RequireStaff><AdminOrderPage /></RequireStaff>} />
            <Route path="/admin/customers" element={<RequireStaff><CustomersPage /></RequireStaff>} />
            <Route path="/admin/customers/:id/edit" element={<RequireStaff><ManagedUserPage /></RequireStaff>} />
            <Route path="/admin/users" element={<RequireStaff><AdministratorsPage /></RequireStaff>} />
            <Route path="/admin/users/:id/edit" element={<RequireStaff><ManagedUserPage /></RequireStaff>} />
            <Route path="/admin/roles" element={<RequireStaff><RolesPage /></RequireStaff>} />
            <Route path="/admin/roles/create" element={<RequireStaff><RoleFormPage /></RequireStaff>} />
            <Route path="/admin/roles/:id/edit" element={<RequireStaff><RoleFormPage /></RequireStaff>} />
            <Route path="/admin/settings" element={<RequireStaff><SettingsPage /></RequireStaff>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
