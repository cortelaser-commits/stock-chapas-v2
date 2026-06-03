const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || '';
const DB_NAME = 'stockchapas';
const COL_NAME = 'stock';
const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB máximo por request
let db = null;

// Capturar rechazos no manejados para que el servidor no se caiga
process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason?.message || reason);
});

// Rate limiting simple: máx 120 requests/minuto por IP
const _rateMap = new Map();
function checkRate(ip) {
  const now = Date.now();
  const reqs = (_rateMap.get(ip) || []).filter(t => now - t < 60000);
  if (reqs.length >= 120) return false;
  reqs.push(now);
  _rateMap.set(ip, reqs);
  return true;
}
// Limpiar el mapa cada 5 minutos para no crecer indefinidamente
setInterval(() => {
  const now = Date.now();
  for (const [ip, reqs] of _rateMap) {
    if (reqs.every(t => now - t > 60000)) _rateMap.delete(ip);
  }
}, 300000);

const LOG = process.env.DEBUG === 'true';
const log = (...a) => LOG && console.log(...a);

async function conectarDB() {
  if (!MONGO_URL) { console.log('Sin MONGO_URL'); return; }
  try {
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('MongoDB conectado - DB:', DB_NAME);
    const test = await db.collection(COL_NAME).findOne({ _id: 'stock' });
    if (test) {
      console.log('Items:', test.data?.items?.length, '| Historial:', test.data?.historial?.length, '| Cotizaciones:', test.data?.cotizaciones?.length);
    } else {
      console.log('Documento no encontrado — iniciando con STOCK_INICIAL');
    }
  } catch(e) {
    console.error('Error conectando a MongoDB:', e.message);
    setTimeout(conectarDB, 5000);
  }
}

const STOCK_INICIAL = {"items":[{"id":1,"pallet":1,"mat":"Galvanizada","esp":"0.5mm","med":"1200x2500","tipo":"Entera","qty":6,"precio":0.89},{"id":4,"pallet":2,"mat":"Inox 304","esp":"0.5mm","med":"1250x2500","tipo":"Entera","qty":4,"precio":3.74},{"id":5,"pallet":2,"mat":"Inox 304","esp":"1.2mm","med":"1300x1300","tipo":"Recorte","qty":1,"precio":3.74},{"id":6,"pallet":2,"mat":"Inox 304","esp":"1mm","med":"1500","tipo":"—","qty":1,"precio":3.74},{"id":18,"pallet":6,"mat":"Acero Carbono","esp":"2mm","med":"760x1500","tipo":"Recorte","qty":1,"precio":0.89},{"id":20,"pallet":6,"mat":"Acero Carbono","esp":"5mm","med":"1500x1500","tipo":"Recorte","qty":1,"precio":0.89},{"id":23,"pallet":7,"mat":"Acero Corten","esp":"2mm","med":"—","tipo":"Entera","qty":1,"precio":1.74},{"id":24,"pallet":7,"mat":"Acero Corten","esp":"2mm","med":"1200x1500","tipo":"Recorte","qty":1,"precio":1.74},{"id":26,"pallet":7,"mat":"Acero Corten","esp":"3mm","med":"1470x1220","tipo":"Recorte","qty":1,"precio":1.74},{"id":27,"pallet":8,"mat":"Acero Carbono","esp":"1.5mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},{"id":28,"pallet":8,"mat":"Acero Carbono","esp":"2mm","med":"—","tipo":"Entera","qty":4,"precio":0.89},{"id":29,"pallet":8,"mat":"Acero Descapado","esp":"1.5mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},{"id":30,"pallet":8,"mat":"Acero Descapado","esp":"2mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},{"id":32,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},{"id":33,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2000x460","tipo":"Recorte","qty":1,"precio":0.89},{"id":35,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"1225x920","tipo":"Recorte","qty":1,"precio":0.89},{"id":36,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2070x450","tipo":"Recorte","qty":1,"precio":0.89},{"id":38,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2350x460","tipo":"Recorte","qty":1,"precio":0.89},{"id":41,"pallet":9,"mat":"Acero Carbono","esp":"8mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},{"id":42,"pallet":9,"mat":"Acero Carbono","esp":"10mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},{"id":43,"pallet":9,"mat":"Acero Carbono","esp":"12mm","med":"—","tipo":"Entera","qty":3,"precio":0.89},{"id":46,"pallet":1,"mat":"Galvanizada","esp":"2mm","med":"1200x2400","tipo":"Entera","qty":1,"precio":0.89},{"id":47,"pallet":2,"mat":"Inox 304","esp":"0.5mm","med":"1250x1750","tipo":"Recorte","qty":1,"precio":3.74},{"id":55,"pallet":8,"mat":"Acero Descapado","esp":"2mm","med":"600x2000","tipo":"Recorte","qty":1,"precio":0},{"id":59,"pallet":3,"mat":"Inox 304","esp":"1.5mm","med":"1500 x 2720","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":60,"pallet":3,"mat":"Inox 304","esp":"1.5mm","med":"1040 x 1500","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":61,"pallet":3,"mat":"Inox 304","esp":"1.5mm","med":"1500 x 3000","tipo":"Entera","qty":5,"precio":3.74},{"id":62,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 2380","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":63,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 2380","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":64,"pallet":3,"mat":"Inox 316","esp":"2mm","med":"1250 x 2500","tipo":"Entera","qty":1,"precio":3.74},{"id":65,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 1060","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":66,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 3000","tipo":"Recorte grande","qty":3,"precio":3.74},{"id":67,"pallet":4,"mat":"Inox 304","esp":"1.5mm","med":"1060 x 1500","tipo":"Recorte grande","qty":2,"precio":3.74},{"id":68,"pallet":4,"mat":"Inox 304","esp":"1.2mm","med":"1500 x 3000","tipo":"Entera","qty":3,"precio":3.74},{"id":69,"pallet":5,"mat":"Inox 304","esp":"4mm","med":"1500 x 930","tipo":"Recorte grande","qty":1,"precio":4.3},{"id":71,"pallet":5,"mat":"Inox 304","esp":"5mm","med":"640 x 680","tipo":"Recorte","qty":1,"precio":4.3},{"id":72,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1500 x 3000","tipo":"Entera","qty":1,"precio":3.74},{"id":73,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"380 x 3000","tipo":"Recorte","qty":1,"precio":3.74},{"id":74,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"750 x 1500","tipo":"Recorte","qty":1,"precio":3.74},{"id":75,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1500 x 1900","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":76,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1160 x 3000","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":77,"pallet":11,"mat":"Inox 316","esp":"3mm","med":"1240 x 2340","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":78,"pallet":5,"mat":"Inox 304","esp":"12mm","med":"1250x2500","tipo":"Entera","qty":1,"precio":4.3},{"id":79,"pallet":5,"mat":"Inox 304","esp":"10mm","med":"1000x2000","tipo":"Entera","qty":1,"precio":4.3},{"id":80,"pallet":11,"mat":"Inox 304","esp":"4mm","med":"1500x3000","tipo":"Entera","qty":1,"precio":4.3},{"id":81,"pallet":11,"mat":"Inox 304","esp":"6mm","med":"1500 x 3000","tipo":"Entera","qty":1,"precio":4.3},{"id":83,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1500x2500","tipo":"Recorte","qty":1,"precio":3.74},{"id":84,"pallet":6,"mat":"Acero Carbono","esp":"1.5mm","med":"1500 x 2050","tipo":"Recorte grande","qty":1,"precio":0.89}],"nextId":85,"historial":[{"id":1779988216611,"fecha":"28/05/2026 02:10 p. m.","proyecto":"Ducto de aire Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":50,"tipoUso":"parcial","medOrig":"—","medCorte":"1153x915","chapa":"Acero Descapado 3mm","mat":"Acero Descapado","esp":"3mm","med":"—","tipo":"Entera","pallet":8,"qty_descontada":1,"stock_antes":2,"stock_despues":1,"precio_usd_kg":0.89,"costo_usd":22.11,"kg_usados":24.85},{"id":1779988101097,"fecha":"28/05/2026 02:08 p. m.","proyecto":"Ducto de aire Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":100,"tipoUso":"total","medOrig":"1220x655","medCorte":"1220x655","chapa":"Acero Descapado 3mm","mat":"Acero Descapado","esp":"3mm","med":"1220x655","tipo":"Recorte","pallet":8,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":16.75,"kg_usados":18.82},{"id":1779988079056,"fecha":"28/05/2026 02:07 p. m.","proyecto":"Ducto de aire pache","presup":"Xxx","operario":"Luciano","desc":"","pct":100,"tipoUso":"total","medOrig":"1220x1000","medCorte":"1220x1000","chapa":"Acero Descapado 3mm","mat":"Acero Descapado","esp":"3mm","med":"1220x1000","tipo":"Recorte","pallet":8,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":28.73,"kg_usados":null},{"id":1779802197118,"fecha":"26/05/2026 10:29 a. m.","proyecto":"Tanque Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":17,"tipoUso":"parcial","medOrig":"1500 x 3000","medCorte":"1500x500","chapa":"Inox 304 3mm","mat":"Inox 304","esp":"3mm","med":"1500 x 3000","tipo":"Entera","pallet":11,"qty_descontada":1,"stock_antes":2,"stock_despues":1,"precio_usd_kg":3.74,"costo_usd":66.48,"kg_usados":17.78},{"id":1779802113281,"fecha":"26/05/2026 10:28 a. m.","proyecto":"Tanque Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":17,"tipoUso":"parcial","medOrig":"1500 x 3000","medCorte":"510x1500","chapa":"Inox 304 3mm","mat":"Inox 304","esp":"3mm","med":"1500 x 3000","tipo":"Entera","pallet":11,"qty_descontada":1,"stock_antes":2,"stock_despues":1,"precio_usd_kg":3.74,"costo_usd":67.81,"kg_usados":18.13},{"id":1779218886489,"fecha":"19/05/2026 04:28 p. m.","proyecto":"Arboles de la vida 4","presup":"Xxxx","operario":"Luciano","desc":"","pct":40,"tipoUso":"parcial","medOrig":"1000x2000","medCorte":"400x2000","chapa":"Acero Descapado 2mm","mat":"Acero Descapado","esp":"2mm","med":"1000x2000","tipo":"Recorte","pallet":8,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":11.18,"kg_usados":12.56},{"id":1779212114730,"fecha":"19/05/2026 02:35 p. m.","proyecto":"Fogon German","presup":"xxxx","operario":"Luciano","desc":"Fogon redondo para German","pct":100,"tipoUso":"total","medOrig":"—","medCorte":"—","chapa":"Acero Corten 3mm","mat":"Acero Corten","esp":"3mm","med":"—","tipo":"Entera","pallet":7,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":1.74,"costo_usd":null,"kg_usados":null},{"id":1779212074512,"fecha":"19/05/2026 02:34 p. m.","proyecto":"Fogon Adrian","presup":"xxxx","operario":"Luciano","desc":"Fogon para el amigo de Adrian","pct":100,"tipoUso":"total","medOrig":"1200x1500","medCorte":"1200x1500","chapa":"Acero Carbono 3mm","mat":"Acero Carbono","esp":"3mm","med":"1200x1500","tipo":"Recorte","pallet":6,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":37.73,"kg_usados":42.39},{"id":1779211758765,"fecha":"19/05/2026 02:29 p. m.","proyecto":"Aislacion Pepsi","presup":"xxxx","operario":"Luciano","desc":"Medialunas de Aislacion","pct":30,"tipoUso":"parcial","medOrig":"1250x2500","medCorte":"1250x750","chapa":"Inox 304 0.5mm","mat":"Inox 304","esp":"0.5mm","med":"1250x2500","tipo":"Entera","pallet":2,"qty_descontada":1,"stock_antes":5,"stock_despues":4,"precio_usd_kg":3.74,"costo_usd":13.85,"kg_usados":3.7}],"laserItems":[{"id":1001,"cat":"Boquilla doble nueva","desc":"1.0","qty":9,"min":2},{"id":1002,"cat":"Boquilla doble nueva","desc":"2.0","qty":3,"min":2},{"id":1003,"cat":"Boquilla doble nueva","desc":"2.5","qty":1,"min":2},{"id":1004,"cat":"Boquilla doble nueva","desc":"3.5","qty":1,"min":2},{"id":1005,"cat":"Boquilla doble usada","desc":"1.0","qty":1,"min":1},{"id":1006,"cat":"Boquilla doble usada","desc":"1.5","qty":1,"min":1},{"id":1007,"cat":"Boquilla doble usada","desc":"2.0","qty":1,"min":1},{"id":1008,"cat":"Boquilla doble usada","desc":"3.0","qty":1,"min":1},{"id":1009,"cat":"Boquilla doble usada","desc":"3.5","qty":1,"min":1},{"id":1010,"cat":"Boquilla simple nueva","desc":"3.0","qty":8,"min":2},{"id":1011,"cat":"Boquilla simple nueva","desc":"3.5","qty":1,"min":2},{"id":1012,"cat":"Boquilla simple nueva","desc":"4.0","qty":1,"min":2},{"id":1013,"cat":"Boquilla simple usada","desc":"3.0","qty":2,"min":1},{"id":1014,"cat":"Boquilla simple usada","desc":"3.5","qty":1,"min":1},{"id":1015,"cat":"Boquilla simple usada","desc":"4.0","qty":1,"min":1},{"id":1016,"cat":"Lente nuevo","desc":"D27.9 x 4.1","qty":9,"min":2},{"id":1017,"cat":"Lente nuevo","desc":"D32","qty":1,"min":2},{"id":1018,"cat":"Lente usado","desc":"varios","qty":13,"min":3}],"laserNextId":1019,"agotados":[],"ts":1779988332537};

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let b = '', size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY_SIZE) { req.destroy(); reject(new Error('Payload too large')); return; }
      b += c;
    });
    req.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

function jsonRes(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Parsear /:resource/:id desde la URL
function parseId(url) {
  const parts = url.split('/');
  return parseInt(parts[parts.length - 1]);
}

// ─── Base de datos ──────────────────────────────────────────────────────────

async function leerStock() {
  if (!db) { log('leerStock: db null'); return STOCK_INICIAL; }
  try {
    const doc = await db.collection(COL_NAME).findOne({ _id: 'stock' });
    if (doc) { log('leerStock ok, items:', doc.data?.items?.length); return doc.data; }
    log('leerStock: doc no encontrado, usando STOCK_INICIAL');
    await guardarStock(STOCK_INICIAL);
    return STOCK_INICIAL;
  } catch(e) {
    console.error('leerStock ERROR:', e.message);
    return STOCK_INICIAL;
  }
}

async function guardarStock(data) {
  if (!db) return false;
  try {
    await db.collection(COL_NAME).replaceOne(
      { _id: 'stock' },
      { _id: 'stock', data, updatedAt: new Date() },
      { upsert: true }
    );
    return true;
  } catch(e) {
    console.error('guardarStock ERROR:', e.message);
    return false;
  }
}

// Update quirúrgico con arrayFilters — mucho más eficiente que reemplazar todo
async function updateField(setFields, arrayFilters) {
  const opts = arrayFilters ? { arrayFilters } : {};
  await db.collection(COL_NAME).updateOne(
    { _id: 'stock' },
    { $set: { ...setFields, updatedAt: new Date() } },
    opts
  );
}

// ─── Servidor ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '';
  if (!checkRate(ip)) { res.writeHead(429, {'Content-Type':'application/json'}); res.end('{"error":"Too many requests"}'); return; }

  const url = req.url.split('?')[0];

  // ── Archivos estáticos ───────────────────────────────────────────────────
  const staticFiles = {
    '/': { file: 'index.html', type: 'text/html; charset=utf-8' },
    '/manifest.json': { file: 'manifest.json', type: 'application/manifest+json' },
    '/sw.js': { file: 'sw.js', type: 'application/javascript' },
    '/icon.svg': { file: 'icon.svg', type: 'image/svg+xml' },
  };
  if (req.method === 'GET' && staticFiles[url]) {
    try {
      const { file, type } = staticFiles[url];
      const content = fs.readFileSync(path.join(__dirname, file));
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    } catch(e) { res.writeHead(404); res.end('Not found'); }
    return;
  }

  // ── GET /ts — timestamp liviano para detectar cambios ────────────────────
  if (req.method === 'GET' && url === '/ts') {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    try {
      const doc = await db.collection(COL_NAME).findOne({ _id: 'stock' }, { projection: { 'data.ts': 1 } });
      jsonRes(res, 200, { ts: doc?.data?.ts || 0 });
    } catch(e) { jsonRes(res, 200, { ts: 0 }); }
    return;
  }

  // ── GET /stock — descarga completa con gzip ──────────────────────────────
  if (req.method === 'GET' && url === '/stock') {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const data = await leerStock();
    const jsonStr = JSON.stringify(data);
    const ae = req.headers['accept-encoding'] || '';
    if (ae.includes('gzip')) {
      zlib.gzip(jsonStr, (err, buf) => {
        if (err) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(jsonStr); return; }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' });
        res.end(buf);
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(jsonStr);
    }
    return;
  }

  // ── POST /stock — guardado completo (laser, cotizaciones, etc.) ──────────
  if (req.method === 'POST' && url === '/stock') {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    try {
      const data = await parseBody(req);
      const ok = await guardarStock(data);
      if (ok) jsonRes(res, 200, { ok: true });
      else jsonRes(res, 503, { error: 'no se pudo guardar' });
    } catch(e) { res.writeHead(400); res.end('error'); }
    return;
  }

  // ── PATCH /stock/item/:id — actualizar qty y/o precio de un ítem ─────────
  if (req.method === 'PATCH' && /^\/stock\/item\/\d+$/.test(url)) {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const itemId = parseId(url);
    try {
      const body = await parseBody(req);
      const ts = Date.now();
      const setFields = { 'data.ts': ts };
      if (body.qty !== undefined) setFields['data.items.$[el].qty'] = body.qty;
      if (body.precio !== undefined) setFields['data.items.$[el].precio'] = body.precio;
      await updateField(setFields, [{ 'el.id': itemId }]);
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── POST /stock/item — agregar nuevo ítem ────────────────────────────────
  if (req.method === 'POST' && url === '/stock/item') {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    try {
      const body = await parseBody(req); // { item, nextId }
      const ts = Date.now();
      await db.collection(COL_NAME).updateOne(
        { _id: 'stock' },
        { $push: { 'data.items': body.item }, $set: { 'data.nextId': body.nextId, 'data.ts': ts, updatedAt: new Date() } }
      );
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── DELETE /stock/item/:id — eliminar ítem (+ opcional: mover a agotados) ─
  if (req.method === 'DELETE' && /^\/stock\/item\/\d+$/.test(url)) {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const itemId = parseId(url);
    try {
      const body = await parseBody(req).catch(() => ({})); // body opcional
      const ts = Date.now();
      const update = {
        $pull: { 'data.items': { id: itemId } },
        $set: { 'data.ts': ts, updatedAt: new Date() }
      };
      if (body.agotado) update.$push = { 'data.agotados': body.agotado };
      await db.collection(COL_NAME).updateOne({ _id: 'stock' }, update);
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── POST /stock/consumo — registrar consumo + actualizar/eliminar ítem ───
  if (req.method === 'POST' && url === '/stock/consumo') {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    try {
      const body = await parseBody(req);
      // body: { consumo, itemId, newQty, deleteItem, agotado, recorte, nextId }
      const ts = Date.now();

      // 1. Agregar consumo al historial
      await db.collection(COL_NAME).updateOne(
        { _id: 'stock' },
        {
          $push: { 'data.historial': { $each: [body.consumo], $position: 0 } },
          $set: { 'data.ts': ts, updatedAt: new Date() }
        }
      );

      // 2. Actualizar o eliminar el ítem
      if (body.deleteItem) {
        const delUpdate = { $pull: { 'data.items': { id: body.itemId } } };
        if (body.agotado) delUpdate.$push = { 'data.agotados': body.agotado };
        await db.collection(COL_NAME).updateOne({ _id: 'stock' }, delUpdate);
      } else if (body.itemId && body.newQty !== undefined) {
        await updateField(
          { 'data.items.$[el].qty': body.newQty },
          [{ 'el.id': body.itemId }]
        );
      }

      // 3. Agregar recorte si corresponde
      if (body.recorte) {
        await db.collection(COL_NAME).updateOne(
          { _id: 'stock' },
          { $push: { 'data.items': body.recorte }, $set: { 'data.nextId': body.nextId } }
        );
      }

      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── PATCH /stock/consumo/:id — editar campos de un consumo ───────────────
  if (req.method === 'PATCH' && /^\/stock\/consumo\/\d+$/.test(url)) {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const consumoId = parseId(url);
    try {
      const body = await parseBody(req); // { proyecto?, anulado? }
      const ts = Date.now();
      const setFields = { 'data.ts': ts };
      if (body.proyecto !== undefined) setFields['data.historial.$[el].proyecto'] = body.proyecto;
      if (body.anulado !== undefined) setFields['data.historial.$[el].anulado'] = body.anulado;
      await updateField(setFields, [{ 'el.id': consumoId }]);
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── DELETE /stock/consumo/:id — eliminar registro del historial ──────────
  if (req.method === 'DELETE' && /^\/stock\/consumo\/\d+$/.test(url)) {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const consumoId = parseId(url);
    try {
      const ts = Date.now();
      await db.collection(COL_NAME).updateOne(
        { _id: 'stock' },
        { $pull: { 'data.historial': { id: consumoId } }, $set: { 'data.ts': ts, updatedAt: new Date() } }
      );
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── PATCH /stock/cotizacion/:id — actualizar estado de una cotización ─────
  if (req.method === 'PATCH' && /^\/stock\/cotizacion\/\d+$/.test(url)) {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const cotId = parseId(url);
    try {
      const body = await parseBody(req); // { estado }
      const ts = Date.now();
      const setFields = { 'data.ts': ts };
      if (body.estado !== undefined) setFields['data.cotizaciones.$[el].estado'] = body.estado;
      await updateField(setFields, [{ 'el.id': cotId }]);
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  // ── PATCH /stock/laser/:id — actualizar qty de un ítem laser ────────────
  if (req.method === 'PATCH' && /^\/stock\/laser\/\d+$/.test(url)) {
    if (!db) { jsonRes(res, 503, { error: 'db no lista' }); return; }
    const laserId = parseId(url);
    try {
      const body = await parseBody(req); // { qty }
      const ts = Date.now();
      await updateField(
        { 'data.laserItems.$[el].qty': body.qty, 'data.ts': ts },
        [{ 'el.id': laserId }]
      );
      jsonRes(res, 200, { ok: true, ts });
    } catch(e) { jsonRes(res, 400, { error: e.message }); }
    return;
  }

  res.writeHead(404); res.end('not found');
});

// Levantar el puerto enseguida para que Render lo detecte, conectar DB en paralelo
server.listen(PORT, '0.0.0.0', () => console.log('Servidor Stock Chapas Fischer Montajes - Puerto ' + PORT));
conectarDB();
