import { FormEvent, useEffect, useMemo, useState } from "react";
import "./globals.css";
import "./integration.css";

const SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwCCTa2fH6Hmop55liLw6f3P6qURGi6fPKmbz89BSGK_rxjOq0DIaPNLo6aA-_X4Tw/exec";

async function getSheetsData(action: string) {
  const response = await fetch(`${SHEETS_ENDPOINT}?action=${encodeURIComponent(action)}`, {
    cache: "no-store",
    redirect: "follow",
  });
  if (!response.ok) throw new Error("Google Sheets tidak dapat dihubungi.");
  return response.json();
}

type View = "dashboard" | "register" | "attendance" | "report" | "materials";

const schools = [
  "SMK Sri Permata", "SMK Taman Dato' Harun", "SMK Damansara Jaya",
  "SMK Damansara Utama", "SMK Taman Medan", "SMK Kelana Jaya",
  "SMK Sri Utama", "SMK Bandar Utama", "SMK Seksyen 10 Kota Damansara", "SMK Tropicana",
  "SMK Bandar Sri Damansara 2", "SMK Bandar Utama Damansara 3",
  "SMK Bandar Utama Damansara 4", "SMK Damansara Damai 1",
  "SMK Seksyen 4 Kota Damansara", "SMK Bandar Utama Damansara 2",
  "SMK Bandar Sri Damansara 1", "SMK Lembah Subang",
  "SMK Seksyen 8 Kota Damansara", "SMK Assunta", "SMK (L) Bukit Bintang",
  "SMK Katholik (M)", "SMK La Salle, PJ", "SMK (P) Sri Aman", "SMK Taman SEA",
  "SMK Sultan Abdul Samad", "SMK (P) Taman Petaling", "SK Taman Megah",
  "SK Petaling Jaya", "SK Bukit Lanjan", "SK Damansara Utama", "SK Sri Damai",
  "SK Kelana Jaya (1)", "SK Kelana Jaya (2)", "SK Taman SEA",
  "SK Damansara Jaya (1)", "SK Damansara Jaya (2)", "SK Taman Medan",
  "SK Sri Kelana", "SK Seksyen 7 Kota Damansara", "SK Bandar Baru Sri Damansara",
  "SK Bandar Utama Damansara", "SK Bandar Utama Damansara 2",
  "SK Seksyen 6 Kota Damansara", "SK Bandar Baru Sri Damansara 2",
  "SK Bandar Sri Damansara 3", "SK Bandar Utama Damansara (4)", "SK Tropicana",
  "SK Bandar Sri Damansara 1", "SK Seksyen 9 Kota Damansara", "SK Damansara Damai 1",
  "SK Lembah Subang", "SK Seksyen 11 Kota Damansara", "SK Damansara Damai 2",
  "SK (2) Assunta", "SK (L) Bukit Bintang (1)", "SK Kampung Tunku", "SK La Salle, PJ",
  "SK Methodist, PJ", "SK (1) Petaling Jaya", "SK (2) Petaling Jaya",
  "SK Jalan Selangor (Satu)", "SK (2) Jalan Selangor", "SK Satu Sultan Alam Shah",
  "SK (2) Sultan Alam Shah", "SK Sri Petaling", "SK Sungei Way", "SJK(C) Chen Moh",
  "SJK(C) Damansara", "SJK(C) Sungai Way", "SJK(C) Sungai Buloh", "SJK(C) Yuk Chai",
  "SJK(C) Yuk Chyun", "SJK(C) Puay Chai", "SJK(C) Puay Chai 2", "SJK(C) Desa Jaya 2",
  "SJK(C) Chung Hwa Damansara", "SJK(T) Effingham", "SJK(T) RRI Sungai Buloh",
  "SJK(T) Vivekananda", "SJK(T) Seaport", "SJK(T) PJS 1"
].sort();

type DashboardData = { registered:number; attendance:number; reports:number; scienceRegistered:number; mathRegistered:number; scienceAttendance:number; mathAttendance:number; uniqueSchools:number };
type Participant = { id:string; name:string; school:string; role:string; day:string };

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10",
    qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM18 14h3",
    file: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8",
    book: "M4 4h6a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4zM20 4h-6a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h6z",
    link: "M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2",
    pin: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Dashboard({ go }: { go: (view: View) => void }) {
  const [data, setData] = useState<DashboardData>({registered:0,attendance:0,reports:0,scienceRegistered:0,mathRegistered:0,scienceAttendance:0,mathAttendance:0,uniqueSchools:0});
  const [connected, setConnected] = useState(false);
  useEffect(() => { getSheetsData("dashboard").then(r => { if (r.ok && r.dashboard) { setData(r.dashboard); setConnected(true); } }).catch(() => {}); }, []);
  const stats = [
    { label: "Sasaran peserta", value: "140", note: "70 peserta × 2 hari", tone: "purple" },
    { label: "Telah mendaftar", value: String(data.registered), note: `${data.uniqueSchools} sekolah`, tone: "blue" },
    { label: "Kehadiran", value: `${Math.round((data.attendance / 140) * 100)}%`, note: `${data.attendance} rekod disahkan`, tone: "green" },
    { label: "Laporan diterima", value: String(data.reports), note: "Daripada 140 sasaran", tone: "orange" },
  ];
  return <>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">PPD Petaling Utama · Tahun 2026</span>
        <h1>Bengkel Latihan Berbantu<br/><em>Kecerdasan Buatan (AI)</em></h1>
        <p>Pemerkasaan guru STEM melalui aplikasi AI dalam pengajaran dan pembelajaran.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => go("register")}>Daftar sebagai peserta <span>→</span></button>
          <button className="secondary" onClick={() => go("attendance")}><Icon name="qr"/> Rekod kehadiran</button>
        </div>
      </div>
      <div className="event-card">
        <div className="event-top"><span className="live-dot"/> Maklumat rasmi bengkel</div>
        <div className="event-row"><div className="event-icon purple"><Icon name="clock"/></div><div><small>RABU · 12 OGOS 2026</small><b>Ketua Panitia Sains</b><span>9.00 pagi – 4.30 petang</span></div></div>
        <div className="event-row"><div className="event-icon blue"><Icon name="clock"/></div><div><small>KHAMIS · 13 OGOS 2026</small><b>Ketua Panitia Matematik</b><span>9.00 pagi – 4.30 petang</span></div></div>
        <div className="event-row location"><div className="event-icon orange"><Icon name="pin"/></div><div><small>LOKASI</small><b>Dewan Sekolah Rendah Sri KDU</b><span>Kota Damansara</span></div></div>
      </div>
    </section>

    <section className="content">
      <div className="section-heading"><div><span className="kicker">RINGKASAN SEMASA</span><h2>Prestasi pelaksanaan</h2></div><span className={`sync ${connected ? "connected" : ""}`}><i/> {connected ? "Diselaraskan dengan Google Sheets" : "Menunggu sambungan Google Sheets"}</span></div>
      <div className="stats">{stats.map((s) => <article className={`stat ${s.tone}`} key={s.label}><span>{s.label}</span><strong>{s.value}</strong><small>{s.note}</small><div className="stat-line"/></article>)}</div>

      <div className="dashboard-grid">
        <article className="panel progress-panel">
          <div className="panel-title"><div><span className="kicker">KEMAJUAN</span><h3>Pendaftaran mengikut hari</h3></div><span className="pill">Sasaran 70 / hari</span></div>
          <div className="day-progress"><div className="day-label"><div><i className="science"/><b>Ketua Panitia Sains</b></div><strong>{data.scienceRegistered} <span>/ 70</span></strong></div><div className="bar"><i className="science-bar" style={{width:`${Math.min(100,data.scienceRegistered/70*100)}%`}}/></div><small>12 Ogos 2026 · {data.scienceAttendance} hadir</small></div>
          <div className="day-progress"><div className="day-label"><div><i className="math"/><b>Ketua Panitia Matematik</b></div><strong>{data.mathRegistered} <span>/ 70</span></strong></div><div className="bar"><i className="math-bar" style={{width:`${Math.min(100,data.mathRegistered/70*100)}%`}}/></div><small>13 Ogos 2026 · {data.mathAttendance} hadir</small></div>
        </article>
        <article className="panel quick-panel">
          <div className="panel-title"><div><span className="kicker">TINDAKAN PANTAS</span><h3>Urus bengkel</h3></div></div>
          <button onClick={() => go("register")}><span className="quick-icon purple"><Icon name="user"/></span><span><b>Pendaftaran peserta</b><small>Guru melengkapkan maklumat diri</small></span><em>→</em></button>
          <button onClick={() => go("attendance")}><span className="quick-icon blue"><Icon name="qr"/></span><span><b>Kehadiran melalui QR</b><small>Rekod masa secara automatik</small></span><em>→</em></button>
          <button onClick={() => go("report")}><span className="quick-icon orange"><Icon name="file"/></span><span><b>Hantar laporan</b><small>Pilih nama daripada senarai peserta</small></span><em>→</em></button>
          <button onClick={() => go("materials")}><span className="quick-icon green"><Icon name="book"/></span><span><b>Bahan bengkel</b><small>Pautan bahan untuk semua peserta</small></span><em>→</em></button>
        </article>
      </div>
    </section>
  </>;
}

function Materials({ go }: { go: (view: View) => void }) {
  const items = [
    { title: "Slaid pembentangan", desc: "Slaid utama yang digunakan sepanjang bengkel.", tag: "Slaid", tone: "purple" },
    { title: "Templat aktiviti", desc: "Templat kerja dan bahan amali untuk peserta.", tag: "Templat", tone: "blue" },
    { title: "Koleksi prom AI", desc: "Prom pilihan untuk menyokong pengajaran STEM.", tag: "Prom", tone: "green" },
    { title: "Bahan rujukan tambahan", desc: "Panduan, tutorial dan pautan bacaan lanjut.", tag: "Rujukan", tone: "orange" },
  ];
  return <section className="materials-page">
    <button className="back" onClick={() => go("dashboard")}>← Kembali ke dashboard</button>
    <div className="materials-hero"><div><span className="eyebrow">UNTUK SEMUA PESERTA</span><h1>Pusat Bahan Bengkel</h1><p>Semua bahan adalah sama bagi sesi Ketua Panitia Sains dan Ketua Panitia Matematik.</p></div><span className="materials-icon"><Icon name="book"/></span></div>
    <div className="materials-grid">{items.map(item => <article className={`material-card ${item.tone}`} key={item.title}><span className="material-tag">{item.tag}</span><div className="material-symbol"><Icon name="link"/></div><h2>{item.title}</h2><p>{item.desc}</p><button disabled>Pautan akan dimasukkan</button></article>)}</div>
    <div className="materials-note"><b>Makluman</b><span>Pautan bahan akan dipaparkan di halaman ini setelah disahkan oleh urus setia.</span></div>
  </section>;
}

function FormShell({ type, go }: { type: "register" | "attendance" | "report"; go: (view: View) => void }) {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  useEffect(() => { if (type !== "register") getSheetsData("participants").then(r => r.ok && setParticipants(r.participants || [])).catch(() => {}); }, [type]);
  const title = type === "register" ? "Pendaftaran peserta" : type === "attendance" ? "Rekod kehadiran" : "Laporan peserta";
  const subtitle = type === "register" ? "Lengkapkan maklumat seperti dalam rekod rasmi sekolah." : type === "attendance" ? "Halaman ini hanya digunakan selepas mengimbas kod QR di lokasi bengkel." : "Pilih nama yang telah didaftarkan dan lengkapkan laporan bengkel.";
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMessage(""); setLoading(true);
    const values = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const response = await fetch(SHEETS_ENDPOINT, {method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:type === "register" ? "register" : type, ...values}),redirect:"follow"});
      const result = await response.json();
      if (!result.ok) throw new Error(result.message || "Rekod tidak dapat dihantar.");
      setMessage(result.message || "Maklumat diterima."); setSent(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Rekod tidak dapat dihantar."); }
    finally { setLoading(false); }
  };
  if (sent) return <section className="form-page"><div className="success-card"><div className="success-mark">✓</div><h2>{message}</h2><p>Rekod telah disimpan dalam Google Sheets pengurusan program.</p><button className="primary" onClick={() => go("dashboard")}>Kembali ke dashboard</button></div></section>;
  return <section className="form-page">
    <button className="back" onClick={() => go("dashboard")}>← Kembali ke dashboard</button>
    <div className="form-wrap"><div className="form-intro"><span className="eyebrow">Bengkel STEM AI · PPDPU</span><h1>{title}</h1><p>{subtitle}</p><div className="mini-event"><b>12 & 13 Ogos 2026</b><span>Dewan Sekolah Rendah Sri KDU</span></div></div>
      <form onSubmit={submit}>
        {type === "register" && <>
          <label>Nama penuh <input name="name" required placeholder="Seperti dalam kad pengenalan" /></label>
          <div className="two"><label>Nombor kad pengenalan <input name="ic" required inputMode="numeric" pattern="[0-9]{12}" placeholder="12 digit tanpa tanda sempang" /></label><label>Nombor telefon <input name="phone" required type="tel" placeholder="01X-XXXXXXX" /></label></div>
          <label>Emel DELIMa <input name="email" required type="email" placeholder="nama@moe-dl.edu.my" /></label>
          <div className="two"><label>Nama sekolah <select name="school" required defaultValue=""><option value="" disabled>Pilih sekolah</option>{schools.map(s => <option key={s}>{s}</option>)}</select></label><label>Kod sekolah <input name="schoolCode" required placeholder="Contoh: BBAxxxx" /></label></div>
          <label>Jawatan / panitia <select name="role" required defaultValue=""><option value="" disabled>Pilih jawatan</option><option>Ketua Panitia Sains</option><option>Ketua Panitia Matematik</option><option>Fasilitator / Urus Setia</option></select></label>
        </>}
        {type === "attendance" && <>
          <div className="notice"><b>Pengesahan QR lokasi</b><span>Tarikh dan masa imbasan akan direkodkan secara automatik.</span></div>
          <label>Hari bengkel <select name="day" required defaultValue=""><option value="" disabled>Pilih hari</option><option value="Sains">12 Ogos 2026 · Sains</option><option value="Matematik">13 Ogos 2026 · Matematik</option></select></label>
          <label>Nama peserta <select name="participantId" required defaultValue=""><option value="" disabled>Pilih nama berdaftar</option>{participants.map(p => <option value={p.id} key={p.id}>{p.name} · {p.school}</option>)}</select></label>
          <label>4 digit terakhir kad pengenalan <input name="last4" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="Contoh: 1234" /></label>
        </>}
        {type === "report" && <>
          <label>Nama peserta <select name="participantId" required defaultValue=""><option value="" disabled>Pilih nama berdaftar</option>{participants.map(p => <option value={p.id} key={p.id}>{p.name} · {p.school}</option>)}</select></label>
          <label>Hari bengkel <select name="day" required defaultValue=""><option value="" disabled>Pilih hari</option><option value="Sains">12 Ogos 2026 · Sains</option><option value="Matematik">13 Ogos 2026 · Matematik</option></select></label>
          <label>Ringkasan pelaksanaan <textarea name="summary" required rows={4} placeholder="Nyatakan aktiviti dan pembelajaran utama..." /></label>
          <label>Impak / hasil bengkel <textarea name="impact" required rows={4} placeholder="Nyatakan impak kepada amalan PdP..." /></label>
          <label>Pautan evidens <input name="evidence" required type="url" placeholder="Pautan Google Drive / Google Photos" /></label>
        </>}
        {message && <div className="error-message">{message}</div>}
        <button className="primary submit" type="submit" disabled={loading}>{loading ? "Menghantar..." : type === "register" ? "Hantar pendaftaran" : type === "attendance" ? "Sahkan kehadiran" : "Hantar laporan"} <span>→</span></button>
        <p className="privacy">Maklumat peribadi disimpan untuk pengurusan rasmi program dan tidak dipaparkan kepada umum.</p>
      </form>
    </div>
  </section>;
}

export default function Home() {
  const queryView = useMemo(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("view") : null, []);
  const [view, setView] = useState<View>(queryView === "attendance" ? "attendance" : queryView === "materials" ? "materials" : "dashboard");
  const go = (next: View) => { setView(next); window.scrollTo({top:0, behavior:"smooth"}); };
  return <main>
    <header className="site-header"><button className="brand" onClick={() => go("dashboard")}><span className="brand-mark">AI</span><span><b>STEM AI</b><small>PETALING UTAMA</small></span></button><nav><button className={view === "dashboard" ? "active" : ""} onClick={() => go("dashboard")}>Dashboard</button><button className={view === "register" ? "active" : ""} onClick={() => go("register")}>Pendaftaran</button><button className={view === "attendance" ? "active" : ""} onClick={() => go("attendance")}>Kehadiran</button><button className={view === "materials" ? "active" : ""} onClick={() => go("materials")}>Bahan</button><button className={view === "report" ? "active" : ""} onClick={() => go("report")}>Laporan</button></nav><span className="agency">PPD<br/><b>PETALING UTAMA</b></span></header>
    {view === "dashboard" ? <Dashboard go={go}/> : view === "materials" ? <Materials go={go}/> : <FormShell type={view} go={go}/>} 
    <footer><span>Unit Sumber dan Teknologi Pendidikan</span><b>Pejabat Pendidikan Daerah Petaling Utama</b><small>Pertanyaan: Puan Maria Farinna binti Zainal Abidin · 017-284 1200</small></footer>
  </main>;
}
