import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/Guards';
import Explore from './pages/Explore';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import Rental from './pages/Rental';
import Pay from './pages/Pay';
import Messages from './pages/Messages';
import MyListings from './pages/MyListings';
import ListingForm from './pages/ListingForm';
import Payments from './pages/Payments';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminDispute from './pages/admin/AdminDispute';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminActions from './pages/admin/AdminActions';

const auth = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route index element={<Explore />} />
        <Route path="listing/:id" element={<ListingDetail />} />
        <Route path="u/:id" element={<PublicProfile />} />
        <Route path="verify" element={auth(<Verify />)} />
        <Route path="dashboard" element={auth(<Dashboard />)} />
        <Route path="requests" element={auth(<Requests />)} />
        <Route path="rental/:id" element={auth(<Rental />)} />
        <Route path="rental/:id/pay" element={auth(<Pay />)} />
        <Route path="messages" element={auth(<Messages />)} />
        <Route path="messages/:bookingId" element={auth(<Messages />)} />
        <Route path="my-listings" element={auth(<MyListings />)} />
        <Route path="listings/new" element={auth(<ListingForm />)} />
        <Route path="listings/:id/edit" element={auth(<ListingForm />)} />
        <Route path="payments" element={auth(<Payments />)} />
        <Route path="saved" element={auth(<Saved />)} />
        <Route path="profile" element={auth(<Profile />)} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="disputes/:id" element={<AdminDispute />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="actions" element={<AdminActions />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
