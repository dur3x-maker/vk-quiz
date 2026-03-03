// Минимальный тест подключения к Supabase БЕЗ Prisma
// Запуск: node test-db-connection.mjs

import { createConnection } from 'net';
import dns from 'dns';

const HOST = 'db.lrcyoruqdkzouglzzkkz.supabase.co';
const PORT = 5432;

// --- Шаг 1: Проверка DNS ---
console.log('=== DNS Resolution ===');
dns.resolve4(HOST, (err4, ipv4) => {
  console.log('IPv4 (A):', err4 ? `ERROR: ${err4.code}` : ipv4);
});
dns.resolve6(HOST, (err6, ipv6) => {
  console.log('IPv6 (AAAA):', err6 ? `ERROR: ${err6.code}` : ipv6);
});

// --- Шаг 2: Принудительный IPv4 DNS (если есть A-запись) ---
console.log('\n=== Forcing IPv4 resolve ===');
dns.setDefaultResultOrder('ipv4first');

// --- Шаг 3: TCP connect ---
console.log(`\n=== TCP Connect to ${HOST}:${PORT} ===`);
const sock = createConnection({ host: HOST, port: PORT, timeout: 10000 });

sock.on('connect', () => {
  console.log('✅ TCP CONNECTED — порт 5432 доступен');
  sock.destroy();
  testPg();
});

sock.on('timeout', () => {
  console.log('❌ TCP TIMEOUT — порт 5432 не отвечает за 10 секунд');
  sock.destroy();
  process.exit(1);
});

sock.on('error', (err) => {
  console.log(`❌ TCP ERROR: ${err.message}`);
  process.exit(1);
});

// --- Шаг 4: pg driver test ---
async function testPg() {
  console.log('\n=== pg Driver Connect ===');
  try {
    const { default: pg } = await import('pg');
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    await client.connect();
    const res = await client.query('SELECT version()');
    console.log('✅ PostgreSQL:', res.rows[0].version);
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log(`❌ pg ERROR: ${e.message}`);
    process.exit(1);
  }
}
