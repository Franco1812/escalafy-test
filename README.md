# Reporting Dashboard

Multi-channel reporting dashboard built with Next.js, TypeScript, and PostgreSQL.

## Setup

### 1. Base de datos

Necesitás PostgreSQL corriendo localmente. Creá una base de datos y ejecutá el seed:

```bash
psql -U postgres -d escalafy -f database/seed.sql
```

### 2. Variables de entorno

Creá un archivo `.env.local` en la raíz:

```
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/escalafy
```

### 3. Dependencias

```bash
npm install
```

### 4. Iniciar

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## Arquitectura

```
lib/
  db.ts          — Pool de conexión a PostgreSQL (pg)
  metrics.ts     — Definiciones de métricas, dependencias y lógica de cálculo
  reporting.ts   — Función getReport(): consulta la DB y orquesta los cálculos

app/
  page.tsx                      — Server component: llama getReport() directamente (SSR)
  components/DashboardClient.tsx — Client component: controles interactivos + UI
  api/reporting/route.ts        — GET /api/reporting: expone getReport() como REST API
```

## Decisiones clave

**Sin ORM** — Para este proyecto no necesitaba uno. Las consultas son straightforward y escribirlas en SQL directo es más claro que agregar una capa extra. Menos dependencias, menos cosas que pueden fallar.

**Cada archivo tiene una sola razón para cambiar** — Si mañana cambia cómo se calcula el ROAS, solo toco `metrics.ts`. Si cambia la estructura de la DB, solo toco `reporting.ts`. Si cambia la UI, solo toco el componente. Nadie pisa el trabajo de nadie.

**Las métricas calculadas no se piden a la DB** — Cosas como ROAS o profit no existen en la base de datos, se calculan en código a partir de los valores que sí están guardados. La función sabe automáticamente qué datos necesita fetchear según las métricas que se piden, sin traer más de lo necesario.

**Los totales se calculan bien** — Un error común es promediar los valores diarios para obtener el total del período. Acá primero se suman todos los valores raw y después se aplican las fórmulas, lo que da el resultado correcto (especialmente importante para métricas como ROAS o CPM).

**La primera carga es instantánea** — El servidor arma la página con datos reales antes de enviársela al browser. El usuario ve números desde el primer momento, sin loaders ni esperas. Los filtros interactivos después usan la API normalmente.

**Los tests cubren lo que vale la pena testear** — La lógica de cálculo de métricas (`metrics.ts`) no toca la DB ni el framework, así que es fácil y valioso testearla. El resto (rutas, UI) tiene más sentido cubrirlo con tests de integración o E2E, que quedarían fuera del scope de esta prueba.

```bash
npm test
```

## API

### `GET /api/reporting`

| Param | Tipo | Descripción |
|-------|------|-------------|
| `orgId` | number | ID de la organización |
| `startDate` | string | Inicio del rango (YYYY-MM-DD) |
| `endDate` | string | Fin del rango (YYYY-MM-DD) |
| `metrics` | string | Métricas separadas por coma |

**Métricas disponibles:** `meta_spend`, `meta_impressions`, `google_spend`, `google_impressions`, `revenue`, `orders`, `fees`, `meta_cpm`, `google_cpm`, `average_order_value`, `total_spend`, `profit`, `roas`

**Ejemplo:**
```
GET /api/reporting?orgId=1&startDate=2026-02-09&endDate=2026-03-10&metrics=revenue,profit,roas
```

**Respuesta:**
```json
{
  "totals": { "revenue": 66540, "profit": 49554.05, "roas": 4.44 },
  "daily": [
    { "date": "2026-02-09", "revenue": 1890, "profit": 1409.50, "roas": 4.46 }
  ]
}
```
