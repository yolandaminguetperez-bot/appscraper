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
- [x] Y. Keyword Explorer: banda verbal de dificultad (Open/Moderate/Hard/Brutal)
      y panel "terms used alongside it" — términos que comparten título con los
      competidores, puntuados dentro de ese subconjunto y enlazables
- [x] Z. Detalle de app: bloque "keywords in this title" con nº de apps
      compitiendo y dificultad de cada término, enlazado al Keyword Explorer
- [x] AA. Memoización de queryTrending (medido a 25k apps: 138 ms de los 155 ms
      de la página, repetidos en cada request; ahora ~35 ms en caliente). Las
      queries de Rankings y keywords se midieron también: 24 ms y 10-20 ms a
      25k, así que NO se tocaron — el techo restante es CPU de render en un
      solo proceso, no la base de datos
- [x] AB. Peso de página: corazón de favoritos al sprite (se repetía 51 veces
      por página) y coordenadas enteras en los mini gráficos. Explore Apps pasa
      de 388 KB a 352 KB (-9,4%); el sprite se emite una vez en el layout
- [x] AC. Export CSV en Ads, Organic y Review Analytics (antes solo Explore
      Apps), respetando los filtros activos; helper compartido en src/lib/csv.ts
      y botón único ExportButton; documentados en /dashboard/api y cubiertos por
      4 checks nuevos de e2e (33 en total) que re-parsean el CSV
- [x] P. Mapa geográfico real. raw.githubusercontent.com SÍ es alcanzable desde
      este entorno (jsdelivr y unpkg no), así que la geometría de Natural Earth
      110m (dominio público) se descarga, se proyecta en Equal Earth y se
      simplifica en scripts/make-world-geo.mjs -> src/lib/geo/world.json (78 KB,
      175 países). Coropleta del solapamiento de charts, con rampa secuencial de
      un solo tono validada contra el relleno "sin datos" (ΔE >= 17 en OKLab en
      ambos modos), leyenda, tooltip nativo, países clicables y tabla de cifras.
      El mapa base va como imagen cacheada para siempre (/api/world-map): en
      línea costaba ~156 KB por vista, porque un componente de servidor se
      serializa en el HTML y otra vez en el payload RSC.
      Limitación de la fuente: Singapur no está en el dataset 110m.
- [x] AD. El mapa es genérico (WorldMap recibe valores por país, no una forma
      concreta) y se reutiliza en Ads Library: "dónde se ven estos ads",
      contando creatividades por país sobre la selección filtrada. Los países del
      mapa son además un filtro: click filtra a ese país, click de nuevo lo quita.
      El alcance del filtro depende de la vista — apps que anuncian ALLÍ (126) vs
      creatividades que corren allí (196); cuadran con la base de datos
- [x] AE. Mapa "dónde anuncia esta app" en el detalle, contado sobre las
      creatividades ya cargadas en la página (sin segunda query) y enlazado a
      Ads Library filtrado por app y país
- [~] Re-verificadas las APIs de tiendas y los CDN de arte: siguen denegados por
      política de red (connect_rejected). No es una suposición heredada
- [x] Q. Vista de tarjetas también en Favoritos/apps, Trending y Rising (mismo ViewToggle)
- [x] U. Pasada visual del resto de páginas: Organic (tarjetas con métricas),
      API (índice pegajoso + copiar), MCP, landing (preview con datos reales)
- [x] V1. Detalle de app: cabecera con badges + favorito, ads y vídeos de creadores
      reproducibles en vez de listas de texto
- [x] V2. Pasada visual en Favoritos/apps, Your Apps y Competitors: rejilla de
      tarjetas con estados vacíos guiados (título, explicación y acción)
- [x] W. Página de portfolio de developer (/dashboard/developers/[name]): KPIs
      combinados, reparto por categoría y tabla de apps; el nombre del developer
      es enlace desde la tabla, la rejilla y el detalle de app
- [x] X. Bloque "apps de tamaño similar en esta categoría" en el detalle de app
- [x] R. Pasada de UX: paleta de comandos, orden por columna, foco visible,
      feedback al filtrar, jerarquía de filtros, tabla usable en móvil
- [x] S. Guardar vistas/filtros con nombre en Explore Apps, Ads, Organic y Onboardings
- [x] T. Selector de resultados por página en Apps, Ads, Organic, Onboardings
      y Reviews (junto al contador; visible también con una sola página, que
      es justo cuando se quiere subir el tamaño)

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

## Interactividad
- [x] I1. Selección de apps con checkbox en tabla y rejilla, que SOBREVIVE a la
      navegación (sessionStorage, no la URL: cambiar un filtro la borraría), con
      barra flotante "N selected → Compare". El parámetro del comparador es
      `app`, no `ids` — con `ids` la comparación salía vacía en silencio
- [x] I2. Panel "quick look": inspecciona una app sobre la lista, sin perder
      filtros ni scroll. Carga por fetch al detalle de la API, se cierra con
      Escape o clic fuera, y limpia los datos al cambiar de app para no enseñar
      las cifras de una bajo el nombre de otra
- [x] I3. Tooltip real en los mapas (seguía al puntero, aparece también al
      tabular con el teclado) en lugar del <title> nativo, que tarda un segundo,
      no se puede estilar y no existe para teclado
- [x] I4. Quick look y selección en Trending, Rising y Store Rankings, no solo
      en Explore Apps; la categoría de cada fila es un enlace que filtra
- [x] I5. El quick look actúa, no solo informa: guardar en favoritos y seguir
      como competidor desde el panel, con estado real leído de /api/app-state
      (fuera de /api/v1, que es la forma pública documentada)
- [x] I6. Iconos: el arte real de la tienda gana siempre; el icono generado pasa
      a ser SOLO fallback (fila sin icon_url todavía, o icon_url que falla al
      cargar) en vez de imagen rota. scripts/backfill-icons.mjs rellena el arte
      real desde las tiendas. En ESTE entorno los cuatro hosts responden 403,
      y el catálogo sembrado son apps inventadas: no existe icono original que
      traer hasta que los scrapers traigan apps reales

## Pasada de diseño
- [x] D1. Tipografía propia, autoalojada (72 KB): Instrument Sans para la
      interfaz e IBM Plex Mono para TODO número en posición de dato. El host de
      Google Fonts está bloqueado en algunos entornos y un <link> bloqueado
      retrasa el primer pintado, así que los ficheros viajan con la app
- [x] D2. Roles de color: par semántico --pos/--neg para deltas (el verde de
      marca no puede decir "sube" en una página hecha de verde de marca) y tres
      elevaciones en vez de una sombra de tarjeta estampada en todo
- [x] D3. Tabla de apps con jerarquía: nombre destacado, barra de magnitud SOLO
      en la columna por la que ordenas, cabecera pegajosa, acciones en reposo
      ocultas, categorías como chips clicables
- [x] D4. "Releases per month" pasa de línea de área a columnas (son buckets
      discretos; la línea insinuaba un movimiento que el dato no tiene) y el mes
      en curso va rayado y fuera del delta: comparaba un mes a medias contra uno
      completo y cantaba un -88% falso
- [x] D5. Ads Library: el mapa colapsado a una tira; a pantalla completa empujaba
      las creatividades —el motivo de la página— por debajo del pliegue
- [x] D6. Datos nuevos: posiciones de keywords por app y día (las tablas
      keywords/keyword_ranks existían en el esquema y estaban VACÍAS: diseñadas
      y sin sembrar) y reparto por país en app_countries. 98 keywords, 5.880
      posiciones y 2.940 filas de países en el set de 420 apps
- [x] D7. Ficha de app: "Search rankings" (posición, movimiento a 30 días y
      sparkline invertida — la posición 1 es la mejor, sin invertir una subida
      se dibujaría como desplome) y "Where the money comes from"
- [x] D8. Keyword Explorer separa quién RANKEA por el término (posiciones reales)
      de quién solo lo MENCIONA (coincidencia de texto), que es lo único que
      sabía antes
- [x] D9. Navegación por teclado en la tabla: j/k (y flechas) mueven, Enter abre,
      Espacio abre la vista rápida, s selecciona. El resaltado es una clase en la
      fila, no foco: enfocar la fila robaría el foco a sus enlaces
- [x] D10. La vista rápida muestra mercados y posiciones de búsqueda; /api/v1/apps/{id}
      los expone también (son datos de la app, no estado de interfaz)
- [x] BUG. Sembrar keywords con INSERT OR REPLACE borraba posiciones: la fila de
      keyword la COMPARTEN las apps que compiten por el término, REPLACE es
      DELETE+INSERT y el ON DELETE CASCADE se llevaba lo ya escrito. 353 de 420
      apps perdieron su histórico y la tabla seguía pareciendo llena. Upsert en
      sitio; 5.880 -> 73.500 posiciones. Hay check de regresión por cobertura

## Funcionalidad nueva
- [x] F1. Alertas: reglas por app y métrica (descargas, revenue, reseñas, rating)
      con umbral y ventana, creadas desde la ficha con "Alert me", evaluadas
      contra el histórico real en cada visita, página /dashboard/alerts con
      "firing now" vs "watching", y contador en la barra lateral. No se guardan
      filas de "disparado": una alerta es una pregunta a los datos, y guardar el
      disparo se desincroniza de la métrica en cuanto hay un refresh
- [x] F2. Store Rankings: 14 días de chart en vez de una foto de hoy, y panel
      "what moved" con quién sube, baja, ENTRA y SALE del top. Un chart de un
      solo día dice quién es el #3 pero no quién se está moviendo, que es para
      lo que se mira. La comparación busca el día almacenado más cercano, así
      que un hueco en la recogida compara contra datos reales en vez de no
      devolver nada

