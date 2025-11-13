import React from "react";
import { motion } from "framer-motion";

const shimmerVariants = {
  initial: { x: "-150%" },
  animate: {
    x: "150%",
    transition: { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
  }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.9, 1, 0.9],
    transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
  }
};

const dotsVariants = {
  animate: {
    opacity: [0.2, 1, 0.2],
    y: [0, -4, 0],
    transition: { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
  }
};

const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1f143d] via-[#331d5d] to-[#562387] text-white overflow-hidden">
      <motion.div
        className="absolute w-[160%] h-[160%] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        style={{ rotate: "-25deg" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        <motion.div
          className="w-28 h-28 rounded-[36px] bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-2xl"
          variants={pulseVariants}
          animate="animate"
        >
          <motion.span
            className="text-4xl font-semibold"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
          >
            ✂️
          </motion.span>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">HairSalon</h1>
          <p className="text-sm sm:text-base text-white/70 max-w-sm">
            Настраиваем зеркала, распутываем расписание и прогреваем фен…
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm sm:text-base text-white/70">
          <motion.span
            variants={dotsVariants}
            animate="animate"
            transition={{ delay: 0 }}
          >
            ●
          </motion.span>
          <motion.span
            variants={dotsVariants}
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            ●
          </motion.span>
          <motion.span
            variants={dotsVariants}
            animate="animate"
            transition={{ delay: 0.4 }}
          >
            ●
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
