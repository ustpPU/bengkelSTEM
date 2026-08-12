const NAMA_TAB = Object.freeze({
  SEKOLAH: 'Senarai Sekolah',
  PENDAFTARAN: 'Pendaftaran',
  LAPORAN: 'Laporan',
  BAHAN: 'Bahan'
});

// Google Sheet rasmi program. Penggunaan openById memastikan Web App sentiasa
// membuka fail yang betul walaupun skrip dijalankan melalui URL /exec.
const SPREADSHEET_ID = '1-eIZHm4SF-XfKV9NQNwGX6DaM9KSJm0B-CZVdqyqXdI';

// Dua sekolah ini kekal tersedia walaupun belum dimasukkan atau tersalah eja
// dalam tab "Senarai Sekolah".
const SEKOLAH_TAMBAHAN = Object.freeze([
  { name: 'SK Taman Dato Harun (Satu)', code: 'BBA8210', category: 'SK', status: 'Aktif' },
  { name: 'SK Taman Dato Harun (2)', code: 'BBA8101', category: 'SK', status: 'Aktif' }
]);

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();

    if (action === 'ping') return responsJson_({ ok: true, message: 'Sambungan Google Sheets aktif.', time: new Date() });
    if (action === 'dashboard') return responsJson_({ ok: true, dashboard: dapatkanDashboard_() });
    if (action === 'schools') return responsJson_({ ok: true, schools: dapatkanSekolah_() });
    if (action === 'participants') return responsJson_({ ok: true, participants: dapatkanPeserta_() });
    if (action === 'materials') return responsJson_({ ok: true, materials: dapatkanBahan_() });

    return responsJson_({ ok: false, message: 'Tindakan GET tidak dikenali.' });
  } catch (error) {
    return responsRalat_(error);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(data.action || '').toLowerCase();

    if (action === 'register') return responsJson_(simpanPendaftaran_(data));
    if (action === 'report') return responsJson_(simpanLaporan_(data));

    return responsJson_({ ok: false, message: 'Tindakan POST tidak dikenali.' });
  } catch (error) {
    return responsRalat_(error);
  }
}

function dapatkanDashboard_() {
  const peserta = dapatkanPeserta_().filter(p =>
    p.role === 'Ketua Panitia Sains' || p.role === 'Ketua Panitia Matematik'
  );

  const sains = peserta.filter(p => p.role === 'Ketua Panitia Sains');
  const matematik = peserta.filter(p => p.role === 'Ketua Panitia Matematik');
  const sekolah = [...new Set(peserta.map(p => p.school).filter(Boolean))];
  const laporan = dataTab_(NAMA_TAB.LAPORAN).length;

  return {
    registered: peserta.length,
    reports: laporan,
    scienceRegistered: sains.length,
    mathRegistered: matematik.length,
    uniqueSchools: sekolah.length
  };
}

function dapatkanPeserta_() {
  return dataTab_(NAMA_TAB.PENDAFTARAN).map(row => ({
    id: teks_(row[0]),
    name: teks_(row[2]),
    email: teks_(row[4]),
    phone: teks_(row[5]),
    school: teks_(row[6]),
    schoolCode: teks_(row[7]),
    role: teks_(row[8]),
    day: teks_(row[9]),
    status: teks_(row[10])
  })).filter(p => p.id && p.name);
}

function dapatkanSekolah_() {
  const daripadaSheet = dataTab_(NAMA_TAB.SEKOLAH)
    .map(row => ({
      name: teks_(row[0]),
      code: teks_(row[1]).toUpperCase(),
      category: teks_(row[2]),
      status: teks_(row[3])
    }))
    .filter(item => item.name && item.code && (!item.status || item.status.toLowerCase() === 'aktif'));

  const mengikutKod = new Map();
  [...daripadaSheet, ...SEKOLAH_TAMBAHAN].forEach(item => {
    const code = teks_(item.code).toUpperCase();
    if (code) mengikutKod.set(code, { ...item, code: code });
  });

  return [...mengikutKod.values()].sort((a, b) => a.name.localeCompare(b.name, 'ms'));
}

function dapatkanBahan_() {
  const tones = ['purple', 'blue', 'green', 'orange'];

  return dataTab_(NAMA_TAB.BAHAN)
    .map((row, index) => {
      const status = teks_(row[6]);
      const susunan = Number(row[5]);

      return {
        id: teks_(row[0]) || `B-${index + 1}`,
        title: teks_(row[1]),
        category: teks_(row[2]) || 'Bahan',
        description: teks_(row[3]),
        url: teks_(row[4]),
        order: Number.isFinite(susunan) && susunan > 0 ? susunan : 999 + index,
        status: status,
        tone: tones[index % tones.length]
      };
    })
    .filter(item => item.title && (!item.status || item.status.toLowerCase() === 'aktif'))
    .sort((a, b) => a.order - b.order);
}

function simpanPendaftaran_(data) {
  const name = wajib_(data.name, 'Nama penuh');
  const ic = wajib_(data.ic, 'Nombor kad pengenalan').replace(/\D/g, '');
  const email = wajib_(data.email, 'Emel DELIMa');
  const phone = wajib_(data.phone, 'Nombor telefon');
  const pilihanSekolah = wajib_(data.school, 'Nama sekolah');
  const sekolahAntarabangsa = pilihanSekolah === 'SEKOLAH ANTARABANGSA / LAIN-LAIN';
  let school;
  let schoolCode;

  if (sekolahAntarabangsa) {
    school = wajib_(data.otherSchool, 'Nama sekolah antarabangsa / institusi');
    schoolCode = teks_(data.schoolCode).toUpperCase() || 'TIADA';
  } else {
    schoolCode = wajib_(data.schoolCode, 'Kod sekolah').toUpperCase();
    const rekodSekolah = dapatkanSekolah_().find(item => item.code === schoolCode);
    if (!rekodSekolah) {
      throw new Error('Kod sekolah tidak ditemui. Sila semak kod atau pilih Sekolah Antarabangsa / Lain-lain.');
    }
    school = rekodSekolah.name;
  }
  const role = wajib_(data.role, 'Jawatan / panitia');

  if (ic.length !== 12) throw new Error('Nombor kad pengenalan mestilah 12 digit.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format emel tidak sah.');
  if (!['Ketua Panitia Sains', 'Ketua Panitia Matematik', 'Fasilitator / Urus Setia'].includes(role)) {
    throw new Error('Jawatan / panitia tidak sah.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = tab_(NAMA_TAB.PENDAFTARAN);
    const rows = dataTab_(NAMA_TAB.PENDAFTARAN);
    const sediaAda = rows.find(row => String(row[3] || '').replace(/\D/g, '') === ic);

    if (sediaAda) {
      return { ok: false, message: 'Nombor kad pengenalan ini telah didaftarkan.' };
    }

    const hari = role === 'Ketua Panitia Sains'
      ? 'Sains'
      : role === 'Ketua Panitia Matematik'
        ? 'Matematik'
        : 'Urus Setia';

    const id = idBaru_('P');
    sheet.appendRow([
      id,
      new Date(),
      name,
      ic,
      email,
      phone,
      school,
      schoolCode,
      role,
      hari,
      'Hadir'
    ]);

    return { ok: true, id: id, message: 'Pendaftaran berjaya direkodkan.' };
  } finally {
    lock.releaseLock();
  }
}

function simpanLaporan_(data) {
  const participantId = wajib_(data.participantId, 'Nama peserta');
  const day = wajib_(data.day, 'Hari bengkel');
  const summary = wajib_(data.summary, 'Ringkasan pelaksanaan');
  const impact = wajib_(data.impact, 'Impak / hasil');
  const evidence = wajib_(data.evidence, 'Pautan evidens');

  const peserta = dapatkanPeserta_().find(p => p.id === participantId);
  if (!peserta) throw new Error('Nama peserta tidak ditemui dalam rekod pendaftaran.');

  const laporanSediaAda = dataTab_(NAMA_TAB.LAPORAN).find(row =>
    teks_(row[2]) === participantId && teks_(row[3]).toLowerCase() === day.toLowerCase()
  );

  if (laporanSediaAda) {
    return { ok: false, message: 'Laporan peserta untuk hari ini telah dihantar.' };
  }

  const id = idBaru_('L');
  tab_(NAMA_TAB.LAPORAN).appendRow([
    id,
    new Date(),
    participantId,
    day,
    peserta.name,
    peserta.school,
    summary,
    impact,
    evidence,
    'Diterima'
  ]);

  return { ok: true, id: id, message: 'Laporan berjaya dihantar.' };
}

function dataTab_(nama) {
  const sheet = tab_(nama);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
}

function tab_(nama) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nama);
  if (!sheet) throw new Error(`Tab "${nama}" tidak ditemui.`);
  return sheet;
}

function wajib_(value, label) {
  const text = teks_(value);
  if (!text) throw new Error(`${label} perlu diisi.`);
  return text;
}

function teks_(value) {
  return value == null ? '' : String(value).trim();
}

function idBaru_(prefix) {
  return `${prefix}-${Utilities.getUuid().split('-')[0].toUpperCase()}`;
}

function responsJson_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function responsRalat_(error) {
  console.error(error);
  return responsJson_({
    ok: false,
    message: error && error.message ? error.message : 'Ralat tidak diketahui.'
  });
}
