import { motion } from "framer-motion";
import { FiUser } from "react-icons/fi";

interface CardProps {
  name: string;
  photoUrl?: string;
  isActive?: boolean;
}

const CardHairdresser: React.FC<CardProps> = ({ name, photoUrl, isActive }) => {
  return (
    <motion.div
      whileHover={{ boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
      animate={isActive ? { boxShadow: "0 12px 24px rgba(112,66,248,0.25)" } : {}}
      className={`bg-white p-5 rounded-2xl border border-transparent transition cursor-pointer flex items-center gap-4 text-left w-full ${
        isActive ? "bg-gradient-to-r from-purple-50 via-white to-purple-50" : "hover:border-primary/20"
      }`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20 bg-slate-100"
        />
      ) : (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary/20 bg-gradient-to-br from-slate-100 to-slate-200 text-primary flex items-center justify-center">
          <FiUser className="text-xl sm:text-2xl" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base sm:text-lg truncate">{name}</h3>
      </div>
    </motion.div>
  );
};

export default CardHairdresser;
