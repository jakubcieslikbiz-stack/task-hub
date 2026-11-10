import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  hashPassword,
  verifyPassword,
  saveStoredCredentials,
  type AuthCredentials,
} from '../lib/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  storedCredentials: AuthCredentials | null;
  onCredentialsUpdated: (newCreds: AuthCredentials) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  storedCredentials,
  onCredentialsUpdated,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (storedCredentials) {
      setIsLoading(true);
      const isCurrentValid = await verifyPassword(currentPassword, storedCredentials);
      if (!isCurrentValid) {
        setIsLoading(false);
        setError('Aktualne hasło jest nieprawidłowe.');
        return;
      }
    }

    if (newPassword.length < 4) {
      setIsLoading(false);
      setError('Nowe hasło musi mieć co najmniej 4 znaki.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      setError('Nowe hasła nie są identyczne.');
      return;
    }

    try {
      setIsLoading(true);
      const { hash, salt } = await hashPassword(newPassword);
      const newCreds: AuthCredentials = {
        hash,
        salt,
        updatedAt: new Date().toISOString(),
      };

      saveStoredCredentials(newCreds);
      onCredentialsUpdated(newCreds);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Błąd podczas zmiany hasła.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md glass-panel border border-[#3d2f24] rounded-3xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2e231c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#251b14] border border-[#3d2c20] flex items-center justify-center text-[#d99b5a]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[#f5ede4]">Zmień hasło dostępu</h2>
              <span className="text-[11px] text-[#9e8f82]">Bezpieczne haszowanie PBKDF2</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9e8f82] hover:text-[#f5ede4] hover:bg-[#251b14] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#7ec29a] mx-auto animate-bounce" />
            <h3 className="text-sm font-semibold text-[#f5ede4]">Hasło zostało zmienione!</h3>
            <p className="text-xs text-[#9e8f82]">Nowy skrót kryptograficzny został zapisany.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-4 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-[#2a1411] border border-[#52231c] flex items-center gap-2 text-xs text-[#f19b8c]">
                <AlertCircle className="w-4 h-4 text-[#e07a68] flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {storedCredentials && (
              <div>
                <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                  Aktualne hasło
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Wpisz dotychczasowe hasło..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                Nowe hasło
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Wpisz nowe hasło (min. 4 znaki)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#9e8f82] mb-1">
                Powtórz nowe hasło
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Powtórz nowe hasło..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#9e8f82]">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-1.5 hover:text-[#f5ede4] transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Ukryj hasła' : 'Pokaż hasła'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#2e231c] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs text-[#9e8f82] hover:text-[#f5ede4] transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-full bg-[#f5ede4] hover:bg-white text-[#120e0a] text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Zapisywanie...
                  </span>
                ) : (
                  'Zapisz nowe hasło'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
