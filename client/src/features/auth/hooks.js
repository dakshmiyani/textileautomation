import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser, getMe } from './api';
import { useAuth } from '../../hooks/useAuth';

export function useLoginMutation() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser(data.user, data.tokens);
      navigate('/dashboard');
    }
  });
}

export function useLogoutMutation() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      logout();
      navigate('/login');
    }
  });
}

export function useProfileQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: getMe,
    enabled: isAuthenticated
  });
}
