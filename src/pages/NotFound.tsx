import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-4">Страница не найдена</p>
      <Link to="/" className="text-blue-500 underline">Вернуться на главную</Link>
    </div>
  );
};

export default NotFound;
