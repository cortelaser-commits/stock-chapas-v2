const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://cortelaser_db_user:Fede1989@cluster0.fj6pnvk.mongodb.net/stockchapas?appName=Cluster0';
const DB_NAME = 'stockchapas';
const COL_NAME = 'stock';
let db = null;

async function conectarDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Conectado a MongoDB Atlas');
  } catch(e) {
    console.log('Error conectando:', e.message);
    setTimeout(conectarDB, 5000);
  }
}

const STOCK_INICIAL = {"items":[
  {"id":1,"pallet":1,"mat":"Galvanizada","esp":"0.5mm","med":"1200x2500","tipo":"Entera","qty":7,"precio":0.89},
  {"id":2,"pallet":1,"mat":"Galvanizada","esp":"0.8mm","med":"1200x1300","tipo":"Recorte","qty":6,"precio":0.89},
  {"id":3,"pallet":1,"mat":"Galvanizada","esp":"2mm","med":"1200x2500","tipo":"Entera","qty":1,"precio":0.89},
  {"id":4,"pallet":2,"mat":"Inox 304","esp":"0.5mm","med":"1250x2500","tipo":"Entera","qty":5,"precio":3.74},
  {"id":5,"pallet":2,"mat":"Inox 304","esp":"1.2mm","med":"1300x1300","tipo":"Recorte","qty":1,"precio":3.74},
  {"id":6,"pallet":2,"mat":"Inox 304","esp":"1mm","med":"1500","tipo":"—","qty":1,"precio":3.74},
  {"id":7,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"—","tipo":"Entera","qty":3,"precio":3.74},
  {"id":8,"pallet":3,"mat":"Inox 304","esp":"2mm","med":"—","tipo":"Recorte grande","qty":1,"precio":3.74},
  {"id":9,"pallet":3,"mat":"Inox 304","esp":"2.5mm","med":"1500x2300","tipo":"Recorte","qty":1,"precio":3.74},
  {"id":10,"pallet":3,"mat":"Inox 316","esp":"2mm","med":"950x1500","tipo":"Recorte","qty":1,"precio":3.74},
  {"id":11,"pallet":3,"mat":"Inox 316","esp":"2mm","med":"1500x1500","tipo":"Recorte","qty":1,"precio":3.74},
  {"id":12,"pallet":4,"mat":"Inox 304","esp":"1.2mm","med":"—","tipo":"—","qty":3,"precio":3.74},
  {"id":13,"pallet":5,"mat":"Inox 304","esp":"4mm","med":"1000x1500","tipo":"Recorte","qty":1,"precio":4.30},
  {"id":14,"pallet":5,"mat":"Inox 304","esp":"5mm","med":"—","tipo":"—","qty":1,"precio":4.30},
  {"id":15,"pallet":5,"mat":"Inox 304","esp":"6mm","med":"900x1300","tipo":"Recorte","qty":1,"precio":4.30},
  {"id":16,"pallet":5,"mat":"Inox 304","esp":"10mm","med":"600x1100","tipo":"Recorte","qty":1,"precio":4.30},
  {"id":17,"pallet":6,"mat":"Acero Carbono","esp":"1.5mm","med":"—","tipo":"—","qty":1,"precio":0.89},
  {"id":18,"pallet":6,"mat":"Acero Carbono","esp":"2mm","med":"760x1500","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":19,"pallet":6,"mat":"Acero Carbono","esp":"3mm","med":"1200x1500","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":20,"pallet":6,"mat":"Acero Carbono","esp":"5mm","med":"1500x1500","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":21,"pallet":6,"mat":"Acero Carbono","esp":"6mm","med":"200x1500","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":22,"pallet":6,"mat":"Acero Carbono","esp":"6mm","med":"1100x1500","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":23,"pallet":7,"mat":"Acero Corten","esp":"2mm","med":"—","tipo":"Entera","qty":1,"precio":1.74},
  {"id":24,"pallet":7,"mat":"Acero Corten","esp":"2mm","med":"1200x1500","tipo":"Recorte","qty":1,"precio":1.74},
  {"id":25,"pallet":7,"mat":"Acero Corten","esp":"3mm","med":"—","tipo":"Entera","qty":1,"precio":1.74},
  {"id":26,"pallet":7,"mat":"Acero Corten","esp":"3mm","med":"1470x1220","tipo":"Recorte","qty":1,"precio":1.74},
  {"id":27,"pallet":8,"mat":"Acero Carbono","esp":"1.5mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},
  {"id":28,"pallet":8,"mat":"Acero Carbono","esp":"2mm","med":"—","tipo":"Entera","qty":4,"precio":0.89},
  {"id":29,"pallet":8,"mat":"Acero Descapado","esp":"1.5mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},
  {"id":30,"pallet":8,"mat":"Acero Descapado","esp":"2mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},
  {"id":31,"pallet":8,"mat":"Acero Descapado","esp":"2mm","med":"1000x2000","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":32,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"—","tipo":"Entera","qty":2,"precio":0.89},
  {"id":33,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2000x460","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":34,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"1220x1000","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":35,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"1225x920","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":36,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2070x450","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":37,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"1220x655","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":38,"pallet":8,"mat":"Acero Descapado","esp":"3mm","med":"2350x460","tipo":"Recorte","qty":1,"precio":0.89},
  {"id":39,"pallet":9,"mat":"Acero Carbono","esp":"6mm","med":"1500x1500","tipo":"Entera","qty":1,"precio":0.89},
  {"id":40,"pallet":9,"mat":"Acero Carbono","esp":"6mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},
  {"id":41,"pallet":9,"mat":"Acero Carbono","esp":"8mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},
  {"id":42,"pallet":9,"mat":"Acero Carbono","esp":"10mm","med":"—","tipo":"Entera","qty":1,"precio":0.89},
  {"id":43,"pallet":9,"mat":"Acero Carbono","esp":"12mm","med":"—","tipo":"Entera","qty":1,"precio":0.89}
],"nextId":44,"historial":[],"agotados":[],"ts":1700000000000};

async function leerStock() {
  if (!db) return STOCK_INICIAL;
  try {
    const doc = await db.collection(COL_NAME).findOne({ _id: 'stock' });
    return doc ? doc.data : STOCK_INICIAL;
  } catch(e) { return STOCK_INICIAL; }
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
  } catch(e) { return false; }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Servir archivos estáticos
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
    } catch(e) {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/stock') {
    const data = await leerStock();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data)); return;
  }

  if (req.method === 'POST' && req.url === '/stock') {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(b);
        await guardarStock(data);
        res.writeHead(200); res.end('{"ok":true}');
      } catch(e) { res.writeHead(400); res.end('error'); }
    }); return;
  }

  res.writeHead(404); res.end('not found');
});

conectarDB().then(() => {
  server.listen(PORT, () => console.log('Servidor Stock Chapas Fischer Montajes - Puerto ' + PORT));
});
