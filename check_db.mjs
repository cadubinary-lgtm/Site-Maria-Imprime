import { drizzle } from 'drizzle-orm/mysql2/promise';
import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const pool = await mysql.createPool(dbUrl);
const db = drizzle(pool);

// Query raw
const conn = await pool.getConnection();
const [rows] = await conn.execute('SELECT id, neighborhood, deliveryType, deliveryDays, price FROM localDeliveryRules WHERE neighborhood LIKE "%unamar%" LIMIT 5');
console.log('Dados do banco:');
console.log(JSON.stringify(rows, null, 2));
await conn.release();
process.exit(0);
