import { Navigate, Route, Routes, useParams } from 'react-router-dom';

function LegacyFoodRedirect() {
    const { id } = useParams();

    return <Navigate to={`/movies/${id}/book/food`} replace />;
}
import GuestLayout from '../layouts/GuestLayout';
import { AdminShell } from '../layouts/AdminLayout';
import AccountPage from '../pages/account/AccountPage';
import CinemasPage from '../pages/admin/CinemasPage';
import AdminBookingDetailsPage from '../pages/admin/BookingDetailsPage';
import AdminBookingsListPage from '../pages/admin/BookingsPage';
import OrderDetailsPage from '../pages/admin/OrderDetailsPage';
import OrdersPage from '../pages/admin/OrdersPage';
import UsersPage from '../pages/admin/UsersPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import CustomersPage from '../pages/admin/CustomersPage';
import DashboardPage from '../pages/admin/DashboardPage';
import UserDetailsPage from '../pages/admin/UserDetailsPage';
import RoleFormPage from '../pages/admin/RoleFormPage';
import RolesPage from '../pages/admin/RolesPage';
import SettingsPage from '../pages/admin/SettingsPage';
import FoodCategoriesPage from '../pages/admin/FoodCategoriesPage';
import FoodProductFormPage from '../pages/admin/FoodProductFormPage';
import FoodProductsPage from '../pages/admin/FoodProductsPage';
import GenresPage from '../pages/admin/GenresPage';
import MovieFormPage from '../pages/admin/MovieFormPage';
import AdminMoviesPage from '../pages/admin/MoviesPage';
import ScreensPage from '../pages/admin/ScreensPage';
import SeatsPage from '../pages/admin/SeatsPage';
import ShowtimesPage from '../pages/admin/ShowtimesPage';
import TicketVerificationPage from '../pages/admin/TicketVerificationPage';
import BookingDetailsPage from '../pages/account/BookingDetailsPage';
import BookingsPage from '../pages/account/BookingsPage';
import CinemaSelectionPage from '../pages/book/CinemaSelectionPage';
import FoodSelectionPage from '../pages/book/FoodSelectionPage';
import BookingReviewPage from '../pages/book/BookingReviewPage';
import ScheduleSelectionPage from '../pages/book/ScheduleSelectionPage';
import SeatSelectionPage from '../pages/book/SeatSelectionPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import MoviePage from '../pages/catalog/MoviePage';
import MoviesPage from '../pages/catalog/MoviesPage';
import PaymentPage from '../pages/account/PaymentPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import SitePage from '../pages/site/SitePage';
import TicketPage from '../pages/account/TicketPage';
import TwoFactorPage from '../pages/auth/TwoFactorPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
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
            <Route path="/movies/:id/book/cinema" element={<CinemaSelectionPage />} />
            <Route path="/movies/:id/book/schedule" element={<ScheduleSelectionPage />} />
            <Route path="/movies/:id/book/seats" element={<SeatSelectionPage />} />
            <Route path="/movies/:id/book/food" element={<FoodSelectionPage />} />
            <Route path="/movies/:id/book/review" element={<BookingReviewPage />} />
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
            <Route path="/bookings/:id" element={<RequireAuth><BookingDetailsPage /></RequireAuth>} />
            <Route path="/bookings/:id/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
            <Route path="/bookings/:id/ticket" element={<RequireAuth><TicketPage /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route element={<RequireStaff><AdminShell /></RequireStaff>}>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/cinemas" element={<CinemasPage />} />
                <Route path="/admin/screens" element={<ScreensPage />} />
                <Route path="/admin/seats" element={<SeatsPage />} />
                <Route path="/admin/movies" element={<AdminMoviesPage />} />
                <Route path="/admin/movies/create" element={<MovieFormPage />} />
                <Route path="/admin/movies/:id/edit" element={<MovieFormPage />} />
                <Route path="/admin/genres" element={<GenresPage />} />
                <Route path="/admin/showtimes" element={<ShowtimesPage />} />
                <Route path="/admin/food-categories" element={<FoodCategoriesPage />} />
                <Route path="/admin/food" element={<FoodProductsPage />} />
                <Route path="/admin/food/create" element={<FoodProductFormPage />} />
                <Route path="/admin/food/:id/edit" element={<FoodProductFormPage />} />
                <Route path="/admin/tickets/check" element={<TicketVerificationPage />} />
                <Route path="/admin/bookings" element={<AdminBookingsListPage />} />
                <Route path="/admin/bookings/:id" element={<AdminBookingDetailsPage />} />
                <Route path="/admin/orders" element={<OrdersPage />} />
                <Route path="/admin/orders/:id" element={<OrderDetailsPage />} />
                <Route path="/admin/customers" element={<CustomersPage />} />
                <Route path="/admin/customers/:id/edit" element={<UserDetailsPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/users/:id/edit" element={<UserDetailsPage />} />
                <Route path="/admin/roles" element={<RolesPage />} />
                <Route path="/admin/roles/create" element={<RoleFormPage />} />
                <Route path="/admin/roles/:id/edit" element={<RoleFormPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
