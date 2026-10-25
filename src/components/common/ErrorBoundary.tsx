import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SISPAM Uncaught Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    if (window.confirm('Reset data lokal aplikasi? Pengaturan dan simulasi data akan dikembalikan ke kondisi awal (default).')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Gagal membersihkan storage:', e);
      }
      window.location.href = window.location.pathname;
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  SISPAM Recovery Mode
                </h1>
                <p className="text-xs text-slate-400">
                  Aplikasi mengalami kendala saat memproses tampilan (Cegah Layar Putih)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-48 mb-6">
              <div className="font-bold text-rose-400 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Terjadi kesalahan tidak terduga'}
              </div>
              {this.state.error?.stack && (
                <div className="text-[11px] text-slate-500 whitespace-pre-wrap">
                  {this.state.error.stack.slice(0, 350)}...
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Reset Cache Lokal</span>
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = './'; }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ke Beranda</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 text-center">
              SISPAM PRO · Sistem Pemulihan Otomatis Hakito Engine
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
