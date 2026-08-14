# Investigação — Melhor Envio no domínio oficial

Em 14/08/2026, a consulta ao banco de dados associado ao projeto confirmou uma única configuração com ambiente de Produção (`sandbox = 0`), e-mail de conta preenchido, CEP de origem preenchido e Token Bearer presente. O valor do token não foi lido nem registrado.

Entretanto, a tela acessada em `https://mariaimprime.com.br/admin/logistica/configuracoes` exibiu Sandbox e credenciais ausentes. Essa divergência indica que o domínio oficial está atendendo uma instância ou fonte de configuração diferente da verificada no ambiente do projeto, ou que ainda não recebeu a versão do backend esperada.

Próxima ação necessária: validar a configuração diretamente na sessão administrativa autenticada que atende o domínio oficial, sem expor ou copiar o Token Bearer.

Na sequência, a sessão administrativa do domínio oficial foi acessada com sucesso para o usuário administrador. A rota de Configurações de Logística ainda permaneceu em estado de carregamento no momento da inspeção, o que exige acompanhar a resposta de rede da consulta de configurações antes de alterar os dados persistidos.

A consulta autenticada da interface para `logistics.settings.get` foi inspecionada e retornou `401 UNAUTHORIZED`. Como consequência, a tela administrativa exibiu o estado padrão (Sandbox e campos vazios), mesmo havendo configuração persistida no banco. A causa provável está no desencontro entre a autenticação usada pelo painel administrativo e o procedimento protegido de logística.
