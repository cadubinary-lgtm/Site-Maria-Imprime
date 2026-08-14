import { describe, expect, it } from "vitest";
import { PENDING_FIELDS_NOTICE_MOTION } from "../client/src/lib/pending-fields-notice";

describe("animação do aviso de campos pendentes", () => {
  it("combina entrada suave com respeito à preferência de redução de movimento", () => {
    expect(PENDING_FIELDS_NOTICE_MOTION).toContain("animate-in");
    expect(PENDING_FIELDS_NOTICE_MOTION).toContain("fade-in-0");
    expect(PENDING_FIELDS_NOTICE_MOTION).toContain("motion-reduce:animate-none");
  });
});
