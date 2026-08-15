export function getAdminMenuGroupColors(isGroupActive: boolean | undefined, isActive: boolean): string {
  if (isGroupActive) return "bg-gray-800 text-pink-400";
  if (isActive) return "bg-pink-600 text-white";
  return "text-pink-400 hover:bg-gray-800 hover:text-pink-300";
}

export const ADMIN_MENU_GROUP_ICON_CLASS = "text-white";
