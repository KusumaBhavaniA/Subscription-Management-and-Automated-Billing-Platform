import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const CustomerRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'Customer') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};
