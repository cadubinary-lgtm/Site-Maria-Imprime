import { describe, expect, it } from "vitest";
import { canExecuteConfirmedDelete } from "../client/src/lib/admin-delete-confirmation";

describe("confirmação de exclusão administrativa", () => {
  it("só permite a exclusão quando existe um alvo confirmado", () => {
    expect(canExecuteConfirmedDelete(null)).toBe(false);
    expect(canExecuteConfirmedDelete(undefined)).toBe(false);
    expect(canExecuteConfirmedDelete(0)).toBe(true);
    expect(canExecuteConfirmedDelete({ id: 7 })).toBe(true);
  });
});
