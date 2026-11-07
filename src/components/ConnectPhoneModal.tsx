import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Wifi, Copy, Check, Sparkles } from 'lucide-react';

interface ConnectPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  localIp: string;
}

export const ConnectPhoneModal: React.FC<ConnectPhoneModalProps> = ({
  isOpen,
  onClose,
  localIp,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // If running locally, point to local IP port 5173, or current origin if already on Vercel/web
  const currentOrigin = window.location.origin;
  const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  const phoneUrl = isLocalhost ? `http://${localIp || '192.168.0.179'}:5173` : currentOrigin;

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Otwórz na telefonie</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Zeskanuj aparat telefonu, aby otworzyć aplikację TaskHub i zarządzać zadaniami mobilnie.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center mx-auto w-fit mb-5">
          <QRCodeSVG
            value={phoneUrl}
            size={180}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* URL Box */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 flex items-center justify-between gap-2 mb-5">
          <div className="text-xs font-mono text-indigo-300 truncate select-all">
            {phoneUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Skopiowano</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopiuj</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-start gap-2.5">
            <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Krok 1:</strong> Upewnij się, że telefon jest połączony z <strong>tą samą siecią Wi-Fi</strong> co komputer.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Krok 2 (Jako aplikacja):</strong> Po otwarciu w Safari/Chrome kliknij <strong>„Dodaj do ekranu początkowego”</strong> – TaskHub stanie się prawdziwą apką!
            </span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Gotowe, zamykam
          </button>
        </div>
      </div>
    </div>
  );
};
