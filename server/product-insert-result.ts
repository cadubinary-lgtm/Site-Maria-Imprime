type InsertResultLike = {
  insertId?: unknown;
  rows?: Array<{ id?: unknown }>;
  lastInsertRowid?: unknown;
};

/** Normaliza o resultado de INSERT retornado pelos adaptadores MySQL/TiDB do Drizzle. */
export function resolveInsertedProductId(result: unknown): number {
  const insertResult = result as InsertResultLike & [InsertResultLike?];
  const rawId = insertResult?.insertId
    ?? insertResult?.[0]?.insertId
    ?? insertResult?.rows?.[0]?.id
    ?? insertResult?.lastInsertRowid;
  const productId = Number(rawId);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("O banco não retornou um identificador válido para o produto criado");
  }

  return productId;
}
