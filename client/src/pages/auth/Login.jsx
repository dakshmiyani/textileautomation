import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginSchema } from '../../features/auth/schemas';
import { useLoginMutation } from '../../features/auth/hooks';

export default function Login() {
  const { mutate: login, isPending, error } = useLoginMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@textileerp.com',
      password: 'Admin@123'
    }
  });

  const onSubmit = (values) => {
    login(values);
  };

  const fillAdmin = () => {
    setValue('email', 'admin@textileerp.com');
    setValue('password', 'Admin@123');
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-600/30">
          T
        </div>
        <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">Textile ERP</h2>
        <p className="text-xs text-slate-500 mt-1">Enterprise Yarn Production & Operations Portal</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>{error.message || 'Invalid email or password'}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="admin@textileerp.com"
              {...register('email')}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
            />
          </div>
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all"
            />
          </div>
          {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>{isPending ? 'Authenticating...' : 'Sign In to ERP Portal'}</span>
        </button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Default Admin Login:
          </span>
          <button
            type="button"
            onClick={fillAdmin}
            className="text-teal-700 font-bold hover:underline"
          >
            Auto-fill
          </button>
        </div>
        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-700 flex justify-between">
          <span>admin@textileerp.com</span>
          <span className="text-slate-400 font-sans">/</span>
          <span>Admin@123</span>
        </div>
      </div>
    </div>
  );
}
