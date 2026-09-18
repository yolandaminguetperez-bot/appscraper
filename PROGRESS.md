# AppScraper — réplica funcional de appkittie.com

Rama de trabajo: `claude/replicate-appkittie-web-qft5y2`
Modo: autónomo (Routine horaria). Al despertar: leer este archivo, coger la primera tarea `[ ]`, implementarla, commit+push, marcarla `[x]`.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind v4
- SQLite (better-sqlite3) como almacén local
- Scrapers: iTunes/App Store API + Google Play (scraping HTML)
- Sin pasarela de pago: TODO gratis, sin paywall

## Tareas
- [ ] 1. Scaffold Next.js + Tailwind + estructura de carpetas
- [ ] 2. Design system (tokens verde/oscuro, tipografía, componentes base: Button, Chip, FilterDropdown, Card, Table)
- [ ] 3. Shell del dashboard: sidebar (Explore/Favorites/ASO Tracking/Tools/AI Agents) + user footer + colapsable
- [ ] 4. Capa de datos: schema SQLite + repositorios + seed
- [ ] 5. Scraper App Store (búsqueda, lookup, top charts, reviews)
- [ ] 6. Scraper Google Play (búsqueda, detalle, top charts, reviews)
- [ ] 7. Estimaciones (downloads/revenue/MRR) heurísticas
- [ ] 8. Página Explore Apps: buscador + 14 filtros + chips activos + tabla/grid + export CSV
- [ ] 9. Página Ads Library (grouped/ads, filtros, creatividades)
- [ ] 10. Página Organic Content (creator videos, filtros)
- [ ] 11. Página Onboarding Flows (screens/apps, categorías de pantalla)
- [ ] 12. Páginas Trending y Rising
- [ ] 13. Store Rankings (Top Free/Paid/Grossing, país, categoría, ambas tiendas)
- [ ] 14. Favoritos (Apps/Ads/Organic) con persistencia
- [ ] 15. Keyword Explorer + Your Apps + Add App
- [ ] 16. Review Analytics
- [ ] 17. Competitor Tracking
- [ ] 18. Páginas MCP y API (docs + endpoints reales)
- [ ] 19. Auth simple (cuenta local) y perfil de usuario
- [ ] 20. Jobs de refresco de datos + botón refresh en cada página
- [ ] 21. Landing pública
- [ ] 22. Pulido responsive, estados vacíos, loading skeletons
- [ ] 23. Tests + README

## Notas de sesión
- (vacío)
