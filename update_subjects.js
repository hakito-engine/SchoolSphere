const fs = require('fs');

let code = fs.readFileSync('src/views/SubjectsView.tsx', 'utf8');

// 1. Update student card
const oldStudentCard = `          {studentFiltered.map((sub) => {
            const assignedTeacher = teachers.find(
              (t) =>
                t.assignedClassIds?.includes(studentClass.id) &&
                t.subjectNames?.includes(sub.name)
            ) || teachers.find((t) => t.id === sub.teacherId || t.name === sub.teacherName) || teachers[0];`;

const newStudentCard = `          {studentFiltered.map((sub) => {
            const scheduleItem = classSchedules.find(
              (sc) => sc.subjectId === sub.id || sc.subjectName.toLowerCase() === sub.name.toLowerCase()
            );
            const assignedTeacher =
              (scheduleItem?.teacherId ? teachers.find((t) => t.id === scheduleItem.teacherId) : null) ||
              teachers.find(
                (t) =>
                  t.assignedClassIds?.includes(studentClass.id) &&
                  t.subjectNames?.some((n) => n.toLowerCase() === sub.name.toLowerCase())
              ) ||
              teachers.find((t) => t.id === sub.teacherId || t.name === sub.teacherName) ||
              teachers[0];

            const subCPs = learningObjectives.filter(
              (lo) => lo.subjectId === sub.id || lo.subjectName.toLowerCase() === sub.name.toLowerCase()
            );`;

if (!code.includes(oldStudentCard)) {
  console.error('oldStudentCard not found in SubjectsView.tsx');
  process.exit(1);
}

code = code.replace(oldStudentCard, newStudentCard);

// 2. Add CP preview inside student card
const oldKkmBlock = `                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                      Ambang KKM:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      KKM {sub.kkm}
                    </span>
                  </div>`;

const newKkmBlock = `                  {subCPs.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                        <Target className="w-3.5 h-3.5" />
                        <span>Capaian Pembelajaran (CP & ATP):</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[10px]">
                        {subCPs.map((cp) => cp.tpCode + ': ' + cp.title).join(' · ')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                      Ambang KKM:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      KKM {sub.kkm}
                    </span>
                  </div>`;

code = code.replace(oldKkmBlock, newKkmBlock);

// 3. Tab switcher and CP & ATP section in main return
const oldHeader = `  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Mata Pelajaran & Kriteria Ketuntasan Minimal (KKM)
          </h2>
          <p className="text-xs text-slate-500">
            Daftar kurikulum mata pelajaran, ambang batas ketuntasan (KKM), dan beban jam belajar per minggu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrWakasek && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          )}
        </div>
      </div>`;

const newHeader = `  // Filtered CP & ATP
  const filteredLearningObjectives = learningObjectives.filter((lo) => {
    if (cpSubjectFilter !== 'ALL' && lo.subjectId !== cpSubjectFilter) return false;
    if (cpGradeFilter !== 'ALL' && lo.grade !== cpGradeFilter) return false;
    if (cpSemesterFilter !== 'ALL' && lo.semester !== cpSemesterFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lo.tpCode.toLowerCase().includes(q) ||
        lo.title.toLowerCase().includes(q) ||
        lo.description.toLowerCase().includes(q) ||
        lo.subjectName.toLowerCase().includes(q) ||
        lo.topic.toLowerCase().includes(q) ||
        lo.teacherName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('subjects')}
          className={\`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer \${
            activeTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }\`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Mata Pelajaran & KKM</span>
        </button>
        <button
          onClick={() => setActiveTab('cp_atp')}
          className={\`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer \${
            activeTab === 'cp_atp'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }\`}
        >
          <Target className="w-4 h-4" />
          <span>Capaian Pembelajaran (CP) & ATP (Kurikulum Merdeka)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
            {learningObjectives.length}
          </span>
        </button>
      </div>

      {activeTab === 'subjects' ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Mata Pelajaran & Kriteria Ketuntasan Minimal (KKM)
              </h2>
              <p className="text-xs text-slate-500">
                Daftar kurikulum mata pelajaran, ambang batas ketuntasan (KKM), dan beban jam belajar per minggu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdminOrWakasek && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Mata Pelajaran</span>
                </button>
              )}
            </div>
          </div>`;

if (!code.includes(oldHeader)) {
  console.error('oldHeader not found in SubjectsView.tsx');
  process.exit(1);
}

code = code.replace(oldHeader, newHeader);

// Now wrap subjects content and add the CP & ATP tab content before modal
const oldEndBeforeModal = `      {/* Modal Add/Edit Subject */}`;
const newEndBeforeModal = `        </>
      ) : (
        /* Tab: Capaian Pembelajaran & ATP Kurikulum Merdeka */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Standar BSKAP Kurikulum Merdeka
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Terintegrasi Rapor Akhir
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Pengelolaan Capaian Pembelajaran (CP) & ATP</span>
              </h2>
              <p className="text-xs text-slate-500">
                Dikelola oleh masing-masing Guru Mata Pelajaran. Rumusan CP dan ATP otomatis menjadi dasar deskripsi Capaian Kompetensi (Dikuasai & Perlu Ditingkatkan) pada Rapor Hasil Belajar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddCp}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah CP & ATP Baru</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode TP, judul materi, elemen atau nama guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  value={cpSubjectFilter}
                  onChange={(e) => setCpSubjectFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">Semua Mata Pelajaran</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={cpGradeFilter}
                  onChange={(e) => setCpGradeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">Semua Tingkat / Fase</option>
                  <option value="X">Kelas X (Fase E)</option>
                  <option value="XI">Kelas XI (Fase F)</option>
                  <option value="XII">Kelas XII (Fase F)</option>
                </select>
              </div>
            </div>
          </div>

          {/* List of CP & ATP Cards */}
          {filteredLearningObjectives.length === 0 ? (
            <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Target className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Belum ada Capaian Pembelajaran (CP) / ATP yang cocok dengan filter.
              </p>
              <p className="text-xs text-slate-500">
                Klik tombol "Tambah CP & ATP Baru" di atas untuk menambahkan tujuan pembelajaran.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLearningObjectives.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {item.tpCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {item.phase} · Kelas {item.grade}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Sem. {item.semester} ({item.academicYear})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditCp(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ubah CP/ATP"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCp(item.id, item.tpCode, item.subjectName)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus CP/ATP"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {item.subjectName} · Elemen: {item.topic}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                        Alur Tujuan Pembelajaran (ATP):
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <span>Guru:</span>
                      <strong className="text-slate-700 dark:text-slate-300">{item.teacherName}</strong>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {item.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Add/Edit CP & ATP Kurikulum Merdeka */}
      {isCpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingCp ? 'Ubah Capaian Pembelajaran & ATP' : 'Tambah CP & ATP Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar BSKAP Kurikulum Merdeka Terintegrasi Rapor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCpModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCp} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cpFormData.subjectId || ''}
                  onChange={(e) => {
                    const sub = subjects.find((s) => s.id === e.target.value);
                    setCpFormData({
                      ...cpFormData,
                      subjectId: e.target.value,
                      subjectName: sub ? sub.name : '',
                      grade: (sub?.grade as 'X' | 'XI' | 'XII') || cpFormData.grade || 'X',
                      phase: sub?.grade === 'X' ? 'Fase E' : 'Fase F',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                  required
                >
                  <option value="">Pilih Mata Pelajaran...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} - Tingkat {s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Kode TP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: TP 10.1"
                    value={cpFormData.tpCode || ''}
                    onChange={(e) => setCpFormData({ ...cpFormData, tpCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Tingkat & Fase
                  </label>
                  <select
                    value={cpFormData.grade || 'X'}
                    onChange={(e) => {
                      const gr = e.target.value as 'X' | 'XI' | 'XII';
                      setCpFormData({
                        ...cpFormData,
                        grade: gr,
                        phase: gr === 'X' ? 'Fase E' : 'Fase F',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="X">Kelas X (Fase E)</option>
                    <option value="XI">Kelas XI (Fase F)</option>
                    <option value="XII">Kelas XII (Fase F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Semester
                  </label>
                  <select
                    value={cpFormData.semester || 'Ganjil'}
                    onChange={(e) => setCpFormData({ ...cpFormData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Elemen Kompetensi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bilangan & Aljabar, Menyimak, Mekanika"
                    value={cpFormData.topic || ''}
                    onChange={(e) => setCpFormData({ ...cpFormData, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Lingkup Materi / Topik CP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Eksponen dan Logaritma"
                    value={cpFormData.title || ''}
                    onChange={(e) => setCpFormData({ ...cpFormData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Rumusan Alur Tujuan Pembelajaran (ATP) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan tujuan pembelajaran yang harus dicapai siswa pada materi ini..."
                  value={cpFormData.description || ''}
                  onChange={(e) => setCpFormData({ ...cpFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Materi ini akan digunakan secara otomatis dalam menyusun deskripsi rapor: <em>"Menunjukkan penguasaan dalam memahami [materi dikuasai], namun masih perlu penguasaan mengenai [materi belum dikuasai]."</em>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCpModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-2xs"
                >
                  {editingCp ? 'Simpan Perubahan' : 'Simpan CP & ATP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Subject */}`;

if (!code.includes(oldEndBeforeModal)) {
  console.error('oldEndBeforeModal not found in SubjectsView.tsx');
  process.exit(1);
}

code = code.replace(oldEndBeforeModal, newEndBeforeModal);

fs.writeFileSync('src/views/SubjectsView.tsx', code, 'utf8');
console.log('SubjectsView updated successfully!');
