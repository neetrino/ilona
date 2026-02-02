'use client';

import { useState } from 'react';
import { useAuthStore, getDashboardPath } from '../store/auth.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) {
        window.location.href = getDashboardPath(user.role);
      }
    } catch {
      // Error is handled in store
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur">
      <CardHeader className="space-y-1 text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-3xl">🎓</span>
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Ilona English Center
        </CardTitle>
        <CardDescription className="text-slate-500">
          Enter your credentials to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center mb-3">Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setEmail('admin@ilona.edu'); setPassword('admin123'); }}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
            >
              👤 Admin
            </button>
            <button
              type="button"
              onClick={() => { setEmail('teacher@ilona.edu'); setPassword('teacher123'); }}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
            >
              👩‍🏫 Teacher
            </button>
            <button
              type="button"
              onClick={() => { setEmail('student@ilona.edu'); setPassword('student123'); }}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600"
            >
              🎒 Student
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
