import { useState, useRef, useEffect } from "react";
import { sendChat, getItinerary, getCrowd, getEmergency } from "./api";

const LANGS = { en: "EN", hi: "हि", ta: "த" };

function App() {
  const [tab, setTab] = useState("chat");
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const history = messages.map((m) => ({ role: m.role, content: m.text }));

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const { data } = await sendChat(msg, history, lang);
      setMessages((p) => [...p, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", text: "Sorry, I couldn't connect. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={styles.app}>
      <Header lang={lang} setLang={setLang} />
      <Nav tab={tab} setTab={setTab} />

      {tab === "chat" && (
        <>
          <div ref={chatRef} style={styles.chatArea}>
            {messages.length === 0 && <Welcome />}
            {messages.map((m, i) => <Bubble key={i} msg={m} />)}
            {loading && <TypingBubble />}
          </div>
          <InputArea input={input} setInput={setInput} onSend={send} lang={lang} />
        </>
      )}
      {tab === "crowd"     && <CrowdTab />}
      {tab === "itinerary" && <ItineraryTab lang={lang} />}
      {tab === "emergency" && <EmergencyTab />}
    </div>
  );
}

function Header({ lang, setLang }) {
  return (
    <div style={styles.header}>
      <div style={styles.logo}>🕉</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 18, color: "white" }}>KumbhSathi</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>AI Pilgrim Assistant • Ujjain 2028</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {Object.entries(LANGS).map(([k, v]) => (
          <button key={k} onClick={() => setLang(k)}
            style={{ ...styles.langBtn, ...(lang === k ? styles.langBtnActive : {}) }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function Nav({ tab, setTab }) {
  const tabs = [
    { id: "chat", label: "💬 Chat" },
    { id: "crowd", label: "👥 Crowd" },
    { id: "itinerary", label: "📅 Itinerary" },
    { id: "emergency", label: "🚨 Emergency" },
  ];
  return (
    <div style={styles.nav}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ ...styles.navBtn, ...(tab === t.id ? styles.navBtnActive : {}) }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Welcome() {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🙏</div>
      <h2 style={{ fontSize: 18, marginBottom: 6 }}>Welcome to KumbhSathi</h2>
      <p style={{ color: "#8B6E5A", fontSize: 14, lineHeight: 1.6 }}>
  Your AI companion for Mahakumbh 2028.<br />Ujjain, Madhya Pradesh
</p>
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const formatted = msg.text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 8 }}>
      {!isUser && <div style={styles.avatar}>🕉</div>}
      <div
        style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleAssistant) }}
        dangerouslySetInnerHTML={{ __html: isUser ? msg.text : formatted }}
      />
      {isUser && <div style={{ ...styles.avatar, background: "#1A0A00", marginLeft: 8, marginRight: 0 }}>🙏</div>}
    </div>
  );
}
function TypingBubble() {
  return (
    <div style={{ display: "flex", marginBottom: 8 }}>
      <div style={styles.avatar}>🕉</div>
      <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
        <span style={styles.dot} />
        <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
        <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

function InputArea({ input, setInput, onSend, lang }) {
  const placeholders = {
    en: "Ask about Mahakumbh…",
    hi: "महाकुम्भ के बारे में पूछें…",
    ta: "மகாகும்பம் பற்றி கேளுங்கள்…",
  };

  const quickChips = {
    en: ["What are the Shahi Snan dates?", "How to reach Ujjain from Mumbai?", "What facilities are available?", "Packing tips for pilgrimage"],
hi: ["शाही स्नान की तारीखें क्या हैं?", "मुंबई से उज्जैन कैसे पहुंचें?", "क्या सुविधाएं उपलब्ध हैं?", "यात्रा के लिए पैकिंग टिप्स"],
ta: ["ஷாஹி ஸ்நான் தேதிகள் என்ன?", "மும்பையிலிருந்து உஜ்ஜைன் எப்படி செல்வது?", "என்ன வசதிகள் உள்ளன?", "யாத்திரை பேக்கிங் டிப்ஸ்"],
  };

  const langLabel = {
    en: "🇬🇧 English",
    hi: "🇮🇳 हिंदी",
    ta: "🇮🇳 தமிழ்",
  };

  return (
    <div style={styles.inputArea}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#8B6E5A", fontWeight: 500 }}>
          Responding in: <strong style={{ color: "#E8621A" }}>{langLabel[lang]}</strong>
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {(quickChips[lang] || quickChips.en).map((c) => (
          <button key={c} onClick={() => onSend(c)} style={styles.chip}>{c}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder={placeholders[lang] || placeholders.en}
          style={styles.msgInput}
        />
        <button onClick={() => onSend()} style={styles.sendBtn}>➤</button>
      </div>
    </div>
  );
}

function CrowdTab() {
  const [selected, setSelected] = useState(null);

  const locs = {
  sangam:   { name:"Ram Ghat", desc:"Most sacred ghat on Shipra river, main bathing site", level:"High", time:"4:00–6:00 AM", wait:"45–60 min", pct:90, color:"#E24B4A" },
  triveni:  { name:"Mahakaleshwar Temple", desc:"One of 12 Jyotirlingas, busiest during Kumbh", level:"High", time:"Early dawn", wait:"60–90 min", pct:95, color:"#E24B4A" },
  hanuman:  { name:"Harsiddhi Temple", desc:"Ancient Shakti Peeth near the Mahakal complex", level:"Medium", time:"8:00–10:00 AM", wait:"15–25 min", pct:55, color:"#EF9F27" },
  busstand: { name:"Ujjain Bus Stand", desc:"Central bus terminal connecting all routes", level:"Medium", time:"Avoid 5–8 PM", wait:"20–30 min", pct:60, color:"#EF9F27" },
  tentcity: { name:"Tent City Sector A", desc:"Pilgrim accommodation near Shipra river", level:"Low", time:"Anytime", wait:"5 min", pct:20, color:"#2D6A4F" },
  ramghat:  { name:"Triveni Ghat", desc:"Serene confluence point with calm crowd flow", level:"Low", time:"Anytime", wait:"5–10 min", pct:25, color:"#2D6A4F" },
};

  const s = selected ? locs[selected] : null;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:16, background:"#FFF8F0", width:"100%" }}>

      {/* Info Panel */}
      <div style={{ background:"white", border:"1px solid #E8D5C4", borderRadius:12, padding:14, marginBottom:12 }}>
        {s ? (<>
          <div style={{ fontWeight:600, fontSize:15, color:"#2c1a0a", marginBottom:2 }}>{s.name}</div>
          <div style={{ fontSize:12, color:"#8B6E5A", marginBottom:10 }}>{s.desc}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
            {[["Crowd level", s.level], ["Best time", s.time], ["Wait time", s.wait]].map(([label, val]) => (
              <div key={label} style={{ background:"#FDF0E8", borderRadius:8, padding:"8px 10px" }}>
                <div style={{ fontSize:10, color:"#8B6E5A", marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#2c1a0a" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ height:6, borderRadius:3, background:"#E8D5C4" }}>
            <div style={{ height:6, borderRadius:3, width:`${s.pct}%`, background:s.color, transition:"width 0.4s" }}/>
          </div>
        </>) : (
          <div style={{ textAlign:"center", padding:"12px 0", color:"#8B6E5A", fontSize:13 }}>
            📍 Tap a location on the map to see crowd details
          </div>
        )}
      </div>

      {/* SVG Map */}
      <div style={{ background:"#e8f4f8", borderRadius:12, border:"1px solid #E8D5C4", overflow:"hidden", marginBottom:8 }}>
        <svg viewBox="0 0 680 380" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%", display:"block" }}>
          <defs>
            <radialGradient id="h-red" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#E24B4A" stopOpacity="0.7"/><stop offset="100%" stopColor="#E24B4A" stopOpacity="0"/></radialGradient>
            <radialGradient id="h-amber" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EF9F27" stopOpacity="0.6"/><stop offset="100%" stopColor="#EF9F27" stopOpacity="0"/></radialGradient>
            <radialGradient id="h-green" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#639922" stopOpacity="0.5"/><stop offset="100%" stopColor="#639922" stopOpacity="0"/></radialGradient>
          </defs>
          <rect width="680" height="380" fill="#e8f4f8"/>
          <rect x="0" y="280" width="680" height="100" fill="#b8ddf0" opacity="0.6"/>
          <path d="M0,290 Q170,270 340,285 Q510,300 680,280 L680,380 L0,380Z" fill="#a8d4ec" opacity="0.5"/>
          <text x="340" y="340" textAnchor="middle" fontSize="13" fill="#185FA5" fontWeight="500">Ganga River</text>
          <rect x="20" y="20" width="640" height="250" rx="8" fill="#f0ebe0" opacity="0.4"/>
          <rect x="40" y="40" width="180" height="80" rx="4" fill="#d4c9a8" opacity="0.5"/>
          <text x="130" y="75" textAnchor="middle" fontSize="10" fill="#5F5E5A">Sector A — Tent City</text>
          <rect x="250" y="40" width="160" height="60" rx="4" fill="#d4c9a8" opacity="0.5"/>
          <text x="330" y="68" textAnchor="middle" fontSize="10" fill="#5F5E5A">Sector B</text>
          <rect x="440" y="40" width="200" height="80" rx="4" fill="#d4c9a8" opacity="0.5"/>
          <text x="540" y="75" textAnchor="middle" fontSize="10" fill="#5F5E5A">Sector C</text>
          <path d="M100,200 L580,200" stroke="#888780" strokeWidth="1" fill="none" strokeDasharray="3 3" opacity="0.3"/>
          <path d="M340,40 L340,280" stroke="#888780" strokeWidth="1" fill="none" strokeDasharray="3 3" opacity="0.3"/>
          <text x="420" y="215" fontSize="9" fill="#888780">Triveni Marg</text>
          <ellipse cx="340" cy="282" rx="70" ry="50" fill="url(#h-red)"/>
          <ellipse cx="200" cy="278" rx="55" ry="40" fill="url(#h-red)"/>
          <ellipse cx="480" cy="220" rx="45" ry="35" fill="url(#h-amber)"/>
          <ellipse cx="130" cy="160" rx="50" ry="35" fill="url(#h-green)"/>
          <ellipse cx="540" cy="120" rx="40" ry="30" fill="url(#h-green)"/>
          <ellipse cx="330" cy="140" rx="35" ry="28" fill="url(#h-amber)"/>
          {Object.entries({ sangam:[340,278,"#E24B4A","Ram Ghat"], triveni:[200,275,"#E24B4A","Mahakaleshwar"], hanuman:[480,218,"#EF9F27","Harsiddhi Temple"], busstand:[330,138,"#EF9F27","Bus Stand"], tentcity:[130,158,"#639922","Tent City"], ramghat:[540,118,"#639922","Triveni Ghat"] }).map(([id,[cx,cy,color,label]]) => (
            <g key={id} style={{ cursor:"pointer" }} onClick={() => setSelected(id)}>
              <circle cx={cx} cy={cy} r="16" fill={color} opacity={selected===id?1:0.75}/>
              <circle cx={cx} cy={cy} r="8" fill="white"/>
              <circle cx={cx} cy={cy} r="4" fill={color}/>
              <text x={cx} y={cy-18} textAnchor="middle" fontSize="11" fontWeight="500" fill={color}>{label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:16, padding:"8px 4px", flexWrap:"wrap" }}>
        {[["#E24B4A","High crowd"],["#EF9F27","Medium crowd"],["#2D6A4F","Low crowd"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#8B6E5A" }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function ItineraryTab({ lang }) {
  const [days, setDays] = useState(2);
  const [group, setGroup] = useState("family");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await getItinerary(days, group, lang);
      setResult(data.days || []);
    } catch { setResult([]); }
    setLoading(false);
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Plan Your Pilgrimage</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "#8B6E5A", display: "block", marginBottom: 4 }}>Number of Days</label>
            <select value={days} onChange={(e) => setDays(+e.target.value)}
              style={{ ...styles.select }}>
              <option value={1}>1 Day</option>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
              <option value={5}>5 Days</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8B6E5A", display: "block", marginBottom: 4 }}>Group Type</label>
            <select value={group} onChange={(e) => setGroup(e.target.value)}
              style={{ ...styles.select }}>
              <option value="solo">Solo pilgrim</option>
              <option value="couple">Couple</option>
              <option value="family">Family (with kids)</option>
              <option value="elderly">With elderly</option>
            </select>
          </div>
        </div>
        <button onClick={generate} disabled={loading} style={styles.primaryBtn}>
          {loading ? "Generating…" : "Generate My Pilgrimage Plan ✨"}
        </button>
      </div>
      {result && result.map((day) => (
        <div key={day.day} style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
          <div style={styles.dayHeader}>Day {day.day}: {day.title}</div>
          {(day.slots || []).map((slot, i) => (
            <div key={i} style={styles.slotRow}>
              <div style={{ fontSize: 11, color: "#8B6E5A" }}>{slot.time}</div>
              <div style={{ fontWeight: 500, fontSize: 13, color: "#2c1a0a" }}>📍 {slot.place}</div>
              <div style={{ fontSize: 12, color: "#8B6E5A" }}>{slot.activity}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmergencyTab() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  useEffect(() => { getEmergency().then((r) => setData(r.data)); }, []);
  return (
    <div style={styles.tabContent}>
      <div style={{ background: "#FDE8E8", border: "1px solid #F7C1C1", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: "#C1121F", fontWeight: 500 }}>
        🚨 For life-threatening emergencies, call 112 immediately
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {(data?.contacts || []).map((c) => (
          <button key={c.type} onClick={() => setSelected(c)}
            style={{ ...styles.emBtn, ...(selected?.type === c.type ? { borderColor: "#E8621A" } : {}) }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#2c1a0a" }}>{c.type}</div>
            <div style={{ fontSize: 11, color: "#8B6E5A" }}>Dial: {c.number}</div>
          </button>
        ))}
      </div>
      {selected && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>{selected.icon} {selected.type}</div>
          <div style={{ fontSize: 14, color: "#2c1a0a" }}>📞 <strong>{selected.number}</strong></div>
          <div style={{ fontSize: 13, color: "#8B6E5A", marginTop: 4 }}>📍 {selected.location}</div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const styles = {
  app: { display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: "white", fontFamily: "'DM Sans', sans-serif" },
  header: { background: "#E8621A", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, width: "100%" },
  logo: { width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  langBtn: { background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer" },
  langBtnActive: { background: "white", color: "#E8621A" },
  nav: { display: "flex", background: "#FDF0E8", borderBottom: "1px solid #E8D5C4", flexShrink: 0, width: "100%" },
  navBtn: { flex: 1, padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#a07860", border: "none", background: "none", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "3px solid transparent", letterSpacing: "0.2px" },
navBtnActive: { color: "#E8621A", borderBottomColor: "#E8621A", background: "rgba(232,98,26,0.06)" },
  chatArea: { flex: 1, overflowY: "auto", padding: 16, background: "#FFF8F0", display: "flex", flexDirection: "column", width: "100%" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#E8621A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8 },
  bubble: { padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.5, maxWidth: "75%" },
  bubbleAssistant: { background: "white", border: "1px solid #E8D5C4", borderRadius: "4px 16px 16px 16px", color: "#2c1a0a" },
  bubbleUser: { background: "#E8621A", color: "white", borderRadius: "16px 4px 16px 16px" },
  dot: { display: "inline-block", width: 7, height: 7, background: "#E8621A", borderRadius: "50%", margin: "0 2px", animation: "bounce 1.2s infinite" },
  inputArea: { padding: "14px 16px", background: "white", borderTop: "1px solid #E8D5C4", flexShrink: 0, width: "100%" },
  chip: { background: "#FDF0E8", border: "1px solid #F4A261", color: "#E8621A", padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" },
  msgInput: { flex: 1, border: "1px solid #E8D5C4", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FFF8F0", color: "#2c1a0a" },
  sendBtn: { background: "#E8621A", border: "none", color: "white", width: 42, height: 42, borderRadius: 12, cursor: "pointer", fontSize: 18 },
  tabContent: { flex: 1, overflowY: "auto", padding: 16, background: "#FFF8F0", width: "100%" },
  card: { background: "white", border: "1px solid #E8D5C4", borderRadius: 12, padding: 14, marginBottom: 12, width: "100%" },
  cardTitle: { fontSize: 11, color: "#8B6E5A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 },
  crowdRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #E8D5C4", width: "100%" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  select: { padding: "8px 10px", border: "1px solid #E8D5C4", borderRadius: 8, fontFamily: "inherit", fontSize: 13, background: "white", color: "#2c1a0a", width: "100%" },
  primaryBtn: { width: "100%", background: "#E8621A", color: "white", border: "none", padding: 10, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  dayHeader: { background: "#E8621A", color: "white", padding: "8px 14px", fontSize: 13, fontWeight: 600 },
  slotRow: { padding: "8px 14px", borderBottom: "1px solid #E8D5C4" },
  emBtn: { background: "white", border: "1px solid #E8D5C4", borderRadius: 12, padding: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" },
};
export default App;