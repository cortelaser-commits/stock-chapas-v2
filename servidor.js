const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || '';
const DB_NAME = 'stockchapas';
const COL_NAME = 'stock';
let db = null;

async function conectarDB() {
  if (!MONGO_URL) { console.log('Sin MONGO_URL'); return; }
  try {
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Conectado a MongoDB Atlas - DB:', DB_NAME);
    // Verificar que podemos leer
    const test = await db.collection(COL_NAME).findOne({ _id: 'stock' });
    if (test) {
      console.log('Documento encontrado - Items:', test.data?.items?.length, 'Historial:', test.data?.historial?.length);
    } else {
      console.log('Documento NO encontrado en coleccion', COL_NAME);
    }
  } catch(e) {
    console.log('Error conectando:', e.message);
    setTimeout(conectarDB, 5000);
  }
}

const STOCK_INICIAL = {"items":[{"id":1,"pallet":1,"mat":"Galvanizada","esp":"0.5mm","med":"1200x2500","tipo":"Entera","qty":6,"precio":0.89},{"id":4,"pallet":2,"mat":"Inox 304","esp":"0.5mm","med":"1250x2500","tipo":"Entera","qty":4,"precio":3.74},{"id":5,"pallet":2,"mat":"Inox 304","esp":"1.2mm","med":"1300x1300","tipo":"Recorte","qty":1,"precio":3.74},{"id":6,"pallet":2,"mat":"Inox 304","esp":"1mm","med":"1500","tipo":"—","qty":1,"precio":3.74},{"id":18,"pallet":6,"mat":"Acero Carbono","esp":"2mm","med":"760x1500","tipo":"Recorte","qty":1,"precio":0.89},{"id":20,"pallet":6,"mat":"Acero Carbono","esp":"5mm","med":"1500x1500","tipo":"Recorte","qty":1,"precio":0.89},{"id":23,"pallet":7,"mat":"Acero Corten","esp":"2mm","med":"—","tipo":"Entera","qty":1,"precio":1.74},{"id":24,"pallet":7,"mat":"Acero Corten","esp":"2mm","med":"1200x1500","tipo":"Recorte","qty":1,"precio":1.74},{"id":26,"pallet":7,"mat":"Acero Corten","esp":"3mm","med":"1470x1220","tipo":"Recorte","qty":1,"precio":1.74},{"id":27,"pallet":8,"mat":"Acero Carbono","esp":"1.5mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},{"id":28,"pallet":8,"mat":"Acero Carbono","esp":"2mm","med":"—","tipo":"Entera","qty":4,"precio":0.89},{"id":29,"pallet":8,"mat":"Acero Descapado","esp":"1.5mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},{"id":30,"pallet":8,"mat":"Acero Descapado","esp":"2mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},{"id":32,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},{"id":33,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2000x460","tipo":"Recorte","qty":1,"precio":0.89},{"id":35,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"1225x920","tipo":"Recorte","qty":1,"precio":0.89},{"id":36,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2070x450","tipo":"Recorte","qty":1,"precio":0.89},{"id":38,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2350x460","tipo":"Recorte","qty":1,"precio":0.89},{"id":41,"pallet":9,"mat":"Acero Carbono","esp":"8mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},{"id":42,"pallet":9,"mat":"Acero Carbono","esp":"10mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},{"id":43,"pallet":9,"mat":"Acero Carbono","esp":"12mm","med":"—","tipo":"Entera","qty":3,"precio":0.89},{"id":46,"pallet":1,"mat":"Galvanizada","esp":"2mm","med":"1200x2400","tipo":"Entera","qty":1,"precio":0.89},{"id":47,"pallet":2,"mat":"Inox 304","esp":"0.5mm","med":"1250x1750","tipo":"Recorte","qty":1,"precio":3.74},{"id":55,"pallet":8,"mat":"Acero Descapado","esp":"2mm","med":"600x2000","tipo":"Recorte","qty":1,"precio":0},{"id":59,"pallet":3,"mat":"Inox 304","esp":"1.5mm","med":"1500 x 2720","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":60,"pallet":3,"mat":"Inox 304","esp":"1.5mm","med":"1040 x 1500","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":61,"pallet":3,"mat":"Inox 304","esp":"1.5mm","med":"1500 x 3000","tipo":"Entera","qty":5,"precio":3.74},{"id":62,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 2380","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":63,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 2380","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":64,"pallet":3,"mat":"Inox 316","esp":"2mm","med":"1250 x 2500","tipo":"Entera","qty":1,"precio":3.74},{"id":65,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 1060","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":66,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"1500 x 3000","tipo":"Recorte grande","qty":3,"precio":3.74},{"id":67,"pallet":4,"mat":"Inox 304","esp":"1.5mm","med":"1060 x 1500","tipo":"Recorte grande","qty":2,"precio":3.74},{"id":68,"pallet":4,"mat":"Inox 304","esp":"1.2mm","med":"1500 x 3000","tipo":"Entera","qty":3,"precio":3.74},{"id":69,"pallet":5,"mat":"Inox 304","esp":"4mm","med":"1500 x 930","tipo":"Recorte grande","qty":1,"precio":4.3},{"id":71,"pallet":5,"mat":"Inox 304","esp":"5mm","med":"640 x 680","tipo":"Recorte","qty":1,"precio":4.3},{"id":72,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1500 x 3000","tipo":"Entera","qty":1,"precio":3.74},{"id":73,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"380 x 3000","tipo":"Recorte","qty":1,"precio":3.74},{"id":74,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"750 x 1500","tipo":"Recorte","qty":1,"precio":3.74},{"id":75,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1500 x 1900","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":76,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1160 x 3000","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":77,"pallet":11,"mat":"Inox 316","esp":"3mm","med":"1240 x 2340","tipo":"Recorte grande","qty":1,"precio":3.74},{"id":78,"pallet":5,"mat":"Inox 304","esp":"12mm","med":"1250x2500","tipo":"Entera","qty":1,"precio":4.3},{"id":79,"pallet":5,"mat":"Inox 304","esp":"10mm","med":"1000x2000","tipo":"Entera","qty":1,"precio":4.3},{"id":80,"pallet":11,"mat":"Inox 304","esp":"4mm","med":"1500x3000","tipo":"Entera","qty":1,"precio":4.3},{"id":81,"pallet":11,"mat":"Inox 304","esp":"6mm","med":"1500 x 3000","tipo":"Entera","qty":1,"precio":4.3},{"id":83,"pallet":11,"mat":"Inox 304","esp":"3mm","med":"1500x2500","tipo":"Recorte","qty":1,"precio":3.74},{"id":84,"pallet":6,"mat":"Acero Carbono","esp":"1.5mm","med":"1500 x 2050","tipo":"Recorte grande","qty":1,"precio":0.89}],"nextId":85,"historial":[{"id":1779988216611,"fecha":"28/05/2026 02:10 p. m.","proyecto":"Ducto de aire Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":50,"tipoUso":"parcial","medOrig":"—","medCorte":"1153x915","chapa":"Acero Descapado 3mm","mat":"Acero Descapado","esp":"3mm","med":"—","tipo":"Entera","pallet":8,"qty_descontada":1,"stock_antes":2,"stock_despues":1,"precio_usd_kg":0.89,"costo_usd":22.11,"kg_usados":24.85},{"id":1779988101097,"fecha":"28/05/2026 02:08 p. m.","proyecto":"Ducto de aire Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":100,"tipoUso":"total","medOrig":"1220x655","medCorte":"1220x655","chapa":"Acero Descapado 3mm","mat":"Acero Descapado","esp":"3mm","med":"1220x655","tipo":"Recorte","pallet":8,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":16.75,"kg_usados":18.82},{"id":1779988079056,"fecha":"28/05/2026 02:07 p. m.","proyecto":"Ducto de aire pache","presup":"Xxx","operario":"Luciano","desc":"","pct":100,"tipoUso":"total","medOrig":"1220x1000","medCorte":"1220x1000","chapa":"Acero Descapado 3mm","mat":"Acero Descapado","esp":"3mm","med":"1220x1000","tipo":"Recorte","pallet":8,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":25.57,"kg_usados":28.73},{"id":1779802197118,"fecha":"26/05/2026 10:29 a. m.","proyecto":"Tanque Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":17,"tipoUso":"parcial","medOrig":"1500 x 3000","medCorte":"1500x500","chapa":"Inox 304 3mm","mat":"Inox 304","esp":"3mm","med":"1500 x 3000","tipo":"Entera","pallet":11,"qty_descontada":1,"stock_antes":2,"stock_despues":1,"precio_usd_kg":3.74,"costo_usd":66.48,"kg_usados":17.78},{"id":1779802113281,"fecha":"26/05/2026 10:28 a. m.","proyecto":"Tanque Pache","presup":"Xxx","operario":"Luciano","desc":"","pct":17,"tipoUso":"parcial","medOrig":"1500 x 3000","medCorte":"510x1500","chapa":"Inox 304 3mm","mat":"Inox 304","esp":"3mm","med":"1500 x 3000","tipo":"Entera","pallet":11,"qty_descontada":1,"stock_antes":2,"stock_despues":1,"precio_usd_kg":3.74,"costo_usd":67.81,"kg_usados":18.13},{"id":1779218886489,"fecha":"19/05/2026 04:28 p. m.","proyecto":"Arboles de la vida 4","presup":"Xxxx","operario":"Luciano","desc":"","pct":40,"tipoUso":"parcial","medOrig":"1000x2000","medCorte":"400x2000","chapa":"Acero Descapado 2mm","mat":"Acero Descapado","esp":"2mm","med":"1000x2000","tipo":"Recorte","pallet":8,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":11.18,"kg_usados":12.56},{"id":1779212114730,"fecha":"19/05/2026 02:35 p. m.","proyecto":"Fogon German","presup":"xxxx","operario":"Luciano","desc":"Fogon redondo para German","pct":100,"tipoUso":"total","medOrig":"—","medCorte":"—","chapa":"Acero Corten 3mm","mat":"Acero Corten","esp":"3mm","med":"—","tipo":"Entera","pallet":7,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":1.74,"costo_usd":null,"kg_usados":null},{"id":1779212074512,"fecha":"19/05/2026 02:34 p. m.","proyecto":"Fogon Adrian","presup":"xxxx","operario":"Luciano","desc":"Fogon para el amigo de Adrian","pct":100,"tipoUso":"total","medOrig":"1200x1500","medCorte":"1200x1500","chapa":"Acero Carbono 3mm","mat":"Acero Carbono","esp":"3mm","med":"1200x1500","tipo":"Recorte","pallet":6,"qty_descontada":1,"stock_antes":1,"stock_despues":0,"precio_usd_kg":0.89,"costo_usd":37.73,"kg_usados":42.39},{"id":1779211758765,"fecha":"19/05/2026 02:29 p. m.","proyecto":"Aislacion Pepsi","presup":"xxxx","operario":"Luciano","desc":"Medialunas de Aislacion","pct":30,"tipoUso":"parcial","medOrig":"1250x2500","medCorte":"1250x750","chapa":"Inox 304 0.5mm","mat":"Inox 304","esp":"0.5mm","med":"1250x2500","tipo":"Entera","pallet":2,"qty_descontada":1,"stock_antes":5,"stock_despues":4,"precio_usd_kg":3.74,"costo_usd":13.85,"kg_usados":3.7}],"laserItems":[{"id":1001,"cat":"Boquilla doble nueva","desc":"1.0","qty":9,"min":2},{"id":1002,"cat":"Boquilla doble nueva","desc":"2.0","qty":3,"min":2},{"id":1003,"cat":"Boquilla doble nueva","desc":"2.5","qty":1,"min":2},{"id":1004,"cat":"Boquilla doble nueva","desc":"3.5","qty":1,"min":2},{"id":1005,"cat":"Boquilla doble usada","desc":"1.0","qty":1,"min":1},{"id":1006,"cat":"Boquilla doble usada","desc":"1.5","qty":1,"min":1},{"id":1007,"cat":"Boquilla doble usada","desc":"2.0","qty":1,"min":1},{"id":1008,"cat":"Boquilla doble usada","desc":"3.0","qty":1,"min":1},{"id":1009,"cat":"Boquilla doble usada","desc":"3.5","qty":1,"min":1},{"id":1010,"cat":"Boquilla simple nueva","desc":"3.0","qty":8,"min":2},{"id":1011,"cat":"Boquilla simple nueva","desc":"3.5","qty":1,"min":2},{"id":1012,"cat":"Boquilla simple nueva","desc":"4.0","qty":1,"min":2},{"id":1013,"cat":"Boquilla simple usada","desc":"3.0","qty":2,"min":1},{"id":1014,"cat":"Boquilla simple usada","desc":"3.5","qty":1,"min":1},{"id":1015,"cat":"Boquilla simple usada","desc":"4.0","qty":1,"min":1},{"id":1016,"cat":"Lente nuevo","desc":"D27.9 x 4.1","qty":9,"min":2},{"id":1017,"cat":"Lente nuevo","desc":"D32","qty":1,"min":2},{"id":1018,"cat":"Lente usado","desc":"varios","qty":13,"min":3}],"laserNextId":1019,"agotados":[],"ts":1779988332537};

async function leerStock() {
  if (!db) { console.log('leerStock: db es null, devolviendo STOCK_INICIAL'); return STOCK_INICIAL; }
  try {
    const doc = await db.collection(COL_NAME).findOne({ _id: 'stock' });
    if (doc) {
      console.log('leerStock: documento encontrado, items:', doc.data?.items?.length, 'historial:', doc.data?.historial?.length);
      return doc.data;
    } else {
      console.log('leerStock: documento NO encontrado, guardando STOCK_INICIAL');
      await guardarStock(STOCK_INICIAL);
      return STOCK_INICIAL;
    }
  } catch(e) {
    console.log('leerStock ERROR:', e.message);
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
    console.log('guardarStock ERROR:', e.message);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const staticFiles = {
    '/': { file: 'index.html', type: 'text/html; charset=utf-8' },
    '/manifest.json': { file: 'manifest.json', type: 'application/manifest+json' },
    '/sw.js': { file: 'sw.js', type: 'application/javascript' },
    '/icon.svg': { file: 'icon.svg', type: 'image/svg+xml' },
  };

  const url = req.url.split('?')[0];
  if (req.method === 'GET' && staticFiles[url]) {
    try {
      const { file, type } = staticFiles[url];
      const content = fs.readFileSync(path.join(__dirname, file));
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    } catch(e) { res.writeHead(404); res.end('Not found'); }
    return;
  }

  if (req.method === 'GET' && req.url === '/stock') {
    if (!db) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end('{"error":"db no lista"}'); return; }
    const data = await leerStock();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data)); return;
  }

  if (req.method === 'POST' && req.url === '/stock') {
    if (!db) { res.writeHead(503); res.end('{"error":"db no lista"}'); return; }
    let b = '';
    req.on('data', c => b += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(b);
        const ok = await guardarStock(data);
        if (ok) { res.writeHead(200); res.end('{"ok":true}'); }
        else { res.writeHead(503); res.end('{"error":"no se pudo guardar"}'); }
      } catch(e) { res.writeHead(400); res.end('error'); }
    }); return;
  }

  res.writeHead(404); res.end('not found');
});

// Abrir el puerto ENSEGUIDA para que Render lo detecte, y conectar a la base en paralelo.
server.listen(PORT, '0.0.0.0', () => console.log('Servidor Stock Chapas Fischer Montajes - Puerto ' + PORT));
conectarDB();
