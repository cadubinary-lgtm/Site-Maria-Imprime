import { useState } from "react";

const ICON_RAPIDA    = "/manus-storage/icone6_2b9ca331.png";
const ICON_ATENCIOSA = "/manus-storage/icone7_ddf5047c.png";
const ICON_CONFIAVEL = "/manus-storage/icone8_ed12432c.png";
const ICON_SIMPLES   = "/manus-storage/icone9_18e190d5.png";
const FUNDO_ROSA     = "/manus-storage/fundorosahome_45d5872d.webp";
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
      style={{ minHeight: "520px", backgroundColor: "#ffffff", fontFamily: FONT }}
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
        className="relative z-10 flex flex-col md:flex-row items-center md:items-center text-center md:text-left justify-center md:justify-start"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          minHeight: "520px",
          padding: "clamp(1rem, 5vw, 3rem) clamp(1rem, 5vw, 3rem)",
        }}
      >
        {/* ── COLUNA ESQUERDA ── */}
        <div
          style={{
            flex: "1 1 100%",
            maxWidth: "100%",
            paddingTop: "clamp(1.5rem, 4vw, 3.5rem)",
            paddingBottom: "clamp(1.5rem, 4vw, 3.5rem)",
            paddingRight: "clamp(0, 5vw, 2rem)",
          }}
          className="md:flex-0 md:max-w-[50%]"
        >
          {/* Título principal */}
          <h1
            style={{
              fontSize: "clamp(2.6rem, 4vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#111827",
              marginBottom: "20px",
              fontFamily: FONT,
            }}
          >
            Precisou imprimir?<br />
            Pede pra{" "}
            <span style={{ color: "#E6005C" }}>Maria.</span>
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.05rem",
              fontWeight: 400,
              color: "#4B5563",
              lineHeight: 1.6,
              marginBottom: "28px",
              fontFamily: FONT,
            }}
          >
            Aqui você encontra tudo o que precisa<br />
            para divulgar, vender e crescer.
          </p>

          {/* Barra de busca */}
          <div style={{ maxWidth: "560px", marginBottom: "36px", marginLeft: "auto", marginRight: "auto" }} className="md:ml-0 md:mr-0">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: "50px",
                border: "1.5px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                padding: "12px 20px",
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
                placeholder="Buscar produtos, materiais ou serviços..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "0.95rem",
                  color: "#374151",
                  fontFamily: FONT,
                }}
              />
            </div>
          </div>

          {/* 4 Pilares */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: "36px",
              flexWrap: "nowrap",
            }}
          >
            {pilares.map((pilar, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <img
                  src={pilar.icon}
                  alt={pilar.label}
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "contain",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <div>
                  <p
                    style={{
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      color: "#111827",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      fontFamily: FONT,
                    }}
                  >
                    {pilar.label}
                  </p>
                  <p
                    style={{
                      fontWeight: 400,
                      fontSize: "0.78rem",
                      color: "#6B7280",
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      fontFamily: FONT,
                    }}
                  >
                    {pilar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COLUNA DIREITA — mascote ── */}
        <div
          className="hidden lg:flex"
          style={{
            flex: "0 0 50%",
            maxWidth: "50%",
            justifyContent: "center",
            alignItems: "flex-end",
            height: "520px",
          }}
        >
          <img
            src={MASCOTE}
            alt="Maria Imprime - Mascote"
            style={{
              height: "500px",
              width: "auto",
              maxWidth: "480px",
              objectFit: "contain",
              objectPosition: "bottom",
            }}
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
