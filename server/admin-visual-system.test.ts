import { describe, expect, it } from "vitest";
import { ADMIN_VISUAL_GUIDELINES, ADMIN_VISUAL_SYSTEM } from "../client/src/lib/admin-visual-system";

describe("sistema visual administrativo", () => {
  it("centraliza o padrão cinza e rosa para ações e campos", () => {
    expect(ADMIN_VISUAL_SYSTEM.root).toBe("admin-visual-system");
    expect(ADMIN_VISUAL_SYSTEM.iconAction).toBe("admin-icon-action");
    expect(ADMIN_VISUAL_GUIDELINES.iconRest).toBe("gray");
    expect(ADMIN_VISUAL_GUIDELINES.iconHover).toBe("pink");
    expect(ADMIN_VISUAL_GUIDELINES.fieldFocus).toBe("pink");
  });
});
