import { useState, useRef } from "react";

const ROASTER_PERSONAS = [
  { id: "faang", label: "FAANG Interviewer", emoji: "🏢" },
  { id: "desi",  label: "Desi HR Aunty",     emoji: "👩‍💼" },
  { id: "iitian",label: "IIT Senior",         emoji: "🎓" },
];

const personaPrompts = {
  faang:  `You are a brutally honest FAANG (Google/Meta/Amazon) senior engineer reviewing a resume for a software engineering internship. You have extremely high standards and zero patience for fluff.`,
  desi:   `You are a stereotypical Indian HR aunty from a mid-tier IT company. You speak in a mix of Hindi and English (Hinglish). You are skeptical, slightly condescending, and compare everyone to "topper bachche".`,
  iitian: `You are an IIT/IIM graduate who is insufferably elitist. You constantly reference your own pedigree and look down on "tier-3 college students". Mix in occasional superiority complex.`,
};

const ROAST_JSON = `
Give a BRUTAL but ultimately helpful roast. Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "score": "X/10",
  "scoreEmoji": "[one emoji]",
  "headline": "[savage one-liner, max 12 words]",
  "roastLines": [
    "[brutal observation 1]",
    "[brutal observation 2]",
    "[brutal observation 3]",
    "[brutal observation 4]"
  ],
  "worstPart": "[the single most cringe thing]",
  "actuallyGood": "[one genuine compliment]",
  "verdict": "[final 1-line verdict on placement chances]",
  "fixThis": "[top 1 actionable fix]"
}`;

export default function PlacementRoast() {
  const [persona,      setPersona]      = useState(ROASTER_PERSONAS[0]);
  const [roast,        setRoast]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [phase,        setPhase]        = useState("idle");
  const [loadMsg,      setLoadMsg]      = useState("");
  const [inputMode,    setInputMode]    = useState("upload");
  const [resumeText,   setResumeText]   = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef(null);
  const roastRef     = useRef(null);

  const loadingMsgs = [
    "Resume padh raha hoon... 😐",
    "Haanji... haanji... okay...",
    "Yaar ye kya likha hai tune 💀",
    "Roast ready ho rahi hai 🔥",
  ];

  const toBase64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });

  const handleFileSelect = async (file) => {
    if (!file) return;
    const ok = ["application/pdf","image/jpeg","image/png","image/webp"];
    if (!ok.includes(file.type)) { alert("Sirf PDF, JPG, PNG ya WEBP!"); return; }
    if (file.size > 5*1024*1024)  { alert("File 5MB se badi hai!");        return; }
    const base64  = await toBase64(file);
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setUploadedFile({ name: file.name, base64, mediaType: file.type, preview });
  };

  const handleRoast = async () => {
    const hasUpload = inputMode === "upload" && uploadedFile;
    const hasPaste  = inputMode === "paste"  && resumeText.trim().length >= 50;
    if (!hasUpload && !hasPaste) return;

    setLoading(true); setPhase("roasting"); setRoast(null);
    let idx = 0; setLoadMsg(loadingMsgs[0]);
    const iv = setInterval(() => { idx=(idx+1)%loadingMsgs.length; setLoadMsg(loadingMsgs[idx]); }, 1800);

    try {
      let content;
      const p = personaPrompts[persona.id];
      if (hasUpload) {
        const type = uploadedFile.mediaType === "application/pdf" ? "document" : "image";
        content = [
          { type, source: { type:"base64", media_type: uploadedFile.mediaType, data: uploadedFile.base64 } },
          { type:"text", text: `${p}\n\nLook at this resume and roast it.\n${ROAST_JSON}` },
        ];
      } else {
        content = `${p}\n\nResume:\n---\n${resumeText}\n---\n${ROAST_JSON}`;
      }

      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{ role:"user", content }] }),
      });
      const data  = await res.json();
      const text  = data.content?.map(c=>c.text||"").join("") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      setRoast(JSON.parse(clean));
      setPhase("done");
      setTimeout(() => roastRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    } catch {
      setRoast({ score:"?/10", scoreEmoji:"💀", headline:"Resume itna bura tha ki AI crash ho gaya",
        roastLines:["Error aaya. Dobara try karo.","","",""],
        worstPart:"N/A", actuallyGood:"Try kiya, yahi kaafi hai",
        verdict:"Retry karo bhai", fixThis:"Valid resume dalo" });
      setPhase("done");
    } finally { clearInterval(iv); setLoading(false); }
  };

  const handleReset = () => { setResumeText(""); setUploadedFile(null); setRoast(null); setPhase("idle"); };
  const canRoast = inputMode==="upload" ? !!uploadedFile : resumeText.trim().length>=50;

  /* ── shared styles ── */
  const card = { background:"#0f0f0f", border:"1px solid #1e1e1e", borderRadius:"12px", padding:"20px" };
  const tag  = { fontSize:"0.68rem", letterSpacing:"2px", textTransform:"uppercase" };

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", fontFamily:"'Courier New',monospace", color:"#e0e0e0" }}>
      {/* scanlines */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)" }} />

      <div style={{ maxWidth: "100%", margin: "0", padding: "32px 60px", position:"relative", zIndex:1 }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ display:"inline-block", background:"#ff3333", color:"#000",
            fontSize:"0.7rem", fontWeight:"900", letterSpacing:"3px", padding:"4px 14px",
            marginBottom:"14px", textTransform:"uppercase" }}>● LIVE ROASTING</div>
          <h1 style={{ fontSize:"clamp(2.2rem,7vw,3.4rem)", fontWeight:"900", margin:"0 0 8px",
            color:"#fff", letterSpacing:"-1px", textTransform:"uppercase", lineHeight:1.1 }}>
            PLACEMENT<br/><span style={{ color:"#ff3333" }}>ROAST</span>
          </h1>
          <p style={{ color:"#555", fontSize:"0.82rem", margin:0, letterSpacing:"1px" }}>
            Your resume. Brutally reviewed. No filter.
          </p>
        </div>

        {(phase==="idle"||phase==="roasting") && (<>

          {/* ── PERSONA ── */}
          <p style={{ ...tag, color:"#555", marginBottom:"10px" }}>Choose Your Roaster</p>
          <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
            {ROASTER_PERSONAS.map(p=>(
              <button key={p.id} onClick={()=>setPersona(p)} style={{
                flex:1, padding:"14px 8px",
                background: persona.id===p.id ? "#ff3333" : "#111",
                border:`1px solid ${persona.id===p.id?"#ff3333":"#222"}`,
                borderRadius:"8px", cursor:"pointer",
                color: persona.id===p.id ? "#000" : "#555",
                fontSize:"0.78rem", fontWeight: persona.id===p.id?"700":"400",
                fontFamily:"'Courier New',monospace", transition:"all 0.15s",
                textAlign:"center", lineHeight:1.5,
              }}>
                <div style={{ fontSize:"1.4rem", marginBottom:"4px" }}>{p.emoji}</div>
                <div>{p.label}</div>
              </button>
            ))}
          </div>

          {/* ── MODE TOGGLE ── */}
          <div style={{ display:"flex", marginBottom:"16px", border:"1px solid #1e1e1e", borderRadius:"8px", overflow:"hidden" }}>
            {[{id:"upload",label:"📎 Upload File"},{id:"paste",label:"📋 Paste Text"}].map(({id,label})=>(
              <button key={id} onClick={()=>setInputMode(id)} style={{
                flex:1, padding:"11px", border:"none",
                background: inputMode===id ? "#151515" : "transparent",
                cursor:"pointer",
                color: inputMode===id ? "#ff3333" : "#333",
                fontFamily:"'Courier New',monospace", fontSize:"0.8rem",
                fontWeight: inputMode===id?"700":"400",
                letterSpacing:"1px", textTransform:"uppercase",
                borderBottom:`2px solid ${inputMode===id?"#ff3333":"transparent"}`,
                transition:"all 0.15s",
              }}>{label}</button>
            ))}
          </div>

          {/* ── UPLOAD ZONE ── */}
          {inputMode==="upload" && (
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);handleFileSelect(e.dataTransfer.files[0])}}
              onClick={()=>!uploadedFile&&fileInputRef.current?.click()}
              style={{
                ...card,
                border:`2px dashed ${dragOver?"#ff3333":uploadedFile?"#2a2a2a":"#1e1e1e"}`,
                background: dragOver?"#160808":"#0f0f0f",
                padding:"36px 24px", textAlign:"center",
                cursor: uploadedFile?"default":"pointer",
                transition:"all 0.2s", marginBottom:"16px",
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp"
                style={{display:"none"}} onChange={e=>handleFileSelect(e.target.files[0])} />

              {!uploadedFile ? (<>
                <div style={{ fontSize:"2.8rem", marginBottom:"12px" }}>📄</div>
                <p style={{ color:"#555", fontSize:"0.9rem", margin:"0 0 6px", fontWeight:"600" }}>
                  Resume yahan drop karo ya click karo
                </p>
                <p style={{ color:"#2a2a2a", fontSize:"0.75rem", margin:"0 0 18px" }}>
                  PDF, JPG, PNG, WEBP · Max 5MB
                </p>
                <span style={{ display:"inline-block", padding:"8px 22px",
                  border:"1px solid #222", borderRadius:"6px",
                  color:"#444", fontSize:"0.75rem", letterSpacing:"1px", textTransform:"uppercase" }}>
                  Browse File
                </span>
              </>) : (
                <div style={{ display:"flex", alignItems:"center", gap:"16px", textAlign:"left" }}>
                  {uploadedFile.preview
                    ? <img src={uploadedFile.preview} alt="preview"
                        style={{ width:"60px", height:"80px", objectFit:"cover", borderRadius:"4px", border:"1px solid #222", flexShrink:0 }} />
                    : <div style={{ width:"60px", height:"80px", background:"#1a1a1a", borderRadius:"4px",
                        border:"1px solid #222", display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"1.8rem", flexShrink:0 }}>📄</div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:"#ccc", fontSize:"0.85rem", margin:"0 0 4px", fontWeight:"600", wordBreak:"break-word" }}>
                      {uploadedFile.name}
                    </p>
                    <p style={{ color:"#4caf50", fontSize:"0.72rem", margin:"0 0 10px", letterSpacing:"1px" }}>
                      ✅ FILE READY — ROAST KE LIYE TAIYAAR
                    </p>
                    <button onClick={e=>{e.stopPropagation();setUploadedFile(null)}} style={{
                      padding:"4px 14px", background:"transparent",
                      border:"1px solid #333", borderRadius:"4px",
                      color:"#555", cursor:"pointer", fontSize:"0.72rem",
                      fontFamily:"'Courier New',monospace",
                    }}>✕ Remove</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASTE MODE ── */}
          {inputMode==="paste" && (
            <div style={{ ...card, marginBottom:"16px" }}>
              <p style={{ ...tag, color:"#333", margin:"0 0 12px" }}>Resume Text</p>
              <textarea
                value={resumeText} onChange={e=>setResumeText(e.target.value)}
                placeholder={"Name, contact, education, skills, projects...\n\nApna pura resume yahan paste karo."}
                style={{ width:"100%", minHeight:"180px", background:"transparent",
                  border:"none", outline:"none", color:"#ccc", fontSize:"0.85rem",
                  fontFamily:"'Courier New',monospace", resize:"vertical",
                  lineHeight:"1.7", caretColor:"#ff3333", boxSizing:"border-box" }}
              />
              <p style={{ color:"#2a2a2a", fontSize:"0.72rem", margin:"8px 0 0",
                borderTop:"1px solid #1a1a1a", paddingTop:"8px" }}>{resumeText.length} chars</p>
            </div>
          )}

          {/* ── ROAST BUTTON ── */}
          <button onClick={handleRoast} disabled={loading||!canRoast} style={{
            width:"100%", padding:"16px",
            background: loading||!canRoast ? "#1a1a1a" : "#ff3333",
            color:       loading||!canRoast ? "#333"    : "#000",
            border:"none", borderRadius:"10px",
            cursor: loading||!canRoast ? "not-allowed" : "pointer",
            fontSize:"1rem", fontWeight:"900",
            fontFamily:"'Courier New',monospace",
            letterSpacing:"2px", textTransform:"uppercase", transition:"all 0.15s",
          }}>
            {loading ? loadMsg : "🔥 Roast Karo"}
          </button>

        </>)}

        {/* ── RESULT ── */}
        {phase==="done" && roast && (
          <div ref={roastRef} style={{ animation:"slideIn 0.4s ease" }}>

            {/* score */}
            <div style={{ background:"#ff3333", borderRadius:"12px 12px 0 0", padding:"28px", textAlign:"center" }}>
              <div style={{ fontSize:"3.2rem", marginBottom:"8px" }}>{roast.scoreEmoji}</div>
              <div style={{ fontSize:"2.8rem", fontWeight:"900", color:"#000", letterSpacing:"-1px" }}>{roast.score}</div>
              <div style={{ color:"#000", fontWeight:"700", fontSize:"1rem", marginTop:"8px", opacity:0.85 }}>
                "{roast.headline}"
              </div>
            </div>

            {/* roast lines */}
            <div style={{ background:"#0f0f0f", border:"1px solid #1e1e1e", borderTop:"none", padding:"24px" }}>
              <p style={{ ...tag, color:"#333", margin:"0 0 16px" }}>🔥 The Roast</p>
              {roast.roastLines?.filter(Boolean).map((line,i)=>(
                <div key={i} style={{ padding:"10px 14px", background:"#111",
                  borderLeft:"3px solid #ff3333", marginBottom:"10px",
                  borderRadius:"0 6px 6px 0", fontSize:"0.87rem", color:"#ccc", lineHeight:"1.6" }}>
                  {line}
                </div>
              ))}
            </div>

            {/* cringe vs good */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1px",
              background:"#1a1a1a", border:"1px solid #1e1e1e", borderTop:"none" }}>
              <div style={{ background:"#0f0f0f", padding:"16px" }}>
                <p style={{ ...tag, color:"#ff3333", margin:"0 0 8px" }}>💀 Most Cringe</p>
                <p style={{ color:"#999", fontSize:"0.82rem", margin:0, lineHeight:"1.5" }}>{roast.worstPart}</p>
              </div>
              <div style={{ background:"#0f0f0f", padding:"16px" }}>
                <p style={{ ...tag, color:"#4caf50", margin:"0 0 8px" }}>✅ Actually Good</p>
                <p style={{ color:"#999", fontSize:"0.82rem", margin:0, lineHeight:"1.5" }}>{roast.actuallyGood}</p>
              </div>
            </div>

            {/* fix */}
            <div style={{ background:"#0a0f0a", border:"1px solid #1e2e1e", borderTop:"none", padding:"16px 20px" }}>
              <p style={{ ...tag, color:"#4caf50", margin:"0 0 8px" }}>🛠️ Fix This First</p>
              <p style={{ color:"#aaa", fontSize:"0.86rem", margin:0, lineHeight:"1.6" }}>{roast.fixThis}</p>
            </div>

            {/* verdict */}
            <div style={{ background:"#111", border:"1px solid #1e1e1e", borderTop:"none",
              borderRadius:"0 0 12px 12px", padding:"18px 20px", textAlign:"center" }}>
              <p style={{ ...tag, color:"#444", margin:"0 0 6px" }}>Final Verdict</p>
              <p style={{ color:"#ff3333", fontSize:"0.92rem", fontWeight:"700", margin:0 }}>"{roast.verdict}"</p>
            </div>

            <div style={{ textAlign:"center", margin:"12px 0 20px" }}>
              <span style={{ color:"#2a2a2a", fontSize:"0.7rem", letterSpacing:"1px" }}>
                ROASTED BY {persona.emoji} {persona.label.toUpperCase()} · PLACEMENTROAST.IN
              </span>
            </div>

            {/* action buttons */}
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={handleReset} style={{
                flex:1, padding:"14px", background:"transparent",
                border:"1px solid #222", borderRadius:"8px", color:"#555",
                cursor:"pointer", fontFamily:"'Courier New',monospace",
                fontSize:"0.82rem", fontWeight:"700",
                textTransform:"uppercase", letterSpacing:"1px",
              }}>🔄 Naya Resume</button>
              <button onClick={()=>{setPhase("idle");setRoast(null)}} style={{
                flex:1, padding:"14px", background:"#ff3333",
                border:"none", borderRadius:"8px", color:"#000",
                cursor:"pointer", fontFamily:"'Courier New',monospace",
                fontSize:"0.82rem", fontWeight:"900",
                textTransform:"uppercase", letterSpacing:"1px",
              }}>🔥 Phir Roast Karo</button>
            </div>
          </div>
        )}

        <p style={{ textAlign:"center", color:"#1a1a1a", fontSize:"0.68rem", marginTop:"32px", letterSpacing:"1px" }}>
          PLACEMENT ROAST · FOR INDIAN STUDENTS WHO CAN HANDLE THE TRUTH
        </p>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        textarea::placeholder { color:#2a2a2a }
        button:hover:not(:disabled) { opacity:0.88 }
        * { box-sizing:border-box }
      `}</style>
    </div>
  );
}