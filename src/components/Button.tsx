import React from "react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-soft hover:shadow-hover transition ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);

export default Button;
