import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={`rounded-2xl p-6 transition-all duration-200 bg-card border border-border text-primaryText shadow-sm ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
