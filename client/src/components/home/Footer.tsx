import { getCompanyAddressLine, getCompanyLocationLine, getCompanyWhatsAppMessage, getValidSocialUrl, getWhatsAppUrl, useCompanySettings, useWhatsAppButtonVisibility } from "@/hooks/useCompanySettings";

export function Footer() {
  const { company } = useCompanySettings();
  const phoneHref = `tel:${company.commercialPhone.replace(/\D/g, "")}`;
  const showWhatsApp = useWhatsAppButtonVisibility(company);
  const whatsappHref = getWhatsAppUrl(company.whatsappNumber, getCompanyWhatsAppMessage(company));
  const instagramHref = getValidSocialUrl(company.instagramUrl, company.instagramActive);
  const facebookHref = getValidSocialUrl(company.facebookUrl, company.facebookActive);
  const youtubeHref = getValidSocialUrl(company.youtubeUrl, company.youtubeActive);
  const otherSocialHref = getValidSocialUrl(company.otherSocialUrl, company.otherSocialActive);

  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Institucional */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Institucional</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/produto/1200001#terms" className="hover:text-pink-600 transition-colors font-light">Central de Documentação</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors font-light">Sobre a Maria Imprime</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors font-light">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors font-light">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-pink-600 transition-colors font-light">Blog</a></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Atendimento</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={phoneHref} className="hover:text-pink-600 transition-colors font-light">
                  📞 {company.commercialPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${company.supportEmail}`} className="hover:text-pink-600 transition-colors font-light">
                  ✉️ {company.supportEmail}
                </a>
              </li>
              <li className="text-xs">
                <p className="font-semibold text-white mt-2 mb-1 text-xs">Horário de Atendimento:</p>
                <p className="font-light">Seg-Sex: 09:00 - 12:00 e 13:30 - 17:00</p>
                <p className="font-light">Sábado e Domingo: Fechada</p>
              </li>
            </ul>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Formas de Pagamento</h3>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-gray-800 p-2 rounded flex items-center justify-center w-12 h-8">
                <span className="text-xs font-bold">VISA</span>
              </div>
              <div className="bg-gray-800 p-2 rounded flex items-center justify-center w-12 h-8">
                <span className="text-xs font-bold">MC</span>
              </div>
              <div className="bg-gray-800 p-2 rounded flex items-center justify-center w-12 h-8">
                <span className="text-xs font-bold">PIX</span>
              </div>
            </div>
          </div>

          {/* Siga a Maria */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Siga a Maria</h3>
            <div className="flex gap-4">
              {instagramHref && <a href={instagramHref} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-300 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-4.771-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.322a1.44 1.44 0 110-2.88 1.44 1.44 0 010 2.88z" /></svg></a>}
              {facebookHref && <a href={facebookHref} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-300 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>}
              {youtubeHref && <a href={youtubeHref} aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-300 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.995 2.995 0 0 0-2.108-2.12C19.524 3.5 12 3.5 12 3.5s-7.524 0-9.39.566A2.995 2.995 0 0 0 .502 6.186C0 8.067 0 12 0 12s0 3.933.502 5.814a2.995 2.995 0 0 0 2.108 2.12C4.476 20.5 12 20.5 12 20.5s7.524 0 9.39-.566a2.995 2.995 0 0 0 2.108-2.12C24 15.933 24 12 24 12s0-3.933-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></a>}
              {otherSocialHref && <a href={otherSocialHref} aria-label="Outro link social" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-300 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.14 1.14" /><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.14-1.14" /></svg></a>}
              {showWhatsApp && (
                <a href={whatsappHref} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                  <img src="/manus-storage/whastapp-branco_ab9ddb70.webp" alt="WhatsApp" className="w-5 h-5 object-contain" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8" />

        {/* Company info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-xs font-light">
          <div>
            <p className="font-semibold text-white mb-2 text-xs">{company.legalName}</p>
            <p>CNPJ: {company.cnpj}</p>
            {company.stateRegistration && <p>IE: {company.stateRegistration}</p>}
            <p>{getCompanyAddressLine(company)}</p>
            <p>{getCompanyLocationLine(company)}</p>
            <p>CEP: {company.zipCode}</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-600 border-t border-gray-700 pt-8 font-light">
          <p>© 2026 Maria Imprime / Gráfica Ponto Digital. Todos os direitos reservados.</p>
          <p className="mt-2">Site protegido (SSL)</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
