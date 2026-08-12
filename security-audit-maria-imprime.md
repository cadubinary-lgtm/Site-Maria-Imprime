# Auditoria de Segurança — Maria Imprime

**Data da verificação:** 12 de agosto de 2026  
**Escopo:** domínios públicos, transporte HTTPS, cabeçalhos HTTP, sessões e controles aplicados no servidor.

## Resultado executivo

O domínio principal já direciona acessos HTTP para HTTPS no nível de borda. A aplicação passou a ter uma segunda camada de proteção: quando recebe uma requisição encaminhada por proxy como HTTP em produção, ela responde com redirecionamento permanente `308` para a mesma URL em `https://`.

Essa abordagem preserva caminhos, parâmetros de consulta e fluxos existentes de login, formulários, upload e consultas. O ambiente de desenvolvimento local não é forçado para HTTPS, evitando indisponibilidade durante o trabalho técnico.

| Controle | Situação | Observação |
|---|---|---|
| HTTP → HTTPS | Ativo na borda e reforçado na aplicação | Redirecionamento permanente preserva URL e query string. |
| Domínio `www` | Redirecionado ao domínio principal HTTPS | Evita conteúdo duplicado e padroniza a origem. |
| HSTS | Ativo | Cabeçalho observado com `max-age=31536000`, subdomínios e instrução de preload. |
| Cookies de sessão | Protegidos | Cookies de sessão usam `HttpOnly` e `Secure` em conexão encaminhada como HTTPS. |
| MIME sniffing | Protegido | `X-Content-Type-Options: nosniff`. |
| Referenciador | Reduzido | `Referrer-Policy: strict-origin-when-cross-origin`. |
| APIs do navegador | Restritas | Câmera, microfone e geolocalização bloqueados por padrão. |
| Isolamento de janela | Configurado | `Cross-Origin-Opener-Policy: same-origin-allow-popups`, mantendo compatibilidade com OAuth. |

## Controles adicionados na aplicação

O servidor passou a confiar no primeiro proxy gerenciado para identificar o protocolo original e, em produção, redireciona apenas acessos encaminhados via HTTP. Os cabeçalhos de segurança são enviados antes das rotas de autenticação, formulários, uploads e APIs.

> O certificado e o redirecionamento da infraestrutura continuam sendo a camada principal. O middleware interno funciona como defesa adicional, não como substituto do SSL do provedor de hospedagem.

## Próximos cuidados recomendados

| Prioridade | Recomendação | Motivo |
|---|---|---|
| Alta | Manter dependências e imagens de produção atualizadas | Corrige vulnerabilidades conhecidas em bibliotecas e runtimes. |
| Alta | Aplicar limitação de taxa em login, recuperação de senha e uploads públicos | Reduz tentativas automatizadas e abuso de recursos. |
| Alta | Confirmar validação de assinatura em todos os webhooks de pagamento | Evita que eventos forjados alterem status de pagamento ou pedido. |
| Média | Introduzir Content Security Policy em modo de relatório antes de bloquear | Melhora a defesa contra XSS sem interromper Mercado Pago, OAuth, fontes e imagens já usados. |
| Média | Adicionar autenticação multifator para operadores administrativos | Reduz o impacto de credenciais administrativas comprometidas. |
| Média | Revisar permissões administrativas a cada mudança de equipe | Mantém o princípio de menor privilégio. |
| Contínua | Manter backup testado de banco e arquivos | Permite recuperação em caso de falha operacional ou incidente. |

## Validação executada

Os testes automatizados confirmam que uma requisição HTTP encaminhada em produção é redirecionada para HTTPS e que os cabeçalhos essenciais são incluídos na resposta. A compilação TypeScript foi executada sem erros.
