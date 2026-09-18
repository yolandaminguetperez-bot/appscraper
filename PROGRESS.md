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
- [x] 15b. Your Apps + Add App
- [x] 16. Review Analytics
- [x] 17. Competitor Tracking
- [x] 18. Páginas MCP y API (docs + endpoints reales)
- [~] 19. Auth: NO se implementa a propósito — el producto es gratis y sin cuenta.
      Los datos se guardan en la base local. Si algún día hace falta multiusuario,
      es el único punto que habría que añadir.
- [x] 20. Jobs de refresco de datos + botón refresh en cada página
- [x] 21. Landing pública
- [x] 22.  Pulido responsive, estados vacíos, loading skeletons
- [x] 23. Tests + README

## Trabajo posterior al plan inicial (feedback: "que se vea, no que haya que adivinar")
- [x] A. Creatividades de ads reproducibles en línea (hover play + visor con controles)
- [x] B. Vídeos de creadores reproducibles en Organic y Favoritos
- [x] C. Gráficos de tendencia con ejes, total exacto, delta, tooltip y vista de tabla
- [x] D. Métricas diarias con tendencia/estacionalidad (antes eran constantes: línea plana)
- [x] E. Pantallas de onboarding renderizadas como mockups, no como etiquetas
- [x] F. Series por día para Trending/Rising (mini gráfico por fila)
- [x] G. Evolución de rating en Review Analytics
- [x] H. Gráfico de posición histórica en Store Rankings
- [x] I. Iconos de app generados (hash del id) en todas las vistas
- [x] J. Página Overview con KPIs, barras y tendencias
- [x] K. Galería de capturas en el detalle de app
- [x] L. Modo oscuro completo de la interfaz
- [x] M. Comparador de apps lado a lado
- [x] N. Comparación por países en Store Rankings (NO es un mapa geográfico:
      dibujar fronteras requiere un dataset de geometría que no puedo descargar
      aquí por la política de red, y no voy a inventar un mapa falso. En su
      lugar: solapamiento de charts entre países, que responde a la pregunta
      real — "¿este mercado se parece al mío?")
- [x] O. Vista de tarjetas (grid) alternativa a la tabla en Explore Apps
- [ ] P. Mapa geográfico real (requiere permitir un host con geometría, p.ej. Natural Earth)
- [ ] Q. Vista de tarjetas también en Favoritos y Trending
- [x] R. Pasada de UX: paleta de comandos, orden por columna, foco visible,
      feedback al filtrar, jerarquía de filtros, tabla usable en móvil
- [x] S. Guardar vistas/filtros con nombre (en Explore Apps; falta llevarlo a
      Ads/Organic/Onboardings, que comparten la misma mecánica de filtros)
- [ ] T. Selector de resultados por página

## Sobre los logos reales
Los CDN de arte de las tiendas (is1-ssl.mzstatic.com, play-lh.googleusercontent.com)
están BLOQUEADOS en este entorno, igual que las APIs. No se pueden traer logos reales
y no se van a imitar marcas ajenas. Lo que se ve son marcas generadas por hash del id.
En cuanto `icon_url` tenga valor (scrapers con red), el icono real gana automáticamente.

## Rendimiento (medido, no supuesto)
- `npm run stress` mide percentiles por ruta. 0 errores en todo lo probado.
- Cuello de botella real a escala: peso de la respuesta (~380 KB/página), no la BD.
- better-sqlite3 es SÍNCRONO: un agregado lento bloquea TODAS las peticiones.
  Por eso los agregados de catálogo van memorizados con invalidación en escritura.
- Pendiente si hace falta más: reducir filas por página, y varios procesos
  detrás de un balanceador (un proceso Node = un núcleo).

## Aviso para el yo futuro
NO borrar `data/appscraper.db` con el servidor levantado: mantiene abierto el fichero
borrado y sigue sirviendo datos fantasma con ids que ya no existen. Parar el servidor,
reseed, arrancar.

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
