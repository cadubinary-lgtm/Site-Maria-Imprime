const MASCOTE   = "/manus-storage/mascote7_d611c267.png";
const FUNDO     = "/manus-storage/fundorosa_5b29da2b.webp";
const CHECK     = "/manus-storage/certo_54c281fc.png";

const checks = [
  "Resolução mínima de 150 DPI",
  "Arquivo em CMYK ou RGB",
  "Sangria e margens corretas",
  "Fontes convertidas em curvas",
  "Cores e contrastes adequados",
  "Formato e tamanho conferidos",
];

export function PrePrintChecklist() {
  return (
    <section className="w-full py-10 px-4 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Card com fundo rosa */}
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col lg:flex-row items-center"
          style={{
            backgroundImage: `url(${FUNDO})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#fdf0f5",
            minHeight: "320px",
          }}
        >
          {/* Mascote — esquerda */}
          <div className="flex-shrink-0 flex items-end justify-center lg:justify-start px-6 pt-6 lg:pt-0" style={{ minWidth: "220px" }}>
            <img
              src={MASCOTE}
              alt="Maria verificando arquivo"
              className="h-64 lg:h-72 w-auto object-contain object-bottom drop-shadow-lg"
              draggable={false}
            />
          </div>

          {/* Conteúdo — centro/direita */}
          <div className="flex-1 px-6 lg:px-10 py-8 lg:py-10">
            {/* Título */}
            <h2
              className="text-2xl lg:text-3xl font-black text-gray-900 mb-2 leading-tight"
              style={{ fontFamily: "'Bahnschrift', 'Segoe UI', sans-serif" }}
            >
              Antes de imprimir,{" "}
              <span style={{ color: "#e91e63" }}>nós verificamos!</span>
            </h2>

            {/* Subtítulo */}
            <p
              className="text-gray-600 text-sm lg:text-base mb-6"
              style={{ fontFamily: "'Bahnschrift', 'Segoe UI', sans-serif" }}
            >
              Nossa equipe confere cada detalhe do seu arquivo antes de enviar para produção.
            </p>

            {/* Grid de checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {checks.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={CHECK}
                    alt="✓"
                    className="w-7 h-7 flex-shrink-0 object-contain"
                  />
                  <span
                    className="text-gray-800 text-sm lg:text-base font-medium"
                    style={{ fontFamily: "'Bahnschrift', 'Segoe UI', sans-serif" }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
