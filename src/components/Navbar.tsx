import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../services/firebase";

const Navbar: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
<nav className="bg-gradient-to-r from-primary to-secondary text-white shadow-soft p-4 flex justify-between items-center">
  <Link to="/" className="font-bold text-2xl tracking-wide hover:opacity-80 transition">
    HairSalon
  </Link>
  <div className="flex gap-4 items-center">
    {user ? (
      <>
        <span className="font-medium">{user.displayName}</span>
        <Link to={role === "specialist" ? "/specialist" : "/profile"} className="hover:underline transition">
          Профиль
        </Link>
        {role === "admin" && <Link to="/admin" className="hover:underline transition">Админка</Link>}
        <button
          onClick={handleLogout}
          className="bg-white text-primary px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition shadow hover:shadow-hover"
        >
          Выйти
        </button>
      </>
    ) : (
      <>
        <Link to="/login" className="font-medium hover:underline transition">Войти</Link>
        <Link to="/register" className="font-medium hover:underline transition">Регистрация</Link>
      </>
    )}
  </div>
</nav>

  );
};

export default Navbar;
