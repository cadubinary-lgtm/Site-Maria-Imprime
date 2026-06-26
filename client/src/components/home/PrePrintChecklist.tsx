const MASCOTE = "/manus-storage/mascote7v2_02cfb9a3.webp";
const FUNDO   = "/manus-storage/fundorosa2_7ec48199.webp";
const CHECK   = "/manus-storage/certo_54c281fc.png";

const checks = [
  "Resolução mínima de 150 DPI",
  "Arquivo em CMYK ou RGB",
  "Sangria e margens corretas",
  "Fontes convertidas em curvas",
  "Cores e contrastes adequados",
  "Formato e tamanho conferidos",
];

const FONT = "'Bahnschrift', 'Segoe UI', sans-serif";

export function PrePrintChecklist() {
  return (
    <section className="w-full py-10 px-4 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/*
          O container externo tem overflow-visible para a cabeça da mascote
          ultrapassar o topo do card rosa.
          O card rosa tem position: relative e overflow: visible.
          A mascote fica em position: absolute, alinhada pela base do card,
          com top negativo para a cabeça sair por cima.
        */}
        <div className="relative" style={{ paddingTop: "80px" }}>
          {/* Card rosa */}
          <div
            className="relative rounded-3xl overflow-visible flex flex-col lg:flex-row items-stretch"
            style={{
              backgroundImage: `url(${FUNDO})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#fdf0f5",
              minHeight: "300px",
            }}
          >
            {/* Espaço reservado para a mascote no lado esquerdo */}
            <div className="hidden lg:block flex-shrink-0" style={{ width: "280px" }} />

            {/* Conteúdo — centro/direita */}
            <div className="flex-1 py-8 lg:py-10" style={{paddingLeft: '165px', paddingRight: '45px'}}>
              {/* Título */}
              <h2
                className="text-2xl lg:text-3xl font-black text-gray-900 mb-2 leading-tight"
                style={{ fontFamily: FONT }}
              >
                Antes de imprimir,{" "}
                <span style={{ color: "#E6005C" }}>nós verificamos!</span>
              </h2>

              {/* Subtítulo */}
              <p
                className="text-gray-600 text-sm lg:text-base mb-6"
                style={{ fontFamily: FONT }}
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
                      style={{ fontFamily: FONT }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mascote — posicionada absolutamente, base alinhada ao fundo do card,
                cabeça ultrapassando o topo */}
            <img
              src={MASCOTE}
              alt="Maria verificando arquivo"
              className="hidden lg:block absolute object-contain object-bottom drop-shadow-lg pointer-events-none"
              style={{
                width: "auto",
                bottom: 0,
                left: "0px",
                top: "-80px",
                height: "calc(100% + 80px)",
                maxHeight: "none",
                objectFit: "contain",
                objectPosition: "bottom",
              }}
              draggable={false}
            />
          </div>

          {/* Versão mobile da mascote — abaixo do card */}
          <div className="flex justify-center mt-4 lg:hidden">
            <img
              src={MASCOTE}
              alt="Maria verificando arquivo"
              className="h-48 w-auto object-contain drop-shadow-lg"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
