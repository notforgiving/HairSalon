import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProfileUser from "../pages/ProfileUser";
import ProfileSpecialist from "../pages/ProfileSpecialist";
import Admin from "../pages/Admin";
import NotFound from "../pages/NotFound";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "../components/FullScreenLoader";

const AppRouter = () => {
  const { user, loading, role } = useAuth();

  if (loading) return <FullScreenLoader />;

  const RequireRole = ({ allowedRoles, children }: { allowedRoles: string[]; children: JSX.Element }) => {
    if (!user) return <Navigate to="/login" />;
    if (!allowedRoles.includes(role!)) return <Navigate to="/" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

        <Route
          path="/profile"
          element={
            <RequireRole allowedRoles={["user"]}>
              <ProfileUser />
            </RequireRole>
          }
        />

        <Route
          path="/specialist"
          element={
            <RequireRole allowedRoles={["specialist"]}>
              <ProfileSpecialist />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole allowedRoles={["admin"]}>
              <Admin />
            </RequireRole>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
