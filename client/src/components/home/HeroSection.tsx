import { useState } from "react";

const ICON_RAPIDA    = "/manus-storage/icone6_2b9ca331.png";
const ICON_ATENCIOSA = "/manus-storage/icone7_ddf5047c.png";
const ICON_CONFIAVEL = "/manus-storage/icone8_ed12432c.png";
const ICON_SIMPLES   = "/manus-storage/icone9_18e190d5.png";
const FUNDO_ROSA     = "/manus-storage/fundorosahome_c5c90261.webp";
const MASCOTE        = "/manus-storage/mascote-maria-v2_e85aa588.png";

const FONT = "'Bahnschrift', 'Segoe UI', sans-serif";

const pilares = [
  { icon: ICON_RAPIDA,    label: "RÁPIDA",    desc: "Ágil como você precisa" },
  { icon: ICON_ATENCIOSA, label: "ATENCIOSA", desc: "Cuida de cada detalhe" },
  { icon: ICON_CONFIAVEL, label: "CONFIÁVEL", desc: "Pode contar sempre" },
  { icon: ICON_SIMPLES,   label: "SIMPLES",   desc: "Fácil, do seu jeito" },
];

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section
      className="w-full relative overflow-hidden"
      style={{ minHeight: "auto", backgroundColor: "#ffffff", fontFamily: FONT }}
    >
      {/* Fundo rosa blob */}
      <img
        src={FUNDO_ROSA}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ objectFit: "cover", objectPosition: "right center" }}
        draggable={false}
      />

      {/* Container principal */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          minHeight: "auto",
          padding: "clamp(1rem, 5vw, 3rem)",
        }}
      >
        {/* ── CONTEÚDO PRINCIPAL ── */}
        <div
          style={{
            flex: "1 1 100%",
            maxWidth: "100%",
            paddingTop: "clamp(1rem, 3vw, 2rem)",
            paddingBottom: "clamp(1rem, 3vw, 2rem)",
            width: "100%",
          }}
        >
          {/* Título principal */}
          <h1
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#111827",
              marginBottom: "clamp(0.75rem, 2vw, 1.25rem)",
              fontFamily: FONT,
              textAlign: "center",
            }}
          >
            Precisou imprimir?<br />
            Pede pra{" "}
            <span style={{ color: "#E6005C" }}>Maria.</span>
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "clamp(0.875rem, 3vw, 1.05rem)",
              fontWeight: 400,
              color: "#4B5563",
              lineHeight: 1.6,
              marginBottom: "clamp(1rem, 3vw, 1.75rem)",
              fontFamily: FONT,
              textAlign: "center",
            }}
          >
            Aqui você encontra tudo o que precisa<br />
            para divulgar, vender e crescer.
          </p>

          {/* Mascote mobile */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "clamp(1rem, 3vw, 1.5rem)",
              minHeight: "auto",
            }}
          >
            <img
              src={MASCOTE}
              alt="Maria Imprime - Mascote"
              style={{
                height: "clamp(200px, 40vw, 537px)",
                width: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                objectPosition: "center",
              }}
              draggable={false}
            />
          </div>

          {/* Barra de busca */}
          <div style={{ maxWidth: "100%", marginBottom: "clamp(1rem, 3vw, 1.5rem)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: "50px",
                border: "1.5px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                padding: "clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.25rem)",
                gap: "12px",
              }}
            >
              <svg
                style={{ width: "18px", height: "18px", color: "#9CA3AF", flexShrink: 0 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                  color: "#374151",
                  fontFamily: FONT,
                }}
              />
            </div>
          </div>

          {/* 4 Pilares - Grid responsivo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "clamp(0.75rem, 2vw, 1.5rem)",
            }}
          >
            {pilares.map((pilar, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "8px",
                }}
              >
                <img
                  src={pilar.icon}
                  alt={pilar.label}
                  style={{
                    width: "clamp(28px, 6vw, 36px)",
                    height: "clamp(28px, 6vw, 36px)",
                    objectFit: "contain",
                  }}
                />
                <div>
                  <p
                    style={{
                      fontWeight: 800,
                      fontSize: "clamp(0.7rem, 2vw, 0.85rem)",
                      color: "#111827",
                      lineHeight: 1.2,
                      fontFamily: FONT,
                      margin: "0",
                    }}
                  >
                    {pilar.label}
                  </p>
                  <p
                    style={{
                      fontWeight: 400,
                      fontSize: "clamp(0.65rem, 1.5vw, 0.78rem)",
                      color: "#6B7280",
                      lineHeight: 1.2,
                      fontFamily: FONT,
                      margin: "0",
                    }}
                  >
                    {pilar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MASCOTE DESKTOP ── */}
        <div
          className="hidden lg:flex w-full lg:w-1/2"
          style={{
            flex: "1 1 50%",
            maxWidth: "50%",
            justifyContent: "center",
            alignItems: "flex-end",
            height: "auto",
            minHeight: "clamp(250px, 50vh, 520px)",
            position: "absolute",
            right: "0",
            top: "0",
            bottom: "0",
          }}
        >
          <img
            src={MASCOTE}
            alt="Maria Imprime - Mascote"
            style={{
              height: '537px',
              width: '423px',
              maxWidth: "100%",
              objectFit: "contain",
              objectPosition: "bottom",
              marginBottom: '-45px',
              marginLeft: '1px',
              marginRight: '2px',
              marginTop: '2px',
            }}
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
