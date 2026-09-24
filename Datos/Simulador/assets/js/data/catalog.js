/**
 * catalog.js
 * Catálogo canónico de Live Bands Music para el ejercicio 2027.
 * Distingue explícitamente entre partidas oficiales CONFIRMADAS y extras PENDIENTES.
 */

export const CATALOG = {
  // Formaciones musicales en directo (90 minutos de actuación)
  formations: [
    {
      id: "SOLO",
      name: "Solo",
      price: 495,
      hasVocals: false,
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
      instruments: "Gran ensemble: 2 voces, sección de vientos completa, base rítmica",
      description: "Máxima potencia orquestal para galas, bodas multitudinarias y festivales.",
      paxRecommendation: "Eventos multitudinarios (>350 PAX) • Show de gran formato",
      status: "CONFIRMADO",
      source: "Catálogo Oficial"
    }
  ],

  // Grupos y estilos representativos de Live Bands Music (Con fotos locales y taglines comerciales)
  curatedBands: [
    {
      id: "jazz-de-copes",
      name: "Jazz de Copes",
      genre: "Jazz, Pop, Bossa Nova & Soul",
      styles: ["Jazz", "Bossa Nova", "Soul", "Pop"],
      image: "./assets/img/bands/JDC.jpg",
      tagline: "Elegante y versátil, perfecto para dar un toque de distinción a tu ceremonia o aperitivo.",
      description: "Estándares de jazz, swing, bossa y pop versionado en clave elegante con instrumentistas de primer nivel.",
      idealFor: ["ceremony", "appetizer", "party"],
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
      image: "./assets/img/bands/TGK.jpg",
      tagline: "Energía mediterránea viva y festiva con guitarras españolas para un aperitivo inolvidable.",
      description: "Rumba flamenca viva y elegante con guitarras españolas, percusión y ritmo envolvente.",
      idealFor: ["appetizer", "party"],
      link: "https://livebandsmusic.com/the-guitar-kings/#tgkp3",
      formats: ["DUO", "TRIO", "QUARTET"],
      formatDetails: [
        { id: "DUO", name: "Dúo", price: 795, instruments: "2 guitarras flamencas o voz y guitarra", idealFor: ["appetizer"], customSongs: 2 },
        { id: "TRIO", name: "Trío (Percussion Trio)", price: 1145, instruments: "Voz/guitarra, guitarra solista y percusión", idealFor: ["appetizer"], customSongs: 3 },
        { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "2 guitarras, bajo y percusión completa", idealFor: ["appetizer", "party"], customSongs: 0 }
      ]
    },
    {
      id: "gospel-on",
      name: "Gospel On",
      genre: "Spiritual & Gospel",
      styles: ["Gospel", "Soul", "Espirituales", "Clásicos Emotivos"],
      image: "./assets/img/bands/GO.jpg",
      tagline: "Espirituales y armonías vocales conmovedoras para elevar la emoción de tu ceremonia.",
      description: "Armonías vocales profundas y espirituales para ritos nupciales y cócteles de gran calidez humana.",
      idealFor: ["ceremony", "appetizer"],
      link: "https://livebandsmusic.com/gospel-on/#GOTRIO",
      formats: ["DUO", "TRIO", "QUARTET", "QUINTET", "OCTET"],
      formatDetails: [
        { id: "DUO", name: "Dúo", price: 795, instruments: "Voz solista y piano", idealFor: ["ceremony"], customSongs: 6 },
        { id: "TRIO", name: "Trío", price: 1145, instruments: "2 voces y piano", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
        { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "3 voces y piano", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
        { id: "OCTET", name: "Octeto", price: 2595, instruments: "Gran coro de 7 voces y piano", idealFor: ["ceremony"], customSongs: 6 }
      ]
    },
    {
      id: "vienna-brava",
      name: "Vienna Brava",
      genre: "Música Clásica & Cuerdas",
      styles: ["Clásica", "Cuerdas", "Bandas Sonoras", "Pop Sinfónico"],
      image: "./assets/img/bands/VB.jpg",
      tagline: "Arreglos clásicos de alta escuela y bandas sonoras cinematográficas con cuerdas sublimes.",
      description: "Arreglos clásicos de alta escuela y adaptaciones modernas con violines, violonchelo y arpa.",
      idealFor: ["ceremony", "appetizer"],
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
      image: "./assets/img/bands/SWPL.jpg",
      tagline: "Grandes clásicos del funk, pop, disco y ritmos latinos para mantener a todos bailando.",
      description: "Grandes éxitos funk, soul, pop y disco para ambientar con ritmo desbordante y diversión garantizada.",
      idealFor: ["appetizer", "party"],
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
      image: "./assets/img/bands/RQ.jpg",
      tagline: "Tributo vibrante a los mayores éxitos del pop-rock internacional en riguroso directo.",
      description: "Clásicos del pop-rock internacional versionados con energía, potencia y sonido de estadio.",
      idealFor: ["appetizer", "party"],
      link: "https://livebandsmusic.com",
      formats: ["DUO", "TRIO", "QUARTET", "QUINTET"],
      formatDetails: [
        { id: "DUO", name: "Dúo Acústico", price: 795, instruments: "Voz y guitarra acústica", idealFor: ["appetizer"], customSongs: 2 },
        { id: "TRIO", name: "Trío", price: 1145, instruments: "Voz, guitarra y batería/cajón", idealFor: ["appetizer"], customSongs: 2 },
        { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "Voz, guitarra eléctrica, bajo y batería", idealFor: ["party", "appetizer"], customSongs: 0 },
        { id: "QUINTET", name: "Quinteto", price: 1725, instruments: "Voz, 2 guitarras, bajo y batería completa", idealFor: ["party"], customSongs: 0 }
      ]
    },
    {
      id: "latin-birds",
      name: "Latin Birds",
      genre: "Boleros & Ritmos Latinos",
      styles: ["Boleros", "Son Cubano", "Música Latina", "Bossa"],
      image: "./assets/img/bands/LB.jpg",
      tagline: "Boleros románticos y calidez de son cubano para crear una atmósfera íntima y seductora.",
      description: "Boleros románticos, son cubano y ritmos cálidos para recepciones elegantes y atardeceres mágicos.",
      idealFor: ["ceremony", "appetizer"],
      link: "https://livebandsmusic.com",
      formats: ["SOLO", "DUO", "TRIO", "QUARTET"],
      formatDetails: [
        { id: "SOLO", name: "Solo", price: 495, instruments: "Guitarra española y voz latina", idealFor: ["ceremony", "appetizer"], customSongs: 4 },
        { id: "DUO", name: "Dúo", price: 795, instruments: "Voz y guitarra acústica / requinto", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
        { id: "TRIO", name: "Trío", price: 1145, instruments: "Voz, guitarra y percusión latina (bongós/maracas)", idealFor: ["ceremony", "appetizer"], customSongs: 6 },
        { id: "QUARTET", name: "Cuarteto", price: 1435, instruments: "Voz, guitarra, bajo y percusión completa", idealFor: ["appetizer"], customSongs: 0 }
      ]
    }
  ],

  // Sonorización profesional
  soundSystems: [
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
  ],

  // Iluminación profesional
  lightSystems: [
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
  ],

  // Tech Packs Oficiales (Sonido + Iluminación combinados con ahorro directo)
  techPacks: [
    {
      id: "pack-basic",
      name: "Pack Básico (Sonido + Iluminación)",
      shortName: "Basic Tech Pack",
      price: 465,
      soundEquivalent: "basic",
      lightEquivalent: "basic",
      separatePrice: 780, // 400 + 380
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
      separatePrice: 1280, // 900 + 380
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
      separatePrice: 1695, // 900 + 795
      savings: 425,
      percentSavings: "25%",
      description: "Infraestructura escénica completa con puente de luces de 6 m, láser y sonido envolvente.",
      soundSummary: "Sistema de sonido completo con subwoofers y microfonía para directos de gran formato.",
      lightSummary: "Estructura de puente de 6 m, 4 cabezas móviles DMX, láser sincronizado y focos LED.",
      includes: "Sonorización completa + Puente de 6 m con cabezas móviles, láser y técnicos de luz y sonido.",
      status: "CONFIRMADO",
      source: "Catálogo Oficial"
    }
  ],

  // Servicios complementarios (Extras)
  extras: {
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
  }
};
