import { useState, useEffect } from "react";

const SUPABASE_URL = "https://waqylcvnqwfjqurdngip.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcXlsY3ZucXdmanF1cmRuZ2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTMzNjIsImV4cCI6MjA5NTUyOTM2Mn0.URyetN8fpXOl0GANnXVQyk98x3NoyuYYlkeeF3wIkFA";

const GREEN = "#1B4D2E";
const GOLD = "#F0C040";
const GOLD_DARK = "#C9982A";
const BG = "#12321E";
const CARD_BG = "#183D25";

const FONT_STYLE = { fontFamily: "'Special Elite', Georgia, serif", letterSpacing: "0.08em" };
const ACIDIC = { fontFamily: "'Special Elite', Georgia, serif", letterSpacing: "0.14em", textTransform: "uppercase" };

const api = (path, opts = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });

const uploadPhoto = async (file, eventId) => {
  const ext = file.name.split(".").pop();
  const path = `event_${eventId}/${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
};

const MdmLogo = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill={GREEN} rx="8"/>
    <rect x="55" y="40" width="90" height="110" rx="2" fill="none" stroke={GOLD} strokeWidth="3"/>
    <rect x="55" y="40" width="90" height="35" fill="none" stroke={GOLD} strokeWidth="2"/>
    <rect x="55" y="75" width="90" height="35" fill="none" stroke={GOLD} strokeWidth="2"/>
    <rect x="62" y="115" width="76" height="18" fill={GOLD} rx="1"/>
    <text x="100" y="128" textAnchor="middle" fill={GREEN} fontSize="7" fontFamily="Georgia" letterSpacing="2">LA MAISON DE MONSIEUR</text>
    <rect x="70" y="133" width="60" height="17" fill="none" stroke={GOLD} strokeWidth="2"/>
    <rect x="95" y="133" width="10" height="17" fill={GOLD}/>
    <rect x="62" y="48" width="28" height="20" fill="none" stroke={GOLD} strokeWidth="1.5"/>
    <rect x="110" y="48" width="28" height="20" fill="none" stroke={GOLD} strokeWidth="1.5"/>
    <rect x="62" y="83" width="28" height="20" fill="none" stroke={GOLD} strokeWidth="1.5"/>
    <rect x="110" y="83" width="28" height="20" fill="none" stroke={GOLD} strokeWidth="1.5"/>
  </svg>
);

export default function App() {
  const [view, setView] = useState("home");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [unlockedEvents, setUnlockedEvents] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [adminPw, setAdminPw] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState(false);
  const [adminView, setAdminView] = useState("list");
  const [newEvent, setNewEvent] = useState({ title: "", date: "", location: "", password: "" });
  const [coverFile, setCoverFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showTuto, setShowTuto] = useState(false);

  const ADMIN_PASSWORD = "admin2024";

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Special+Elite&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const res = await api("events?select=*&order=created_at.desc");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const fetchPhotos = async (eventId) => {
    const res = await api(`photos?event_id=eq.${eventId}&select=*&order=created_at.asc`);
    const data = await res.json();
    setPhotos(Array.isArray(data) ? data : []);
  };

  const handleEventClick = (ev) => {
    setSelectedEvent(ev);
    setPwInput("");
    setPwError(false);
    if (unlockedEvents[ev.id]) {
      fetchPhotos(ev.id);
      setView("gallery");
    } else {
      setView("password");
    }
  };

  const handlePasswordSubmit = () => {
    if (pwInput === selectedEvent.password) {
      setUnlockedEvents(u => ({ ...u, [selectedEvent.id]: true }));
      fetchPhotos(selectedEvent.id);
      setView("gallery");
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handleAdminLogin = () => {
    if (adminPw === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setAdminError(false);
      setView("admin");
    } else {
      setAdminError(true);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.password) return;
    setSaving(true);
    const res = await api("events", { method: "POST", body: JSON.stringify({ title: newEvent.title, date: newEvent.date, location: newEvent.location, password: newEvent.password }) });
    const [created] = await res.json();
    if (!created) { setSaving(false); return; }

    if (coverFile) {
      const coverUrl = await uploadPhoto(coverFile, created.id);
      if (coverUrl) await api(`events?id=eq.${created.id}`, { method: "PATCH", body: JSON.stringify({ cover_url: coverUrl }) });
    }

    for (const file of photoFiles) {
      const url = await uploadPhoto(file, created.id);
      if (url) await api("photos", { method: "POST", body: JSON.stringify({ event_id: created.id, url }) });
    }

    await fetchEvents();
    setNewEvent({ title: "", date: "", location: "", password: "" });
    setCoverFile(null);
    setPhotoFiles([]);
    setSaving(false);
    setAdminView("list");
  };

  const handleDeleteEvent = async (id) => {
    await api(`events?id=eq.${id}`, { method: "DELETE" });
    fetchEvents();
  };

  const s = {
    app: { background: BG, minHeight: "100vh", color: GOLD, ...FONT_STYLE },
    nav: { background: GREEN, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD_DARK}` },
    navTitle: { ...ACIDIC, fontSize: "15px", color: GOLD, cursor: "pointer" },
    navRight: { display: "flex", gap: "18px", alignItems: "center" },
    navBtn: { background: "none", border: `1px solid ${GOLD_DARK}`, color: GOLD, padding: "5px 14px", borderRadius: "3px", cursor: "pointer", ...ACIDIC, fontSize: "11px" },
    heroSection: { textAlign: "center", padding: "48px 24px 32px" },
    divider: { width: "60px", height: "1px", background: GOLD_DARK, margin: "24px auto" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", padding: "0 28px 48px" },
    card: { background: CARD_BG, border: `1px solid ${GOLD_DARK}`, borderRadius: "4px", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" },
    cardImg: { width: "100%", height: "180px", objectFit: "cover", display: "block", filter: "brightness(0.85)" },
    cardBody: { padding: "14px 16px" },
    cardTitle: { ...ACIDIC, fontSize: "13px", color: GOLD, marginBottom: "4px" },
    cardMeta: { fontSize: "11px", color: GOLD_DARK, letterSpacing: "0.1em" },
    pwScreen: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "24px" },
    pwBox: { background: CARD_BG, border: `1px solid ${GOLD_DARK}`, borderRadius: "6px", padding: "36px 40px", maxWidth: "360px", width: "100%", textAlign: "center" },
    pwTitle: { ...ACIDIC, fontSize: "14px", color: GOLD, marginBottom: "6px" },
    pwSub: { fontSize: "11px", color: GOLD_DARK, marginBottom: "24px", letterSpacing: "0.15em" },
    input: { width: "100%", background: BG, border: `1px solid ${GOLD_DARK}`, color: GOLD, padding: "10px 14px", borderRadius: "3px", fontSize: "14px", fontFamily: "Special Elite, Georgia, serif", letterSpacing: "0.1em", boxSizing: "border-box", outline: "none", marginBottom: "10px" },
    btn: { width: "100%", background: GOLD, color: GREEN, border: "none", padding: "10px 0", borderRadius: "3px", cursor: "pointer", ...ACIDIC, fontSize: "12px" },
    backBtn: { background: "none", border: "none", color: GOLD_DARK, cursor: "pointer", fontSize: "11px", ...ACIDIC, marginBottom: "16px" },
    galleryHeader: { padding: "28px 28px 16px", display: "flex", alignItems: "flex-start", gap: "16px", flexDirection: "column" },
    galleryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", padding: "0 28px 48px" },
    thumb: { width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "zoom-in", borderRadius: "3px", border: `1px solid ${GOLD_DARK}` },
    lightboxOuter: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    lightboxImg: { maxWidth: "90vw", maxHeight: "90vh", borderRadius: "4px" },
    lightboxClose: { position: "absolute", top: "20px", right: "28px", background: "none", border: "none", color: GOLD, fontSize: "28px", cursor: "pointer" },
    adminBox: { maxWidth: "680px", margin: "0 auto", padding: "32px 24px" },
    adminTitle: { ...ACIDIC, fontSize: "18px", color: GOLD, marginBottom: "24px" },
    adminCard: { background: CARD_BG, border: `1px solid ${GOLD_DARK}`, borderRadius: "4px", padding: "16px 20px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    adminCardTitle: { ...ACIDIC, fontSize: "12px", color: GOLD },
    adminCardMeta: { fontSize: "11px", color: GOLD_DARK },
    deleteBtn: { background: "none", border: `1px solid #a33`, color: "#f66", padding: "4px 10px", borderRadius: "3px", cursor: "pointer", fontSize: "11px" },
    formGroup: { marginBottom: "14px" },
    label: { fontSize: "11px", color: GOLD_DARK, letterSpacing: "0.15em", display: "block", marginBottom: "5px", textTransform: "uppercase" },
    fileInput: { width: "100%", background: BG, border: `1px solid ${GOLD_DARK}`, color: GOLD_DARK, padding: "8px 14px", borderRadius: "3px", fontSize: "12px", boxSizing: "border-box", cursor: "pointer" },
    tutoOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, overflowY: "auto", padding: "40px 24px" },
    tutoBox: { maxWidth: "560px", margin: "0 auto", background: CARD_BG, border: `1px solid ${GOLD_DARK}`, borderRadius: "6px", padding: "36px" },
    tutoTitle: { ...ACIDIC, fontSize: "18px", color: GOLD, marginBottom: "24px" },
    tutoSection: { marginBottom: "22px" },
    tutoSectionTitle: { ...ACIDIC, fontSize: "11px", color: GOLD, marginBottom: "8px", borderBottom: `1px solid ${GOLD_DARK}`, paddingBottom: "6px" },
    tutoText: { fontSize: "13px", color: GOLD_DARK, lineHeight: "1.7" },
  };

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <span style={s.navTitle} onClick={() => setView("home")}>✦ LA MAISON DE MONSIEUR</span>
        <div style={s.navRight}>
          <button style={s.navBtn} onClick={() => setShowTuto(true)}>Tuto</button>
          {!adminUnlocked
            ? <button style={s.navBtn} onClick={() => setView("admin-login")}>Admin</button>
            : <button style={s.navBtn} onClick={() => setView("admin")}>Admin ✓</button>}
        </div>
      </nav>

      {showTuto && (
        <div style={s.tutoOverlay}>
          <div style={s.tutoBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <span style={s.tutoTitle}>Guide d'utilisation</span>
              <button onClick={() => setShowTuto(false)} style={{ background: "none", border: "none", color: GOLD, fontSize: "22px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={s.tutoSection}>
              <div style={s.tutoSectionTitle}>Page d'accueil</div>
              <p style={s.tutoText}>Affiche toutes tes soirées en grille. Accessible à tous — mais pas les photos.</p>
            </div>
            <div style={s.tutoSection}>
              <div style={s.tutoSectionTitle}>Accéder à une soirée</div>
              <p style={s.tutoText}>Clique sur une soirée → entre le mot de passe → la galerie s'ouvre. Chaque soirée a son propre mot de passe que tu distribues à tes invités.</p>
            </div>
            <div style={s.tutoSection}>
              <div style={s.tutoSectionTitle}>Panneau Admin</div>
              <p style={s.tutoText}>Clique sur <strong style={{ color: GOLD }}>Admin</strong> en haut à droite. Mot de passe : <span style={{ color: GOLD, fontFamily: "monospace", background: BG, padding: "2px 6px", borderRadius: "3px" }}>admin2024</span></p>
              <p style={{ ...s.tutoText, marginTop: "8px" }}>Tu peux ajouter des soirées avec upload de photos directement depuis ton ordi, et supprimer des soirées existantes. Tout est sauvegardé en base de données.</p>
            </div>
            <div style={s.tutoSection}>
              <div style={s.tutoSectionTitle}>Upload de photos</div>
              <p style={s.tutoText}>Dans "Ajouter une soirée", sélectionne une photo de couverture et autant de photos que tu veux depuis ton ordi. Elles sont uploadées directement dans Supabase Storage.</p>
            </div>
            <button style={{ ...s.btn, marginTop: "8px" }} onClick={() => setShowTuto(false)}>Fermer</button>
          </div>
        </div>
      )}

      {lightbox && (
        <div style={s.lightboxOuter} onClick={() => setLightbox(null)}>
          <button style={s.lightboxClose}>✕</button>
          <img src={lightbox} alt="" style={s.lightboxImg} onClick={e => e.stopPropagation()} />
        </div>
      )}

      {view === "home" && (
        <>
          <div style={s.heroSection}>
            <MdmLogo size={72} />
            <div style={{ ...ACIDIC, fontSize: "11px", color: GOLD_DARK, marginTop: "18px", marginBottom: "4px" }}>Bienvenue dans</div>
            <div style={{ ...ACIDIC, fontSize: "24px", color: GOLD }}>LA MAISON DE MONSIEUR</div>
            <div style={{ fontSize: "11px", color: GOLD_DARK, marginTop: "6px", letterSpacing: "0.2em" }}>Galerie Privée · Silencio Paris</div>
            <div style={s.divider} />
            <div style={{ fontSize: "11px", color: GOLD_DARK, letterSpacing: "0.2em" }}>DERNIÈRES SOIRÉES</div>
          </div>
          {loading
            ? <div style={{ textAlign: "center", color: GOLD_DARK, padding: "48px" }}>Chargement...</div>
            : events.length === 0
              ? <div style={{ textAlign: "center", color: GOLD_DARK, padding: "48px", fontSize: "13px" }}>Aucune soirée pour le moment.</div>
              : <div style={s.grid}>
                  {events.map(ev => (
                    <div key={ev.id} style={s.card} onClick={() => handleEventClick(ev)}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                      {ev.cover_url
                        ? <img src={ev.cover_url} alt={ev.title} style={s.cardImg} />
                        : <div style={{ ...s.cardImg, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}><MdmLogo size={48} /></div>}
                      <div style={s.cardBody}>
                        <div style={s.cardTitle}>{ev.title}</div>
                        <div style={s.cardMeta}>{ev.date}</div>
                        {ev.location && <div style={s.cardMeta}>{ev.location}</div>}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                          {unlockedEvents[ev.id]
                            ? <span style={{ fontSize: "10px", color: GOLD_DARK }}>✓ Accès accordé</span>
                            : <span style={{ fontSize: "10px", color: GOLD_DARK }}>🔒 Accès privé</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
        </>
      )}

      {view === "password" && selectedEvent && (
        <div style={s.pwScreen}>
          <button style={s.backBtn} onClick={() => setView("home")}>← Retour</button>
          <div style={s.pwBox}>
            <MdmLogo size={48} />
            <div style={{ ...s.pwTitle, marginTop: "18px" }}>{selectedEvent.title}</div>
            <div style={s.pwSub}>{selectedEvent.date} · {selectedEvent.location}</div>
            <div style={{ fontSize: "11px", color: GOLD_DARK, marginBottom: "18px" }}>Accès réservé aux invités</div>
            <input style={{ ...s.input, borderColor: pwError ? "#a33" : GOLD_DARK }} type="password" placeholder="Mot de passe de la soirée"
              value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key === "Enter" && handlePasswordSubmit()} />
            {pwError && <div style={{ color: "#f66", fontSize: "11px", marginBottom: "10px" }}>Mot de passe incorrect</div>}
            <button style={s.btn} onClick={handlePasswordSubmit}>ENTRER</button>
          </div>
        </div>
      )}

      {view === "gallery" && selectedEvent && (
        <>
          <div style={s.galleryHeader}>
            <button style={s.backBtn} onClick={() => setView("home")}>← Retour aux soirées</button>
            <div>
              <div style={{ ...ACIDIC, fontSize: "18px", color: GOLD }}>{selectedEvent.title}</div>
              <div style={{ fontSize: "11px", color: GOLD_DARK, marginTop: "4px" }}>{selectedEvent.date} · {selectedEvent.location}</div>
            </div>
            <div style={{ fontSize: "11px", color: GOLD_DARK }}>{photos.length} photo{photos.length > 1 ? "s" : ""}</div>
          </div>
          {photos.length === 0
            ? <div style={{ textAlign: "center", color: GOLD_DARK, padding: "48px", fontSize: "13px" }}>Aucune photo pour cette soirée.</div>
            : <div style={s.galleryGrid}>
                {photos.map((p, i) => (
                  <img key={i} src={p.url} alt="" style={s.thumb} onClick={() => setLightbox(p.url)} />
                ))}
              </div>}
        </>
      )}

      {view === "admin-login" && (
        <div style={s.pwScreen}>
          <button style={s.backBtn} onClick={() => setView("home")}>← Retour</button>
          <div style={s.pwBox}>
            <MdmLogo size={48} />
            <div style={{ ...s.pwTitle, marginTop: "18px" }}>Panneau Admin</div>
            <div style={s.pwSub}>Réservé à La Maison</div>
            <input style={{ ...s.input, borderColor: adminError ? "#a33" : GOLD_DARK }} type="password" placeholder="Mot de passe admin"
              value={adminPw} onChange={e => { setAdminPw(e.target.value); setAdminError(false); }}
              onKeyDown={e => e.key === "Enter" && handleAdminLogin()} />
            {adminError && <div style={{ color: "#f66", fontSize: "11px", marginBottom: "10px" }}>Mot de passe incorrect</div>}
            <button style={s.btn} onClick={handleAdminLogin}>ACCÉDER</button>
          </div>
        </div>
      )}

      {view === "admin" && adminUnlocked && (
        <div style={s.adminBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div style={s.adminTitle}>Panneau Admin</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ ...s.navBtn, borderColor: adminView === "list" ? GOLD : GOLD_DARK, color: adminView === "list" ? GOLD : GOLD_DARK }} onClick={() => setAdminView("list")}>Soirées</button>
              <button style={{ ...s.navBtn, borderColor: adminView === "add" ? GOLD : GOLD_DARK, color: adminView === "add" ? GOLD : GOLD_DARK }} onClick={() => setAdminView("add")}>+ Ajouter</button>
              <button style={s.navBtn} onClick={() => setView("home")}>← Site</button>
            </div>
          </div>

          {adminView === "list" && (
            <>
              <div style={{ fontSize: "11px", color: GOLD_DARK, marginBottom: "16px" }}>{events.length} soirée{events.length > 1 ? "s" : ""}</div>
              {events.map(ev => (
                <div key={ev.id} style={s.adminCard}>
                  <div>
                    <div style={s.adminCardTitle}>{ev.title}</div>
                    <div style={s.adminCardMeta}>{ev.date} · {ev.location}</div>
                    <div style={s.adminCardMeta}>MDP : <span style={{ color: GOLD }}>{ev.password}</span></div>
                  </div>
                  <button style={s.deleteBtn} onClick={() => handleDeleteEvent(ev.id)}>Supprimer</button>
                </div>
              ))}
            </>
          )}

          {adminView === "add" && (
            <div style={{ background: CARD_BG, border: `1px solid ${GOLD_DARK}`, borderRadius: "4px", padding: "24px" }}>
              <div style={{ ...ACIDIC, fontSize: "13px", color: GOLD, marginBottom: "20px" }}>Nouvelle soirée</div>
              {[["title", "Titre (ex: MAISON N°04)"], ["date", "Date (ex: 15 Mars 2024)"], ["location", "Lieu (ex: Silencio, Paris)"], ["password", "Mot de passe de la soirée"]].map(([key, placeholder]) => (
                <div key={key} style={s.formGroup}>
                  <label style={s.label}>{placeholder.split("(")[0].trim()}</label>
                  <input style={s.input} placeholder={placeholder} value={newEvent[key]}
                    onChange={e => setNewEvent(n => ({ ...n, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={s.formGroup}>
                <label style={s.label}>Photo de couverture</label>
                <input type="file" accept="image/*" style={s.fileInput} onChange={e => setCoverFile(e.target.files[0])} />
                {coverFile && <div style={{ fontSize: "11px", color: GOLD_DARK, marginTop: "6px" }}>✓ {coverFile.name}</div>}
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Photos de la soirée</label>
                <input type="file" accept="image/*" multiple style={s.fileInput} onChange={e => setPhotoFiles(Array.from(e.target.files))} />
                {photoFiles.length > 0 && <div style={{ fontSize: "11px", color: GOLD_DARK, marginTop: "6px" }}>✓ {photoFiles.length} photo{photoFiles.length > 1 ? "s" : ""} sélectionnée{photoFiles.length > 1 ? "s" : ""}</div>}
              </div>
              <button style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} onClick={handleAddEvent} disabled={saving}>
                {saving ? "PUBLICATION EN COURS..." : "PUBLIER LA SOIRÉE"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
