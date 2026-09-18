# AppScraper — réplica funcional de appkittie.com

Rama de trabajo: `claude/replicate-appkittie-web-qft5y2`
Modo: autónomo (Routine horaria). Al despertar: leer este archivo, coger la primera tarea `[ ]`, implementarla, commit+push, marcarla `[x]`.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind v4
- SQLite (better-sqlite3) como almacén local
- Scrapers: iTunes/App Store API + Google Play (scraping HTML)
- Sin pasarela de pago: TODO gratis, sin paywall

## Tareas
- [x] 1. Scaffold Next.js + Tailwind + estructura de carpetas
- [x] 2. Design system (tokens verde/oscuro, tipografía, componentes base: Button, Chip, FilterDropdown, Card, Table)
- [x] 3. Shell del dashboard: sidebar (Explore/Favorites/ASO Tracking/Tools/AI Agents) + user footer + colapsable
- [x] 4. Capa de datos: schema SQLite + repositorios + seed
- [x] 5. Scraper App Store (búsqueda, lookup, top charts, reviews)
- [x] 6. Scraper Google Play (escrito; sin verificar por bloqueo de red) (búsqueda, detalle, top charts, reviews)
- [x] 7. Estimaciones (downloads/revenue/MRR) heurísticas
- [x] 8. Página Explore Apps: buscador + 14 filtros + chips activos + tabla/grid + export CSV
- [x] 9. Página Ads Library (grouped/ads, filtros, creatividades)
- [x] 10. Página Organic Content (creator videos, filtros)
- [x] 11. Página Onboarding Flows (screens/apps, categorías de pantalla)
- [x] 12. Páginas Trending y Rising
- [x] 13. Store Rankings (Top Free/Paid/Grossing, país, categoría, ambas tiendas)
- [x] 14. Favoritos (Apps/Ads/Organic) con persistencia
- [x] 15a. Keyword Explorer
- [ ] 15b. Your Apps + Add App
- [x] 16. Review Analytics
- [ ] 17. Competitor Tracking
- [ ] 18. Páginas MCP y API (docs + endpoints reales)
- [ ] 19. Auth simple (cuenta local) y perfil de usuario
- [ ] 20. Jobs de refresco de datos + botón refresh en cada página
- [ ] 21. Landing pública
- [x] 22. (parcial)  Pulido responsive, estados vacíos, loading skeletons
- [ ] 23. Tests + README

## Notas de sesión
- El registro npmjs.org devuelve 503 en este entorno. Usar el mirror:
  `npm config set registry https://registry.yarnpkg.com/`
- Rutas del dashboard ya creadas; cada una con placeholder hasta implementarla.

## Bloqueo de red (importante)
La política de egress de este contenedor **no permite** `itunes.apple.com`,
`rss.applemarketingtools.com`, `play.google.com` ni `apps.apple.com` (todas devuelven
"Host not in allowlist"). Por eso:
- Los módulos de `src/lib/sources/` están escritos y tipados, pero **no se pueden verificar
  contra la red aquí**. Funcionarán cuando esos hosts estén permitidos.
- Mientras tanto se trabaja con un **dataset sembrado (fixtures)** para que toda la UI sea
  navegable y funcional, con la misma forma de datos que devuelven los scrapers.
Para activarlo de verdad: añadir esos hosts al allowlist de egress del entorno.
