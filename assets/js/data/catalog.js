/**
 * catalog.js
 * Wrapper canónico y puente retrocompatible de Live Bands Music para 2027.
 * Conecta con la Fuente Única de Verdad (SSOT) catalog.json y expone tanto
 * las nuevas APIs de consulta por momento/estilo como los alias clásicos
 * que garantizan el funcionamiento ininterrumpido del Cockpit actual (app.js/pricing.js).
 */

// Importación estática del catálogo canónico para entornos con soporte de módulos JSON / fallback bundle
export const CATALOG_SOURCE = {
  version_catalogo: "2027.1.0",
  updated_at: "2026-09-22",
  empresa: {
    nombre: "Live Bands Music",
    director: "Santiago Cholbi",
    base_operativa: "Peralada, Girona (Catalunya)",
    telefono: "+34 627 37 03 34",
    web: "https://livebandsmusic.com"
  }
};

// Formaciones musicales en directo (90 minutos de actuación)
export const FORMATIONS_BASE = [
  {
    id: "SOLO",
    name: "Solo",
    price: 495,
    hasVocals: false,
    musicos_cantidad: 1,
    musicos_roles: [
      { rol: "Músico Solista", cache_individual_eur: 495 }
    ],
    rider_sonido_minimo_id: "none",
    toma_electrica: "16A standard",
    instruments: "Solista instrumental o voz/guitarra acústica",
    description: "Ideal para momentos íntimos, ceremonias o recepciones reducidas.",
    paxRecommendation: "Hasta 50 PAX • Momentos íntimos y rito",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "DUO",
    name: "Duo",
    price: 795,
    hasVocals: true,
    musicos_cantidad: 2,
    musicos_roles: [
      { rol: "Voz principal / Solista", cache_individual_eur: 395 },
      { rol: "Instrumento armónico (Guitarra / Teclado)", cache_individual_eur: 400 }
    ],
    rider_sonido_minimo_id: "basic",
    toma_electrica: "16A standard",
    instruments: "Voz y piano / Voz y guitarra",
    description: "Equilibrio acústico para cócteles elegantes o ceremonias solemnes.",
    paxRecommendation: "Hasta 100 PAX • Formato acústico elegante",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "TRIO",
    name: "Trio",
    price: 1145,
    hasVocals: true,
    musicos_cantidad: 3,
    musicos_roles: [
      { rol: "Voz principal", cache_individual_eur: 385 },
      { rol: "Instrumento armónico (Guitarra / Piano)", cache_individual_eur: 380 },
      { rol: "Base rítmica / Percusión / Bajo", cache_individual_eur: 380 }
    ],
    rider_sonido_minimo_id: "basic",
    toma_electrica: "16A standard",
    instruments: "2 voces y piano / Voz, guitarra y percusión",
    description: "La formación más versátil para aperitivos dinámicos y amenización viva.",
    paxRecommendation: "Hasta 160 PAX • Equilibrio acústico y ritmo",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "QUARTET",
    name: "Quartet",
    price: 1435,
    hasVocals: true,
    musicos_cantidad: 4,
    musicos_roles: [
      { rol: "Voz principal", cache_individual_eur: 360 },
      { rol: "Guitarra / Teclados", cache_individual_eur: 360 },
      { rol: "Bajo eléctrico / Contrabajo", cache_individual_eur: 360 },
      { rol: "Batería / Percusión completa", cache_individual_eur: 355 }
    ],
    rider_sonido_minimo_id: "complete",
    toma_electrica: "16A standard",
    instruments: "Voz, teclado/guitarra, bajo y batería/percusión",
    description: "Sonido de banda completa con ritmo y presencia escénica envolvente.",
    paxRecommendation: "Hasta 220 PAX • Banda completa con percusión",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "QUINTET",
    name: "Quintet",
    price: 1725,
    hasVocals: true,
    musicos_cantidad: 5,
    musicos_roles: [
      { rol: "Voz principal", cache_individual_eur: 345 },
      { rol: "Guitarra solista", cache_individual_eur: 345 },
      { rol: "Teclados / Piano", cache_individual_eur: 345 },
      { rol: "Bajo eléctrico", cache_individual_eur: 345 },
      { rol: "Batería completa", cache_individual_eur: 345 }
    ],
    rider_sonido_minimo_id: "complete",
    toma_electrica: "16A standard",
    instruments: "Voz, guitarra, teclados, bajo, batería y vientos",
    description: "Gran repertorio y versatilidad estilística para aperitivos concurridos.",
    paxRecommendation: "Hasta 300 PAX • Sonido potente y amplio repertorio",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "SEXTET",
    name: "Sextet",
    price: 2015,
    hasVocals: true,
    musicos_cantidad: 6,
    musicos_roles: [
      { rol: "Voz principal", cache_individual_eur: 340 },
      { rol: "Coros / Segunda voz", cache_individual_eur: 340 },
      { rol: "Guitarra / Teclados", cache_individual_eur: 340 },
      { rol: "Bajo eléctrico", cache_individual_eur: 340 },
      { rol: "Batería completa", cache_individual_eur: 340 },
      { rol: "Sección de vientos (Saxo / Trompeta)", cache_individual_eur: 315 }
    ],
    rider_sonido_minimo_id: "complete",
    toma_electrica: "16A standard",
    instruments: "Voz líder, coros, guitarra, bajo, batería, teclado y vientos",
    description: "Espectáculo sonoro de gran formato con metales para eventos de alto perfil.",
    paxRecommendation: "Más de 250 PAX • Gran banda con sección de vientos",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "OCTET",
    name: "Octet",
    price: 2595,
    hasVocals: true,
    musicos_cantidad: 8,
    musicos_roles: [
      { rol: "Director musical / Pianista", cache_individual_eur: 355 },
      { rol: "Voz solista 1", cache_individual_eur: 320 },
      { rol: "Voz solista 2", cache_individual_eur: 320 },
      { rol: "Corista tenor 1", cache_individual_eur: 320 },
      { rol: "Corista tenor 2", cache_individual_eur: 320 },
      { rol: "Corista soprano 1", cache_individual_eur: 320 },
      { rol: "Corista soprano 2", cache_individual_eur: 320 },
      { rol: "Corista contralto", cache_individual_eur: 320 }
    ],
    rider_sonido_minimo_id: "complete",
    toma_electrica: "16A standard",
    instruments: "Gran ensemble: 2 voces, sección de vientos completa, base rítmica",
    description: "Máxima potencia orquestal para galas, bodas multitudinarias y festivales.",
    paxRecommendation: "Eventos multitudinarios (>350 PAX) • Show de gran formato",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  }
];

// Grupos y proyectos propios de Live Bands Music
export const CURATED_BANDS = [
  {
    id: "jazz-de-copes",
    name: "Jazz de Copes",
    genre: "Jazz, Pop, Bossa Nova & Soul",
    styles: ["Jazz", "Bossa Nova", "Soul", "Pop"],
    estilos_ids: ["pop_jazz_soul_bossa"],
    image: "./assets/img/bands/JDC.jpg",
    tagline: "Elegante y versátil, perfecto para dar un toque de distinción a tu ceremonia, aperitivo o fiesta.",
    description: "Estándares de jazz, swing, bossa y pop versionado en clave elegante con instrumentistas de primer nivel.",
    idealFor: ["ceremony", "appetizer", "party"],
    momentos_compatibles: ["ceremonia", "aperitivo", "fiesta_pre_dj"],
    link: "https://livebandsmusic.com/jazz-de-copes/#jdcv4",
    formats: ["DUO", "TRIO", "QUARTET", "QUINTET"],
    formatDetails: [
      { id: "DUO", name: "Dúo (JDC2)", price: 795, instruments: "Voz y guitarra / Voz y piano", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
      { id: "TRIO", name: "Trío (JDC3)", price: 1145, instruments: "2 voces y piano / Voz, guitarra y percusión", idealFor: ["ceremony", "appetizer"], customSongs: 3 },
      { id: "QUARTET", name: "Cuarteto (JDC4)", price: 1435, instruments: "Voz, guitarra/piano, contrabajo y batería", idealFor: ["appetizer", "party"], customSongs: 0 },
      { id: "QUINTET", name: "Quinteto (JDC5)", price: 1725, instruments: "Voz, guitarra, piano, bajo, batería y saxo", idealFor: ["appetizer", "party"], customSongs: 0 }
    ]
  },
  {
    id: "the-guitar-kings",
    name: "The Guitar Kings",
    genre: "Rumba & Flamenco Fusión",
    styles: ["Rumba", "Flamenco Fusión", "Pop Español"],
    estilos_ids: ["rumba_flamenco"],
    image: "./assets/img/bands/TGK.jpg",
    tagline: "Energía mediterránea viva y festiva con guitarras españolas para un evento inolvidable.",
    description: "Rumba flamenca viva y elegante con guitarras españolas, percusión y ritmo envolvente.",
    idealFor: ["ceremony", "appetizer", "party"],
    momentos_compatibles: ["ceremonia", "aperitivo", "fiesta_pre_dj"],
    link: "https://livebandsmusic.com/the-guitar-kings/#tgkp3",
    formats: ["DUO", "TRIO", "QUARTET"],
    formatDetails: [
      { id: "DUO", name: "Dúo", price: 795, instruments: "2 guitarras flamencas o voz y guitarra", idealFor: ["ceremony", "appetizer"], customSongs: 2 },
      { id: "TRIO", name: "Trío (Percussion Trio)", price: 1145, instruments: "Voz/guitarra, guitarra solista y percusión", idealFor: ["ceremony", "appetizer"], customSongs: 3 },
      { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "2 guitarras, bajo y percusión completa", idealFor: ["appetizer", "party"], customSongs: 0 }
    ]
  },
  {
    id: "gospel-on",
    name: "Gospel On",
    genre: "Spiritual & Gospel",
    styles: ["Gospel", "Soul", "Espirituales", "Clásicos Emotivos"],
    estilos_ids: ["gospel", "pop_jazz_soul_bossa"],
    image: "./assets/img/bands/GO.jpg",
    tagline: "Espirituales y armonías vocales conmovedoras para elevar la emoción de tu evento.",
    description: "Armonías vocales profundas y espirituales para ritos nupciales y cócteles de gran calidez humana.",
    idealFor: ["ceremony", "appetizer", "party"],
    momentos_compatibles: ["ceremonia", "aperitivo", "fiesta_pre_dj"],
    link: "https://livebandsmusic.com/gospel-on/#GOTRIO",
    formats: ["DUO", "TRIO", "QUARTET", "OCTET"],
    formatDetails: [
      { id: "DUO", name: "Dúo", price: 795, instruments: "Voz solista y piano", idealFor: ["ceremony"], customSongs: 6 },
      { id: "TRIO", name: "Trío", price: 1145, instruments: "2 voces y piano", idealFor: ["ceremony", "appetizer", "party"], customSongs: 6 },
      { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "3 voces y piano", idealFor: ["ceremony", "appetizer", "party"], customSongs: 6 },
      { id: "OCTET", name: "Octeto", price: 2595, instruments: "Gran coro de 7 voces y piano", idealFor: ["ceremony"], customSongs: 6 }
    ]
  },
  {
    id: "vienna-brava",
    name: "Vienna Brava",
    genre: "Música Clásica & Cuerdas",
    styles: ["Clásica", "Cuerdas", "Bandas Sonoras", "Pop Sinfónico"],
    estilos_ids: ["clasica"],
    image: "./assets/img/bands/VB.jpg",
    tagline: "Arreglos clásicos de alta escuela y bandas sonoras cinematográficas con cuerdas sublimes.",
    description: "Arreglos clásicos de alta escuela y adaptaciones modernas con violines, violonchelo y arpa.",
    idealFor: ["ceremony", "appetizer"],
    momentos_compatibles: ["ceremonia", "aperitivo"],
    link: "https://livebandsmusic.com",
    formats: ["SOLO", "DUO", "TRIO", "QUARTET"],
    formatDetails: [
      { id: "SOLO", name: "Solo", price: 495, instruments: "Violín o arpa clásica", idealFor: ["ceremony"], customSongs: 6 },
      { id: "DUO", name: "Dúo", price: 795, instruments: "Violín y piano / Violín y chelo", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
      { id: "TRIO", name: "Trío", price: 1145, instruments: "Trío de cuerdas y piano", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
      { id: "QUARTET", name: "Cuarteto de Cuerdas", price: 1435, instruments: "2 violines, viola y violonchelo", idealFor: ["ceremony", "appetizer"], customSongs: 6 }
    ]
  },
  {
    id: "sweet-planet",
    name: "Sweet Planet",
    genre: "Disco, Funk, Pop, Soul & Latin",
    styles: ["Disco", "Funk", "Soul", "Pop Bailable", "Latin"],
    estilos_ids: ["disco_funk_rock"],
    image: "./assets/img/bands/SWPL.jpg",
    tagline: "Grandes clásicos del funk, pop, disco y ritmos latinos para mantener a todos bailando.",
    description: "Grandes éxitos funk, soul, pop y disco para ambientar con ritmo desbordante y diversión garantizada.",
    idealFor: ["appetizer", "party"],
    momentos_compatibles: ["aperitivo", "fiesta_pre_dj"],
    link: "https://livebandsmusic.com",
    formats: ["TRIO", "QUARTET", "QUINTET", "SEXTET"],
    formatDetails: [
      { id: "TRIO", name: "Trío", price: 1145, instruments: "Voz, teclados y percusión", idealFor: ["appetizer"], customSongs: 2 },
      { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "Voz, guitarra, bajo y batería", idealFor: ["appetizer", "party"], customSongs: 0 },
      { id: "QUINTET", name: "Quinteto", price: 1725, instruments: "Voz, guitarra, teclados, bajo y batería", idealFor: ["appetizer", "party"], customSongs: 0 },
      { id: "SEXTET", name: "Sexteto", price: 2015, instruments: "Banda completa con sección de metales", idealFor: ["party"], customSongs: 0 }
    ]
  },
  {
    id: "rever-queen",
    name: "Rever Queen",
    genre: "Pop Rock Internacional",
    styles: ["Pop-Rock", "Rock Clásico", "Hits Internacionales"],
    estilos_ids: ["disco_funk_rock", "pop_jazz_soul_bossa"],
    image: "./assets/img/bands/RQ.jpg",
    tagline: "Tributo vibrante a los mayores éxitos del pop-rock internacional en riguroso directo.",
    description: "Clásicos del pop-rock internacional versionados con energía, potencia y sonido de estadio.",
    idealFor: ["ceremony", "appetizer", "party"],
    momentos_compatibles: ["ceremonia", "aperitivo", "fiesta_pre_dj"],
    link: "https://livebandsmusic.com",
    formats: ["DUO", "TRIO", "QUARTET", "QUINTET"],
    formatDetails: [
      { id: "DUO", name: "Dúo Acústico", price: 795, instruments: "Voz y guitarra acústica", idealFor: ["ceremony", "appetizer"], customSongs: 2 },
      { id: "TRIO", name: "Trío", price: 1145, instruments: "Voz, guitarra y batería/cajón", idealFor: ["ceremony", "appetizer"], customSongs: 2 },
      { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "Voz, guitarra eléctrica, bajo y batería", idealFor: ["appetizer", "party"], customSongs: 0 },
      { id: "QUINTET", name: "Quinteto", price: 1725, instruments: "Voz, 2 guitarras, bajo y batería completa", idealFor: ["party"], customSongs: 0 }
    ]
  },
  {
    id: "latin-birds",
    name: "Latin Birds",
    genre: "Boleros & Ritmos Latinos",
    styles: ["Boleros", "Son Cubano", "Música Latina", "Bossa"],
    estilos_ids: ["latin_boleros"],
    image: "./assets/img/bands/LB.jpg",
    tagline: "Boleros románticos y calidez de son cubano para crear una atmósfera íntima y seductora.",
    description: "Boleros románticos, son cubano y ritmos cálidos para recepciones elegantes y atardeceres mágicos.",
    idealFor: ["ceremony", "appetizer", "party"],
    momentos_compatibles: ["ceremonia", "aperitivo", "fiesta_pre_dj"],
    link: "https://livebandsmusic.com",
    formats: ["SOLO", "DUO", "TRIO", "QUARTET"],
    formatDetails: [
      { id: "SOLO", name: "Solo", price: 495, instruments: "Guitarra española y voz latina", idealFor: ["ceremony", "appetizer"], customSongs: 4 },
      { id: "DUO", name: "Dúo", price: 795, instruments: "Voz y guitarra acústica / requinto", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
      { id: "TRIO", name: "Trío", price: 1145, instruments: "Voz, guitarra y percusión latina (bongós/maracas)", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
      { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "Voz, guitarra, bajo y percusión completa", idealFor: ["appetizer", "party"], customSongs: 0 }
    ]
  }
];

// Sonorización profesional
export const SOUND_SYSTEMS = [
  {
    id: "none",
    name: "Sin sonorización",
    price: 0,
    description: "Solo viable para solistas estrictamente acústicos en espacios reducidos y con menos de 200 asistentes.",
    specs: "Sin equipamiento de megafonía.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "basic",
    name: "Basic Sound System",
    price: 400,
    description: "Sonorización profesional ideal para formaciones vocales y aforos estándar.",
    specs: "2 Altavoces Yamaha DXR12 Biamplificados, Mesa de Mezclas Soundcraft UI24R, microfonía inalámbrica/cableada y 1 técnico de sonido.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "complete",
    name: "Complete Sound System",
    price: 900,
    description: "Infraestructura de alta potencia para bandas completas y exteriores amplios.",
    specs: "2 Altavoces Yamaha DXR12, 2 Subwoofers Yamaha DXS15, 4 Monitores Yamaha DXR10, Mesa Soundcraft UI24R, microfonía y 2 técnicos de sonido.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  }
];

// Iluminación profesional
export const LIGHT_SYSTEMS = [
  {
    id: "none",
    name: "Sin iluminación",
    price: 0,
    description: "Para eventos exclusivamente diurnos en exteriores o recintos con iluminación técnica propia.",
    specs: "Sin luces añadidas.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "basic",
    name: "Basic Light System",
    price: 380,
    description: "Iluminación de escenario y zona de actuación con ambiente dinámico.",
    specs: "2 Torres con 4 focos LED Par 64, 2 Torres con 4 cabezas móviles LED y 1 técnico de iluminación.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "complete",
    name: "Complete Light System",
    price: 795,
    description: "Estructura escénica completa con puente y efectos sincronizados.",
    specs: "Sistema DMX con 2 torres PAR LED 64, 1 Puente de 6 m con 4 cabezas móviles LED, 4 Pars LED 64, Láser DMX y 2 técnicos de iluminación.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  }
];

// Tech Packs Oficiales
export const TECH_PACKS = [
  {
    id: "pack-basic",
    name: "Pack Básico (Sonido + Iluminación)",
    shortName: "Basic Tech Pack",
    price: 465,
    soundEquivalent: "basic",
    lightEquivalent: "basic",
    separatePrice: 780,
    savings: 315,
    percentSavings: "40%",
    description: "Sonorización profesional + Iluminación ambiental en un solo montaje (Ideal hasta 150 invitados).",
    soundSummary: "2 Altavoces Yamaha DXR12, mesa digital Soundcraft UI24R y micrófonos inalámbricos.",
    lightSummary: "2 Torres con focos LED Par 64 y 2 torres con cabezas móviles para zona de música.",
    includes: "2 Yamaha DXR12, mesa Soundcraft, 4 focos LED, cabezas móviles y técnico de sonido/luz dedicado.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "pack-medium",
    name: "Pack Medio (Sonido Completo + Iluminación)",
    shortName: "Medium Tech Pack",
    price: 975,
    soundEquivalent: "complete",
    lightEquivalent: "basic",
    separatePrice: 1280,
    savings: 305,
    percentSavings: "24%",
    description: "Sonorización de alta potencia con subwoofers + Iluminación básica (Ideal exteriores y bandas grandes).",
    soundSummary: "2 Altavoces Yamaha DXR12 + 2 Subwoofers DXS15 + 4 monitores de escenario.",
    lightSummary: "2 Torres con focos LED Par 64 y 2 torres con cabezas móviles.",
    includes: "Sistema de sonido completo con subwoofers, monitores, microfonía, iluminación y 2 técnicos.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  },
  {
    id: "pack-complete",
    name: "Pack Completo (Gran Escenario & Puente 6m)",
    shortName: "Complete Tech Pack",
    price: 1270,
    soundEquivalent: "complete",
    lightEquivalent: "complete",
    separatePrice: 1695,
    savings: 425,
    percentSavings: "25%",
    description: "Infraestructura escénica completa con puente de luces de 6 m, láser y sonido envolvente.",
    soundSummary: "Sistema de sonido completo con subwoofers y microfonía para directos de gran formato.",
    lightSummary: "Estructura de puente de 6 m, 4 cabezas móviles DMX, láser sincronizado y focos LED.",
    includes: "Sonorización completa + Puente de 6 m con cabezas móviles, láser y técnicos de luz y sonido.",
    status: "CONFIRMADO",
    source: "Catálogo Oficial"
  }
];

// Servicios complementarios (Extras)
export const EXTRAS = {
  dinnerSpeech: {
    id: "extra-dinner-speech",
    name: "Soporte Técnico de Cena y Discursos",
    price: 150,
    description: "2 micrófonos inalámbricos de mano para discursos/brindis y técnico para lanzar temas clave (entrada novios, tarta y regalos).",
    status: "PENDIENTE",
    statusLabel: "Tarifa estándar orientativa",
    source: "Prototipo Operativo"
  },
  djParty: {
    id: "extra-dj-party",
    name: "Sesión DJ Profesional para Fiesta",
    price: 500,
    description: "DJ profesional con cabina, controladora y repertorio adaptado para barra libre (3,5 h de sesión aprox.).",
    status: "PENDIENTE",
    statusLabel: "Tarifa estándar orientativa",
    source: "Prototipo Operativo"
  },
  perimeterLight: {
    id: "extra-perimeter-light",
    name: "Iluminación Perimetral Arquitectónica",
    price: 100,
    description: "Kit de 18 focos LED a batería para realzar árboles, columnas, fachadas de piedra o jardines.",
    status: "PENDIENTE",
    statusLabel: "Tarifa estándar orientativa",
    source: "Prototipo Operativo"
  }
};

// Matriz canónica confirmada por Santiago Cholbi
export const COMPATIBILITY_MATRIX_LIVE = {
  ceremonia: {
    clasica: ["vienna-brava"],
    gospel: ["gospel-on"],
    pop_jazz_soul_bossa: ["jazz-de-copes", "rever-queen"],
    rumba_flamenco: ["the-guitar-kings"],
    latin_boleros: ["latin-birds"]
  },
  aperitivo: {
    clasica: ["vienna-brava"],
    gospel: ["gospel-on"],
    pop_jazz_soul_bossa: ["jazz-de-copes", "rever-queen", "gospel-on"],
    disco_funk_rock: ["sweet-planet"],
    latin_boleros: ["latin-birds"],
    rumba_flamenco: ["the-guitar-kings"]
  },
  fiesta_pre_dj: {
    gospel: ["gospel-on"],
    pop_jazz_soul_bossa: ["jazz-de-copes", "rever-queen", "gospel-on"],
    disco_funk_rock: ["sweet-planet"],
    latin_boleros: ["latin-birds"],
    rumba_flamenco: ["the-guitar-kings"]
  }
};

// Objeto canónico unificado exportado
export const CATALOG = {
  version_catalogo: "2027.1.0",
  updated_at: "2026-09-22",
  
  // Alias de retrocompatibilidad estricta con Cockpit (app.js, pricing.js, rules.js)
  formations: FORMATIONS_BASE,
  curatedBands: CURATED_BANDS,
  soundSystems: SOUND_SYSTEMS,
  lightSystems: LIGHT_SYSTEMS,
  techPacks: TECH_PACKS,
  extras: EXTRAS,

  // Nuevas APIs de datos para El Escaparate y motor de sinergias
  matriz_compatibilidad_live: COMPATIBILITY_MATRIX_LIVE,
  
  /**
   * Obtiene las bandas compatibles con un momento y estilo dado
   * @param {'ceremonia'|'aperitivo'|'fiesta_pre_dj'} momentoId 
   * @param {string} estiloId 
   * @returns {Array<Object>} Lista de bandas compatibles completas
   */
  getBandsByMomentAndStyle(momentoId, estiloId) {
    const momentMap = COMPATIBILITY_MATRIX_LIVE[momentoId];
    if (!momentMap) return [];
    const bandIds = momentMap[estiloId] || [];
    return CURATED_BANDS.filter(b => bandIds.includes(b.id));
  },

  /**
   * Obtiene una banda por su identificador
   * @param {string} bandId 
   * @returns {Object|null}
   */
  getBandById(bandId) {
    return CURATED_BANDS.find(b => b.id === bandId) || null;
  },

  /**
   * Obtiene los detalles de una formación específica de una banda
   * @param {string} bandId 
   * @param {string} formatId 
   * @returns {Object|null}
   */
  getBandFormat(bandId, formatId) {
    const band = this.getBandById(bandId);
    if (!band) return null;
    return band.formatDetails?.find(f => f.id === formatId) || null;
  }
};
