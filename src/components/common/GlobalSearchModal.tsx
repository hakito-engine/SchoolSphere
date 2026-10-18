import React, { useState } from 'react';
import { DataService } from '../../services/dataService';
import { Search, X, Users, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const students = DataService.getStudents();
  const teachers = DataService.getTeachers();
  const modules = DataService.getModules();
  const subjects = DataService.getSubjects();

  const filteredStudents = query
    ? students.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.nisn.includes(query))
    : [];
  const filteredTeachers = query
    ? teachers.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.nip.includes(query))
    : [];
  const filteredModules = query
    ? modules.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()) || m.subjectName.toLowerCase().includes(query.toLowerCase()))
    : [];
  const filteredSubjects = query
    ? subjects.filter((sb) => sb.name.toLowerCase().includes(query.toLowerCase()) || sb.code.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Cari siswa, guru, modul ajar, atau mata pelajaran..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 text-xs space-y-4">
          {!query && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Ketikkan kata kunci pencarian untuk menemukan data seketika...
            </div>
          )}

          {query && (
            <>
              {filteredStudents.length > 0 && (
                <div>
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                    Peserta Didik ({filteredStudents.length})
                  </p>
                  <div className="space-y-1">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onNavigate('students');
                          onClose();
                        }}
                        className="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {s.className} · NISN: {s.nisn}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredTeachers.length > 0 && (
                <div>
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                    Tenaga Pendidik ({filteredTeachers.length})
                  </p>
                  <div className="space-y-1">
                    {filteredTeachers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onNavigate('teachers');
                          onClose();
                        }}
                        className="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {t.subjectNames.join(', ')} · NIP: {t.nip}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredModules.length > 0 && (
                <div>
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                    Modul Pembelajaran ({filteredModules.length})
                  </p>
                  <div className="space-y-1">
                    {filteredModules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onNavigate('modules');
                          onClose();
                        }}
                        className="w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{m.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.subjectName} ({m.className})
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredStudents.length === 0 &&
                filteredTeachers.length === 0 &&
                filteredModules.length === 0 &&
                filteredSubjects.length === 0 && (
                  <div className="py-6 text-center text-slate-400">
                    Tidak ditemukan data yang cocok dengan "{query}".
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
