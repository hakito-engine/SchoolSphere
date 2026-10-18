import React, { useState } from 'react';
import { useAuth, ROLE_DEFINITIONS } from '../../context/AuthContext';
import { Role } from '../../types';
import { Users, Check, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';

export const QuickRoleSwitcher: React.FC = () => {
  const { currentUser, switchUserByRole, roleInfo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const rolesList = (Object.keys(ROLE_DEFINITIONS) as Role[]).filter(
    (r) => r !== 'operator'
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
        title="Ganti Peran Demonstrasi"
      >
        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-medium hidden sm:inline text-slate-500 dark:text-slate-400">Mode:</span>
        <span className="font-bold">{roleInfo.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Beralih Peran Demonstrasi (RBAC)
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                  8 Akun Sintetis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Pilih peran di bawah untuk menguji hak akses, dashboard, dan alur kerja peran tersebut:
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto p-1 space-y-1">
              {rolesList.map((r) => {
                const def = ROLE_DEFINITIONS[r];
                const isSelected = currentUser.role === r;

                return (
                  <button
                    key={r}
                    onClick={() => {
                      switchUserByRole(r);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {def.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-700">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {def.description}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Pengguna Aktif: </span>
              {currentUser.name} ({currentUser.nipOrNisn || currentUser.email})
            </div>
          </div>
        </>
      )}
    </div>
  );
};
