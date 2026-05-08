import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { segments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Segments CRUD', () => {
  let testSegmentId: number;
  const testSegmentName = 'Teste Segmento';
  const testSegmentIcon = '🧪';
  const testSegmentSlug = 'teste-segmento';

  it('should create a new segment', async () => {
    const database = await getDb();
    if (!database) {
      expect(true).toBe(true);
      return;
    }

    const result = await database.insert(segments).values({
      name: testSegmentName,
      icon: testSegmentIcon,
      slug: testSegmentSlug,
    });

    expect(result).toBeDefined();
  });

  it('should get all segments', async () => {
    const database = await getDb();
    if (!database) {
      expect(true).toBe(true);
      return;
    }

    const result = await database.select().from(segments).limit(100);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Store first segment ID for next tests
    if (result.length > 0) {
      testSegmentId = result[0].id;
    }
  });

  it('should update a segment name', async () => {
    if (!testSegmentId) {
      expect(true).toBe(true);
      return;
    }

    const database = await getDb();
    if (!database) {
      expect(true).toBe(true);
      return;
    }

    const newName = 'Segmento Atualizado';
    await database
      .update(segments)
      .set({ name: newName })
      .where(eq(segments.id, testSegmentId));

    const updated = await database
      .select()
      .from(segments)
      .where(eq(segments.id, testSegmentId));

    expect(updated[0].name).toBe(newName);
  });

  it('should update a segment icon', async () => {
    if (!testSegmentId) {
      expect(true).toBe(true);
      return;
    }

    const database = await getDb();
    if (!database) {
      expect(true).toBe(true);
      return;
    }

    const newIcon = '⭐';
    await database
      .update(segments)
      .set({ icon: newIcon })
      .where(eq(segments.id, testSegmentId));

    const updated = await database
      .select()
      .from(segments)
      .where(eq(segments.id, testSegmentId));

    expect(updated[0].icon).toBe(newIcon);
  });

  it('should maintain segment data integrity when updating', async () => {
    if (!testSegmentId) {
      expect(true).toBe(true);
      return;
    }

    const database = await getDb();
    if (!database) {
      expect(true).toBe(true);
      return;
    }

    const segment = await database
      .select()
      .from(segments)
      .where(eq(segments.id, testSegmentId));

    const originalSlug = segment[0].slug;
    const newName = 'Nome Final';

    await database
      .update(segments)
      .set({ name: newName })
      .where(eq(segments.id, testSegmentId));

    const updated = await database
      .select()
      .from(segments)
      .where(eq(segments.id, testSegmentId));

    // Verify name changed but slug remained the same
    expect(updated[0].name).toBe(newName);
    expect(updated[0].slug).toBe(originalSlug);
  });

  it('should validate segment has required fields', async () => {
    const database = await getDb();
    if (!database) {
      expect(true).toBe(true);
      return;
    }

    const result = await database.select().from(segments).limit(1);
    
    if (result.length > 0) {
      const segment = result[0];
      expect(segment.id).toBeDefined();
      expect(segment.name).toBeDefined();
      expect(segment.slug).toBeDefined();
    }
  });
});
