// Mantém a rota legada /admin/regras-builder sem duplicar um fluxo que não
// persistia dados. Todas as operações passam pelo gerenciador operacional.
export { default } from "./AdminRulesManager";
