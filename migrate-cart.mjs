import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('NO DATABASE_URL'); process.exit(1); }

const conn = await createConnection(url);

try {
  // Check existing columns
  const [cols] = await conn.query('SHOW COLUMNS FROM cartItems');
  const colNames = cols.map(c => c.Field);
  console.log('Existing columns:', colNames);

  if (!colNames.includes('shippingPrice')) {
    await conn.query('ALTER TABLE cartItems ADD COLUMN shippingPrice DECIMAL(10,2) NOT NULL DEFAULT 0');
    console.log('Added shippingPrice');
  } else {
    console.log('shippingPrice already exists');
  }

  if (!colNames.includes('shippingLabel')) {
    await conn.query('ALTER TABLE cartItems ADD COLUMN shippingLabel VARCHAR(255) NULL');
    console.log('Added shippingLabel');
  } else {
    console.log('shippingLabel already exists');
  }

  console.log('Migration complete!');
} catch (e) {
  console.error('Migration error:', e.message);
} finally {
  await conn.end();
}
