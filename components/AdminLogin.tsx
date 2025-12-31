import React, { useState, useContext } from 'react';
import { LanguageContext } from '../index';
import { authService } from '../services/supabaseClient';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const langCtx = useContext(LanguageContext);
  const language = langCtx?.language || 'nl';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    nl: {
      title: 'Admin Login',
      subtitle: 'Alleen voor geautoriseerd personeel',
      email: 'E-mailadres',
      password: 'Wachtwoord',
      login: 'Inloggen',
      loggingIn: 'Bezig met inloggen...',
      errorEmpty: 'Vul alle velden in',
      errorInvalid: 'Ongeldige inloggegevens',
      noAccess: 'Geen toegang? Neem contact op met de beheerder.'
    },
    pl: {
      title: 'Panel Admina',
      subtitle: 'Tylko dla upoważnionego personelu',
      email: 'Adres e-mail',
      password: 'Hasło',
      login: 'Zaloguj',
      loggingIn: 'Logowanie...',
      errorEmpty: 'Wypełnij wszystkie pola',
      errorInvalid: 'Nieprawidłowe dane logowania',
      noAccess: 'Brak dostępu? Skontaktuj się z administratorem.'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.nl;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(t.errorEmpty);
      return;
    }

    setIsLoading(true);

    try {
      const { user, error: authError } = await authService.signIn(email, password);
      
      if (authError) {
        setError(authError);
        setIsLoading(false);
        return;
      }

      if (user) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(t.errorInvalid);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-2xl shadow-blue-500/30 mb-4 p-3">
            <img src="/logo.jpeg" alt="Greek Irini" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Greek Irini</h1>
          <p className="text-blue-200/70 text-sm">{t.subtitle}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {t.title}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-blue-200/80 uppercase tracking-wider mb-2">
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                placeholder="admin@greekeirini.nl"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-blue-200/80 uppercase tracking-wider mb-2">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.loggingIn}
                </>
              ) : (
                <>🔐 {t.login}</>
              )}
            </button>
          </form>

          {/* No registration - contact admin */}
          <div className="mt-6 text-center">
            <p className="text-blue-200/40 text-xs">
              {t.noAccess}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200/40 text-xs mt-8">
          © 2025 Greek Irini • Weimarstraat 174, Den Haag
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
