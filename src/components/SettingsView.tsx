import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Cloud,
  RefreshCw,
  Smartphone,
  Copy,
  Check,
  Download,
  Upload,
  ShieldCheck,
  Cpu,
  Database,
  DollarSign,
  Info,
  CheckSquare,
  User,
  StickyNote,
} from 'lucide-react';
import {
  hashPassword,
  verifyPassword,
  saveStoredCredentials,
  backendChangePassword,
  type AuthCredentials,
} from '../lib/auth';
import type { MonthlyCosts } from '../types';

interface SettingsViewProps {
  // Auth & Security
  storedCredentials: AuthCredentials | null;
  onCredentialsUpdated: (newCreds: AuthCredentials) => Promise<void> | void;
  onLockApp: () => void;
  // AI Settings
  apiKey: string;
  onSaveApiKey: (newKey: string) => void;
  // Cloud & Sync
  cloudSynced: boolean;
  isSyncing: boolean;
  onForceSync: () => Promise<void>;
  localIp?: string;
  // Backup & Data
  onExportData: () => void;
  onImportData: () => void;
  tasksCount: number;
  personalCount: number;
  notesCount: number;
  // Finances defaults
  costs: MonthlyCosts;
  onSaveCosts: (newCosts: MonthlyCosts) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  storedCredentials,
  onCredentialsUpdated,
  onLockApp,
  apiKey,
  onSaveApiKey,
  cloudSynced,
  isSyncing,
  onForceSync,
  localIp,
  onExportData,
  onImportData,
  tasksCount,
  personalCount,
  notesCount,
  costs,
  onSaveCosts,
}) => {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // API Key state
  const [inputApiKey, setInputApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Costs state
  const [zusCost, setZusCost] = useState(costs.zus.toString());
  const [taxCost, setTaxCost] = useState(costs.tax.toString());
  const [costsSuccess, setCostsSuccess] = useState(false);

  // Phone QR state
  const [copiedPhoneUrl, setCopiedPhoneUrl] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Mobile URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  const phoneUrl = isLocalhost ? `http://${localIp || '192.168.0.179'}:5173` : currentOrigin;

  // Handle Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (storedCredentials) {
      setIsPasswordLoading(true);
      const isCurrentValid = await verifyPassword(currentPassword, storedCredentials);
      if (!isCurrentValid) {
        setIsPasswordLoading(false);
        setPasswordError('Aktualne hasło jest nieprawidłowe.');
        return;
      }
    }

    if (newPassword.length < 4) {
      setIsPasswordLoading(false);
      setPasswordError('Nowe hasło musi mieć co najmniej 4 znaki.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsPasswordLoading(false);
      setPasswordError('Nowe hasła nie są identyczne.');
      return;
    }

    try {
      setIsPasswordLoading(true);

      // Backend sync if available
      try {
        await backendChangePassword(currentPassword, newPassword);
      } catch (backendErr: any) {
        if (backendErr?.message && !backendErr.message.includes('fetch')) {
          setPasswordError(backendErr.message);
          setIsPasswordLoading(false);
          return;
        }
      }

      // Hash with salt PBKDF2
      const { hash, salt } = await hashPassword(newPassword);
      const newCreds: AuthCredentials = {
        loginHash: storedCredentials?.loginHash,
        hash,
        salt,
        updatedAt: new Date().toISOString(),
      };

      saveStoredCredentials(newCreds);
      await onCredentialsUpdated(newCreds);

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Nie udało się zmienić hasła.');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle Save API Key
  const handleSaveApiKey = () => {
    const trimmed = inputApiKey.trim();
    onSaveApiKey(trimmed);
    localStorage.setItem('openai_api_key', trimmed);
    setApiKeyStatus({
      type: 'success',
      message: 'Klucz API został pomyślnie zapisany!',
    });
    setTimeout(() => setApiKeyStatus({ type: null, message: '' }), 3000);
  };

  // Handle Test API Key
  const handleTestApiKey = async () => {
    const keyToTest = inputApiKey.trim() || apiKey.trim();
    if (!keyToTest) {
      setApiKeyStatus({ type: 'error', message: 'Wprowadź klucz OpenAI API przed testem.' });
      return;
    }

    setIsTestingApiKey(true);
    setApiKeyStatus({ type: null, message: '' });
    const startTime = Date.now();

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyToTest}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });

      const latency = Date.now() - startTime;

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Błąd OpenAI (${resp.status})`);
      }

      setApiKeyStatus({
        type: 'success',
        message: `Połączenie z OpenAI (gpt-4o-mini) aktywne! Czas odpowiedzi: ${latency} ms.`,
      });
    } catch (err: any) {
      setApiKeyStatus({
        type: 'error',
        message: `Błąd połączenia: ${err?.message || 'Nieprawidłowy klucz API.'}`,
      });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  // Handle Save Costs
  const handleSaveCostsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zus = parseFloat(zusCost) || 0;
    const tax = parseFloat(taxCost) || 0;
    onSaveCosts({ zus, tax });
    setCostsSuccess(true);
    setTimeout(() => setCostsSuccess(false), 3000);
  };

  // Handle Force Sync
  const handleTriggerSync = async () => {
    try {
      await onForceSync();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch {}
  };

  const handleCopyPhoneUrl = () => {
    navigator.clipboard.writeText(phoneUrl);
    setCopiedPhoneUrl(true);
    setTimeout(() => setCopiedPhoneUrl(false), 2000);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300 pb-16 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c140e] via-[#150f0b] to-[#0c0907] border border-[#3d2c20]/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#d99b5a]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2a1c12] text-[#d99b5a] border border-[#d99b5a]/30 shadow-inner">
              <Settings className="w-3.5 h-3.5" />
              <span>CENTRUM KONTROLI & USTAWIENIA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5ede4]">
              Ustawienia Panelu JC Studio
            </h1>
            <p className="text-sm text-[#a89687] max-w-2xl leading-relaxed">
              Dostosuj bezpieczeństwo dostępu, klucze API sztucznej inteligencji, synchronizację z telefonem oraz kopie zapasowe swoich projektów.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={onLockApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium bg-[#2a1411] hover:bg-[#381a16] text-[#e07a68] border border-[#52251e] shadow-lg transition-all active:scale-95"
              title="Zablokuj panel natychmiast"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Zablokuj panel</span>
            </button>
          </div>
        </div>

        {/* Status badges bar */}
        <div className="mt-6 pt-5 border-t border-[#2e2117] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#140e0a] border border-[#2e2117] text-[#c4b5a5]">
            <ShieldCheck className="w-4 h-4 text-[#7ec29a]" />
            <span>Hasło: <strong className="text-[#f5ede4]">PBKDF2 (100k)</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#140e0a] border border-[#2e2117] text-[#c4b5a5]">
            <Cloud className={`w-4 h-4 ${cloudSynced ? 'text-[#7ec29a]' : 'text-[#d99b5a]'}`} />
            <span>Chmura: <strong className="text-[#f5ede4]">{cloudSynced ? 'Aktywna na żywo' : 'Lokalna'}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#140e0a] border border-[#2e2117] text-[#c4b5a5]">
            <Cpu className="w-4 h-4 text-[#d99b5a]" />
            <span>Model AI: <strong className="text-[#f5ede4]">OpenAI GPT-4o-mini</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Bezpieczeństwo i Zmiana Hasła */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d99b5a]/10 text-[#d99b5a]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5ede4]">Bezpieczeństwo & Zmiana Hasła</h3>
                <p className="text-[11px] text-[#8c7b6d]">Kryptograficzne hashowanie PBKDF2</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1f1712] text-[#7ec29a] border border-[#7ec29a]/30">
              Aktywne
            </span>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#142318] border border-[#7ec29a]/40 text-[#7ec29a] text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Hasło zostało pomyślnie zmienione i zabezpieczone!</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-2xl bg-[#2b1212] border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">
                Aktualne hasło:
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Wpisz obecne hasło"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-xs text-[#f5ede4] focus:outline-none focus:border-[#d99b5a] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">
                  Nowe hasło:
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 4 znaki"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-xs text-[#f5ede4] focus:outline-none focus:border-[#d99b5a] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">
                  Powtórz nowe hasło:
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz hasło"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-xs text-[#f5ede4] focus:outline-none focus:border-[#d99b5a] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-[11px] text-[#8c7b6d] hover:text-[#f5ede4] flex items-center gap-1.5 transition-colors"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Ukryj znaki' : 'Pokaż znaki hasła'}</span>
              </button>

              <button
                type="submit"
                disabled={isPasswordLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#d99b5a] hover:bg-[#e2aa6e] text-[#120e0a] transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isPasswordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Zapisz nowe hasło</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: Klucz OpenAI API & Asystent AI */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d99b5a]/10 text-[#d99b5a]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5ede4]">Sztuczna Inteligencja & OpenAI</h3>
                <p className="text-[11px] text-[#8c7b6d]">Asystent głosowy, szkice ofert i parsowanie</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1f1712] text-[#d99b5a] border border-[#d99b5a]/30">
              gpt-4o-mini
            </span>
          </div>

          {apiKeyStatus.message && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
                apiKeyStatus.type === 'success'
                  ? 'bg-[#142318] border border-[#7ec29a]/40 text-[#7ec29a]'
                  : 'bg-[#2b1212] border border-red-500/40 text-red-300'
              }`}
            >
              {apiKeyStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{apiKeyStatus.message}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">
                Twój klucz OpenAI API:
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-xs font-mono text-[#f5ede4] focus:outline-none focus:border-[#d99b5a] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7b6d] hover:text-[#f5ede4] transition-colors"
                  title={showApiKey ? 'Ukryj klucz' : 'Pokaż klucz'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#7a6b5e] leading-relaxed">
              Klucz jest bezpiecznie przechowywany w lokalnej pamięci Twojego urządzenia i służy do obsługi asystenta oraz ofert. Koszt zapytań jest minimalny (ułamki grosza).
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={isTestingApiKey}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#251b14] hover:bg-[#33241b] text-[#d99b5a] border border-[#3d2c20] transition-colors active:scale-95 disabled:opacity-50"
              >
                {isTestingApiKey ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Testuj połączenie</span>
              </button>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#d99b5a] hover:bg-[#e2aa6e] text-[#120e0a] transition-all shadow-md active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Zapisz klucz</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: Synchronizacja Chmury & Telefon QR */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#7ec29a]/10 text-[#7ec29a]">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5ede4]">Chmura & Synchronizacja z Telefonem</h3>
                <p className="text-[11px] text-[#8c7b6d]">Baza Supabase w czasie rzeczywistym</p>
              </div>
            </div>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-[#1a130e] hover:bg-[#251b14] text-[#7ec29a] border border-[#7ec29a]/30 transition-colors"
              title="Wymuś synchronizację z bazą"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Zapisywanie...' : 'Wymuś sync'}</span>
            </button>
          </div>

          {syncSuccess && (
            <div className="p-3 rounded-xl bg-[#142318] border border-[#7ec29a]/40 text-[#7ec29a] text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Stan bazy został pomyślnie zsynchronizowany z chmurą!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-2xl shadow-xl shrink-0">
              <QRCodeSVG value={phoneUrl} size={110} level="M" />
            </div>

            <div className="space-y-2.5 text-xs flex-1">
              <div className="font-semibold text-[#f5ede4] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#d99b5a]" />
                <span>Otwórz TaskHub na telefonie</span>
              </div>
              <p className="text-[11px] text-[#9e8f82] leading-relaxed">
                Zeskanuj powyższy kod QR aparatem w telefonie. Zmiany wprowadzone na telefonie pojawiają się na komputerze w ułamku sekundy.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPhoneUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium bg-[#251b14] hover:bg-[#302319] text-[#f5ede4] border border-[#3d2c20] transition-colors"
                >
                  {copiedPhoneUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Skopiowano adres!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj link do panelu</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Kopia Zapasowa & Zarządzanie Danymi */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d99b5a]/10 text-[#d99b5a]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5ede4]">Kopia Zapasowa & Pamięć</h3>
                <p className="text-[11px] text-[#8c7b6d]">Eksport i import stanu aplikacji w formacie JSON</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
              <span className="text-[10px] font-mono uppercase text-[#8c7b6d] flex items-center justify-center gap-1 mb-0.5">
                <CheckSquare className="w-3 h-3 text-[#d99b5a]" />
                Zlecenia
              </span>
              <span className="text-lg font-bold text-[#f5ede4] font-mono">{tasksCount}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
              <span className="text-[10px] font-mono uppercase text-[#8c7b6d] flex items-center justify-center gap-1 mb-0.5">
                <User className="w-3 h-3 text-[#7ec29a]" />
                Osobiste
              </span>
              <span className="text-lg font-bold text-[#7ec29a] font-mono">{personalCount}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#140f0c] border border-[#2e231c]">
              <span className="text-[10px] font-mono uppercase text-[#8c7b6d] flex items-center justify-center gap-1 mb-0.5">
                <StickyNote className="w-3 h-3 text-[#f59e0b]" />
                Notatki
              </span>
              <span className="text-lg font-bold text-[#d99b5a] font-mono">{notesCount}</span>
            </div>
          </div>

          <p className="text-[11px] text-[#8c7b6d] leading-relaxed">
            Pobierz pełną kopię bazy (zadania, koszty, notatki, portfolio) na swój dysk lub wgraj z pliku, aby odzyskać stan na nowym urządzeniu.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={onExportData}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#251b14] hover:bg-[#302319] text-[#f5ede4] border border-[#3d2c20] transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#d99b5a]" />
              <span>Pobierz kopię (JSON)</span>
            </button>

            <button
              onClick={onImportData}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#251b14] hover:bg-[#302319] text-[#f5ede4] border border-[#3d2c20] transition-all active:scale-95 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-[#7ec29a]" />
              <span>Wgraj kopię z pliku</span>
            </button>
          </div>
        </div>

        {/* CARD 5: Domyślne Koszty & Finanse */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#7ec29a]/10 text-[#7ec29a]">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5ede4]">Domyślne Koszty Miesięczne</h3>
                <p className="text-[11px] text-[#8c7b6d]">Stałe składki do automatycznych kalkulacji zysku</p>
              </div>
            </div>
          </div>

          {costsSuccess && (
            <div className="p-3 rounded-xl bg-[#142318] border border-[#7ec29a]/40 text-[#7ec29a] text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Zaktualizowano domyślne koszty stałe!</span>
            </div>
          )}

          <form onSubmit={handleSaveCostsSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">
                  Składka ZUS (zł / msc):
                </label>
                <input
                  type="number"
                  value={zusCost}
                  onChange={(e) => setZusCost(e.target.value)}
                  placeholder="np. 1600"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-xs text-[#f5ede4] focus:outline-none focus:border-[#7ec29a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8c7b6d] uppercase mb-1">
                  Zaliczka na podatek (zł / msc):
                </label>
                <input
                  type="number"
                  value={taxCost}
                  onChange={(e) => setTaxCost(e.target.value)}
                  placeholder="np. 0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140f0c] border border-[#2e231c] text-xs text-[#f5ede4] focus:outline-none focus:border-[#7ec29a]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2a1d14] hover:bg-[#382619] text-[#7ec29a] border border-[#7ec29a]/30 transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Zapisz koszty</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 6: Informacje o aplikacji & Architektura */}
        <div className="glass-panel border border-[#2b211a] rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e231c]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d99b5a]/10 text-[#d99b5a]">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5ede4]">O Aplikacji JC Studio</h3>
                <p className="text-[11px] text-[#8c7b6d]">Specyfikacja techniczna i bezpieczeństwo</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#a89687]">v2.5</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#9e8f82] leading-relaxed">
            <div className="flex items-center justify-between py-1 border-b border-[#221710]">
              <span>Architektura:</span>
              <strong className="text-[#f5ede4]">Offline-First PWA + Supabase Realtime</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#221710]">
              <span>Kryptografia dostępu:</span>
              <strong className="text-[#f5ede4]">PBKDF2-SHA256 (100 000 rund)</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#221710]">
              <span>Prywatność danych:</span>
              <strong className="text-[#7ec29a]">Brak śledzenia i reklam</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Hosting:</span>
              <strong className="text-[#f5ede4]">Vercel Edge Network (Polska/Frankfurt)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
