import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AdminRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'Admin') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <Outlet />;
};
