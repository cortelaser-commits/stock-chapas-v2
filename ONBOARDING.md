# Fischer Cutting — Stock & Cotizaciones App

## ¿Qué es esta app?

Aplicación web de gestión interna para **Fischer Cutting** (corte láser y trabajos en chapa). Permite:

- **Stock de chapas**: seguimiento de materiales con cantidades, precios en USD, alertas de stock bajo
- **Cotizador**: calculadora de presupuestos con materiales, medidas, terminaciones, descuentos
- **Historial de cotizaciones**: gestión de estados (pendiente → aceptada → cortada → terminada → entregada), cobros y pagos parciales
- **Pedidos para cotizar**: lista de trabajos pendientes de presupuestar
- **Órdenes de trabajo**: documento imprimible para el taller (sin precios, con detalles de producción)
- **Laser**: stock separado para ítems de corte láser
- **Estadísticas**: resumen mensual de kg cortados y facturación

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Frontend | HTML/CSS/JS en un solo archivo (`index.html`) |
| Backend | Node.js (`servidor.js`) — servidor HTTP puro, sin framework |
| Base de datos | MongoDB Atlas (un solo documento `_id: 'stock'`) |
| Hosting | Render.com (free tier, con cold start ~30s) |
| Repositorio | GitHub |

---

## Estructura del proyecto

```
stock-chapas-v2/
├── index.html          # Toda la app frontend (UI + lógica + estilos)
├── servidor.js         # Backend Node.js
├── package.json        # Dependencias (solo mongodb)
├── .gitignore
├── ONBOARDING.md       # Este archivo
└── backup_data_YYYY-MM-DD.json  # Snapshots de datos
```

---

## Variables de entorno (Render)

| Variable | Descripción |
|---|---|
| `MONGO_URL` | Connection string de MongoDB Atlas |
| `PORT` | Puerto (Render lo asigna automáticamente) |

---

## Cómo deployar desde cero

### 1. MongoDB Atlas
1. Crear cuenta en [mongodb.com/atlas](https://mongodb.com/atlas)
2. Crear cluster gratuito (M0)
3. Crear database `stockchapas`, collection `stock`
4. Copiar el connection string (`mongodb+srv://...`)

### 2. Render.com
1. Crear cuenta en [render.com](https://render.com)
2. New → Web Service → conectar el repositorio GitHub
3. Configuración:
   - **Build command**: `npm install`
   - **Start command**: `node servidor.js`
   - **Environment variable**: `MONGO_URL = <tu connection string>`
4. Deploy

### 3. Restaurar datos
Una vez que el servidor esté corriendo, restaurar el último backup:

```javascript
// Ejecutar en la consola del navegador con la app abierta
// Primero cargar el archivo backup_data_YYYY-MM-DD.json
const backup = /* pegar el contenido del JSON aquí */;
fetch('/stock', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(backup)
}).then(r => r.json()).then(d => console.log('Restaurado:', d));
```

O desde PowerShell:
```powershell
$backup = Get-Content "backup_data_YYYY-MM-DD.json" | ConvertFrom-Json
Invoke-RestMethod -Uri 'https://TU-APP.onrender.com/stock' -Method POST -Body (ConvertTo-Json $backup -Depth 20) -ContentType 'application/json'
```

---

## Estructura de datos (MongoDB)

El servidor guarda **un solo documento** con toda la información:

```json
{
  "_id": "stock",
  "data": {
    "items": [...],           // Stock de chapas
    "nextId": 100,            // ID autoincremental para items
    "historial": [...],       // Historial de consumos
    "laserItems": [...],      // Stock laser
    "laserNextId": 1,
    "cotizaciones": [...],    // Historial de cotizaciones
    "cotNextNum": 423,        // Próximo número de cotización
    "pedidos": [...],         // Pedidos pendientes de cotizar
    "agotados": [...],        // Items marcados como agotados
    "ts": 1781037206000       // Timestamp último guardado
  }
}
```

### Estructura de una cotización

```json
{
  "id": 1781037206153,        // timestamp en ms (número)
  "ts": 1781017200000,        // fecha de creación (timestamp ms)
  "num": 85,                  // número de presupuesto
  "job": "Nombre del trabajo",
  "origen": "instagram",      // canal de contacto (opcional)
  "cant": 2,
  "mat": "Acero Corten",
  "esp": "3",                 // espesor en mm
  "ancho": "400",             // mm
  "largo": "600",             // mm
  "medidaCliente": "40×60 cm",
  "pintura": false,
  "colorPintura": "",
  "oxid": true,
  "golpes": 0,
  "total": 15000,
  "totalConDesc": 15000,
  "estado": "pendiente",      // pendiente|aceptada|cortada|terminada|lista|rechazada
  "pagos": [],                // [{id, monto, forma, fecha}]
  "ajuste": null              // {monto, detalle} o null
}
```

---

## APIs del servidor

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/stock` | Devuelve todos los datos |
| POST | `/stock` | Guarda todos los datos (reemplaza todo) |
| PATCH | `/stock/item/:id` | Actualiza qty/precio de un ítem |
| PATCH | `/stock/cotizacion/:id` | Actualiza estado de una cotización |
| PATCH | `/stock/consumo/:id` | Edita un consumo del historial |
| PATCH | `/stock/laser/:id` | Actualiza qty de ítem laser |

---

## Notas importantes

### IDs
- Los IDs siempre son **números** (`Date.now()`)
- El ID nuevo se genera como `Math.max(Date.now(), maxIdExistente + 1)` para evitar duplicados si el reloj del sistema está mal
- Si hay IDs string como `"cot-1234"`, el frontend los sanitiza automáticamente al cargar

### Guardado
- El frontend tiene un debounce de 1.5s antes de guardar al servidor
- Hay un GUARD que **bloquea el guardado** si la cantidad de cotizaciones en memoria es menor que la que se cargó del servidor (protege contra borrado accidental)
- El guardado también se hace vía PATCH liviano para cambios de estado individuales

### LocalStorage
- `cache_local`: caché del último estado conocido
- `backup_0/1/2`: backups rotativos (el 0 es el más reciente)
- Si el servidor falla, la app carga desde estos backups
- Con muchos datos puede haber `QuotaExceededError` (5MB límite del navegador) — el error se maneja silenciosamente

### Render cold start
- En el plan gratuito, el servidor "duerme" después de 15 min sin actividad
- El primer request puede tardar 30-60 segundos en despertar
- La app muestra "⚠️ Servidor no disponible" durante ese tiempo y reintenta automáticamente

---

## Backup de datos

### Hacer un backup manual (PowerShell)
```powershell
$data = Invoke-RestMethod 'https://stock-chapas-v2.onrender.com/stock'
$date = Get-Date -Format "yyyy-MM-dd"
$data | ConvertTo-Json -Depth 20 | Out-File "backup_data_$date.json" -Encoding utf8
```

### Hacer un backup desde la consola del navegador
```javascript
fetch('/stock').then(r=>r.json()).then(d=>{
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(JSON.stringify(d,null,2));
  a.download='backup_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
});
```

---

## Estado al 09/06/2026

- **53** ítems de stock
- **69** cotizaciones (cotNextNum: 423)
- **25** registros de historial
- Último commit: `9f67e1a` — Origen de contacto en pedidos para cotizar
