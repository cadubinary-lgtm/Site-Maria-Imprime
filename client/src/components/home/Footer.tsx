import { getCompanyAddressLine, getCompanyLocationLine, getWhatsAppUrl, useCompanySettings } from "@/hooks/useCompanySettings";

export function Footer() {
  const { company } = useCompanySettings();
  const phoneHref = `tel:${company.commercialPhone.replace(/\D/g, "")}`;
  const whatsappHref = getWhatsAppUrl(company.whatsappNumber);

  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Institucional */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Institucional</h3>
            <ul className="space-y-2 text-xs">
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
              <a href="https://instagram.com/mariaimprime" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.322a1.44 1.44 0 110-2.88 1.44 1.44 0 010 2.88z" />
                </svg>
              </a>
              <a href="https://facebook.com/mariaimprime" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {company.showWhatsappButton && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.255.949c-1.238.503-2.39 1.242-3.286 2.128-1.797 1.809-2.813 4.26-2.813 6.837 0 1.52.37 3.011 1.07 4.345l-1.137 4.159c-.214.782.156 1.627.93 1.813l.04.01c.217.043.427.06.639.06.758 0 1.467-.263 2.018-.743l3.285-2.776a9.9 9.9 0 004.59 1.15h.005c5.443 0 9.87-4.426 9.87-9.87 0-2.633-.997-5.109-2.812-6.982-1.816-1.873-4.217-2.906-6.758-2.906z" />
                  </svg>
                </a>
              )}
              <a href="https://tiktok.com/@mariaimprime" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.498 3.75h-3.75v12.5a2.5 2.5 0 1 1-2.5-2.5c.69 0 1.33.23 1.85.62V7.5a6.25 6.25 0 0 0-6.25 6.25v3.75a9.75 9.75 0 0 0 9.75-9.75V3.75z" />
                </svg>
              </a>
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
          <p>© 2026 {company.tradeName}. Todos os direitos reservados.</p>
          <p className="mt-2">Site protegido (SSL)</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
