export function shouldShowAdminMenuItemIcon(label: string): boolean {
  return !label.toLocaleLowerCase("pt-BR").includes("dashboard");
}
