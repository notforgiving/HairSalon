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
<nav className="bg-gradient-to-r from-primary to-secondary text-white shadow-soft px-4 py-3 flex flex-wrap gap-3 sm:flex-nowrap sm:gap-6 justify-between items-center">
  <Link to="/" className="font-bold text-2xl tracking-wide hover:opacity-80 transition">
    HairSalon
  </Link>
  <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 items-center justify-end text-sm sm:text-base">
    {user ? (
      <>
        <span className="font-medium truncate max-w-[140px] sm:max-w-[180px]">
          {user.displayName || user.email}
        </span>
        <Link to={role === "specialist" ? "/specialist" : "/profile"} className="hover:underline transition">
          Профиль
        </Link>
        {role === "admin" && (
          <Link to="/admin" className="hover:underline transition">
            Админка
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="bg-white text-primary px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition shadow hover:shadow-hover whitespace-nowrap"
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
