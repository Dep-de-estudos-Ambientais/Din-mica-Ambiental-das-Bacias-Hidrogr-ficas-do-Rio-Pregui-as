let map;
let osm, satellite, terrain;
let currentBase = "osm";

let limiteLayer = null;
let municipiosLayer = null;
let corpoDaguaLayer = null;
let hidrografiaLayer = null;
let lagosLayer = null;
let ucLayer = null;
let equipamentosLayer = null;
let fozLayer = null;
let potencialidadesLayer = null;
let geologiaLayer = null;
let geomorfologiaLayer = null;
let solosLayer = null;

const defaultPolygonOpacity = 0.55;

const arquivos = {
  limite: "dados/limite_bacia.geojson",
  municipios: "dados/municipios.geojson",
  corpoDagua: "dados/corpo_dagua.geojson",
  hidrografia: "dados/hidrografia.geojson",
  lagos: "dados/lagos.geojson",
  uc: "dados/unidades_conservacao.geojson",
  equipamentos: "dados/equipamentos_urbanos_atins.geojson",
  foz: "dados/foz.geojson",
  potencialidades: "dados/potencialidades.geojson",
  geologia: "dados/geologia.geojson",
  geomorfologia: "dados/geomorfologia.geojson",
  solos: "dados/solos.geojson"
};

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initUI();
  carregarCamadas();
});

function el(id) {
  return document.getElementById(id);
}

function addSafeListener(id, eventName, handler) {
  const element = el(id);

  if (!element) {
    console.warn(`Elemento com id "${id}" não foi encontrado no HTML.`);
    return;
  }

  element.addEventListener(eventName, handler);
}

function initMap() {
  map = L.map("map", {
    zoomControl: true
  }).setView([-2.95, -42.82], 9);

  osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  });

  terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenTopoMap contributors"
  });

  satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "&copy; Esri"
    }
  );

  osm.addTo(map);

  L.control.scale({
    metric: true,
    imperial: false,
    position: "bottomright"
  }).addTo(map);

  const north = L.control({ position: "topright" });
  north.onAdd = function () {
    const div = L.DomUtil.create("div");
    div.className = "north-arrow";
    div.innerHTML = "<span>↑</span><span>N</span>";
    return div;
  };
  north.addTo(map);
}

function initUI() {
  const sidebar = el("sidebar");
  const toggleBtn = el("toggleBtn");
  const toggleArrow = el("toggleArrow");

  if (sidebar && toggleBtn && toggleArrow) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      toggleArrow.textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀";

      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    });
  }

  addSafeListener("chk_limite", "change", (e) => alternarLayer(limiteLayer, e.target.checked));
  addSafeListener("chk_municipios", "change", (e) => alternarLayer(municipiosLayer, e.target.checked));
  addSafeListener("chk_corpo_dagua", "change", (e) => alternarLayer(corpoDaguaLayer, e.target.checked));
  addSafeListener("chk_hidrografia", "change", (e) => alternarLayer(hidrografiaLayer, e.target.checked));
  addSafeListener("chk_lagos", "change", (e) => alternarLayer(lagosLayer, e.target.checked));
  addSafeListener("chk_uc", "change", (e) => alternarLayer(ucLayer, e.target.checked));
  addSafeListener("chk_equipamentos", "change", (e) => alternarLayer(equipamentosLayer, e.target.checked));
  addSafeListener("chk_foz", "change", (e) => alternarLayer(fozLayer, e.target.checked));
  addSafeListener("chk_potencialidades", "change", (e) => alternarLayer(potencialidadesLayer, e.target.checked));
  addSafeListener("chk_geologia", "change", (e) => alternarLayer(geologiaLayer, e.target.checked));
  addSafeListener("chk_geomorfologia", "change", (e) => alternarLayer(geomorfologiaLayer, e.target.checked));
  addSafeListener("chk_solos", "change", (e) => alternarLayer(solosLayer, e.target.checked));

  addSafeListener("opacityRange", "input", (e) => {
    aplicarTransparencia(Number(e.target.value) / 100);
  });

  addSafeListener("btnVista", "click", ajustarVista);
  addSafeListener("btnBase", "click", alternarMapaBase);
  addSafeListener("btnExportar", "click", exportarLimite);
}

async function carregarCamadas() {
  try {
    setStatus("🔄 Carregando camadas...");

    const resultados = await Promise.allSettled([
      carregarGeoJSON(arquivos.limite),
      carregarGeoJSON(arquivos.municipios),
      carregarGeoJSON(arquivos.corpoDagua),
      carregarGeoJSON(arquivos.hidrografia),
      carregarGeoJSON(arquivos.lagos),
      carregarGeoJSON(arquivos.uc),
      carregarGeoJSON(arquivos.equipamentos),
      carregarGeoJSON(arquivos.foz),
      carregarGeoJSON(arquivos.potencialidades),
      carregarGeoJSON(arquivos.geologia),
      carregarGeoJSON(arquivos.geomorfologia),
      carregarGeoJSON(arquivos.solos)
    ]);

    const nomes = [
      "limite",
      "municipios",
      "corpoDagua",
      "hidrografia",
      "lagos",
      "uc",
      "equipamentos",
      "foz",
      "potencialidades",
      "geologia",
      "geomorfologia",
      "solos"
    ];

    const dados = {};

    resultados.forEach((resultado, i) => {
      const nome = nomes[i];
      if (resultado.status === "fulfilled") {
        dados[nome] = resultado.value;
      } else {
        console.error(`Falha ao carregar camada: ${nome}`, resultado.reason);
      }
    });

    if (dados.limite) criarLimiteLayer(dados.limite);
    if (dados.municipios) criarMunicipiosLayer(dados.municipios);
    if (dados.corpoDagua) criarCorpoDaguaLayer(dados.corpoDagua);
    if (dados.hidrografia) criarHidrografiaLayer(dados.hidrografia);
    if (dados.lagos) criarLagosLayer(dados.lagos);
    if (dados.uc) criarUCLayer(dados.uc);
    if (dados.equipamentos) criarEquipamentosLayer(dados.equipamentos);
    if (dados.foz) criarFozLayer(dados.foz);
    if (dados.potencialidades) criarPotencialidadesLayer(dados.potencialidades);
    if (dados.geologia) criarGeologiaLayer(dados.geologia);
    if (dados.geomorfologia) criarGeomorfologiaLayer(dados.geomorfologia);
    if (dados.solos) criarSolosLayer(dados.solos);

    ajustarVista();

    const carregadas = Object.keys(dados).length;
    setStatus(
      `✅ ${carregadas} camada(s) carregada(s) com sucesso.<br>` +
      `• Use os checkboxes para ligar ou desligar camadas.<br>` +
      `• Ajuste a transparência para polígonos.<br>` +
      `• Rios e lagos usam rótulos pela coluna <strong>nome</strong>.`
    );

  } catch (error) {
    console.error("Erro geral ao carregar camadas:", error);
    setStatus("❌ Ocorreu um erro ao carregar as camadas.");
  }
}

async function carregarGeoJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao carregar: ${url}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`Arquivo inválido como JSON: ${url}`);
    console.error(text.substring(0, 400));
    throw err;
  }
}

function criarLimiteLayer(data) {
  limiteLayer = L.geoJSON(data, {
    style: {
      color: "#000000",
      weight: 3,
      opacity: 1,
      fillOpacity: 0
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Limite da Bacia", feature.properties));
    }
  }).addTo(map);
}

function criarMunicipiosLayer(data) {
  municipiosLayer = L.geoJSON(data, {
    style: {
      color: "#888888",
      weight: 1.1,
      opacity: 0.9,
      fillColor: "#d9d9d9",
      fillOpacity: 0.08
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.nome || props.NOME || props.name || props.NAME || "Município";

      layer.bindPopup(`
        <div class="popup-title">${nome}</div>
        <div class="popup-line"><strong>Tipo:</strong> Município da bacia</div>
      `);
    }
  }).addTo(map);
}

function criarCorpoDaguaLayer(data) {
  corpoDaguaLayer = L.geoJSON(data, {
    style: {
      color: "#0d6efd",
      weight: 2.2,
      opacity: 0.95
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Corpo d'água", feature.properties));
    }
  }).addTo(map);
}

function criarHidrografiaLayer(data) {
  hidrografiaLayer = L.geoJSON(data, {
    style: {
      color: "#47b5ff",
      weight: 1.5,
      opacity: 0.9
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.nome || props.NOME || "";

      layer.bindPopup(criarPopupSimples("Hidrografia", props));

      if (nome && typeof layer.setText === "function") {
        layer.setText(nome, {
          repeat: false,
          center: true,
          offset: -3,
          orientation: 0,
          attributes: {
            class: "map-label-rio"
          }
        });
      }
    }
  }).addTo(map);
}

function criarLagosLayer(data) {
  lagosLayer = L.geoJSON(data, {
    style: {
      color: "#3b82c4",
      weight: 1,
      opacity: 1,
      fillColor: "#8ed8ff",
      fillOpacity: defaultPolygonOpacity
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.nome || props.NOME || "";

      layer.bindPopup(criarPopupSimples("Lago", props));

      if (nome) {
        layer.bindTooltip(nome, {
          permanent: true,
          direction: "center",
          className: "map-label-lago"
        });
      }
    }
  }).addTo(map);
}

function criarUCLayer(data) {
  ucLayer = L.geoJSON(data, {
    style: (feature) => {
      const props = feature.properties || {};
      const categoria = (
        props.categoria ||
        props.CATEGORIA ||
        props.grupo ||
        props.GRUPO ||
        ""
      ).toString().toLowerCase();

      let fill = "#2ecc71";

      if (categoria.includes("proteção integral") || categoria.includes("protecao integral")) {
        fill = "#1b9e52";
      } else if (categoria.includes("uso sustentável") || categoria.includes("uso sustentavel")) {
        fill = "#58c777";
      }

      return {
        color: "#1d6b3f",
        weight: 1.4,
        opacity: 1,
        fillColor: fill,
        fillOpacity: defaultPolygonOpacity
      };
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.nome || props.NOME || props.name || props.NAME || "Unidade de Conservação";
      const categoria = props.categoria || props.CATEGORIA || props.grupo || props.GRUPO || "Não informado";

      layer.bindPopup(`
        <div class="popup-title">${nome}</div>
        <div class="popup-line"><strong>Tipo:</strong> Unidade de Conservação</div>
        <div class="popup-line"><strong>Categoria:</strong> ${categoria}</div>
      `);
    }
  }).addTo(map);
}

function criarEquipamentosLayer(data) {
  equipamentosLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 6,
        color: "#ffffff",
        weight: 1.5,
        fillColor: "#ff8c00",
        fillOpacity: 0.95
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Equipamento Urbano", feature.properties));
    }
  }).addTo(map);
}

function criarFozLayer(data) {
  fozLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#7b2cbf",
        fillOpacity: 0.95
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Foz", feature.properties));
    }
  }).addTo(map);
}

/* -------------------------
   POTENCIALIDADES
   Classificação por FolderPath
------------------------- */
const coresPotencialidades = {
  turismo: "#e41a1c",
  pesca: "#377eb8",
  agricultura: "#4daf4a",
  conservacao: "#984ea3",
  infraestrutura: "#ff7f00",
  default: "#e63946"
};

function corPotencialidade(folderPath) {
  if (!folderPath) return coresPotencialidades.default;

  const valor = String(folderPath).toLowerCase();

  if (valor.includes("turismo")) return coresPotencialidades.turismo;
  if (valor.includes("pesca")) return coresPotencialidades.pesca;
  if (valor.includes("agric")) return coresPotencialidades.agricultura;
  if (valor.includes("conserv")) return coresPotencialidades.conservacao;
  if (valor.includes("infra")) return coresPotencialidades.infraestrutura;

  return coresPotencialidades.default;
}

function criarPotencialidadesLayer(data) {
  potencialidadesLayer = L.geoJSON(data, {
    style: (feature) => {
      const props = feature.properties || {};
      const classe = props.FolderPath || props.folderpath || "";
      const cor = corPotencialidade(classe);

      return {
        color: cor,
        weight: 1.4,
        opacity: 1,
        fillColor: cor,
        fillOpacity: defaultPolygonOpacity
      };
    },
    pointToLayer: (feature, latlng) => {
      const props = feature.properties || {};
      const classe = props.FolderPath || props.folderpath || "";
      const cor = corPotencialidade(classe);

      return L.circleMarker(latlng, {
        radius: 6,
        color: "#ffffff",
        weight: 1.5,
        fillColor: cor,
        fillOpacity: 0.95
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Potencialidade", feature.properties));
    }
  }).addTo(map);
}

/* -------------------------
   GEOLOGIA
   Classificação por NOME_UNIDA
   Troque depois pelas cores oficiais
------------------------- */
const coresGeologia = {
  "Formação Barreiras": "#d8b365",
  "Depósitos Aluvionares": "#f6e8c3",
  "Sedimentos Recentes": "#c7eae5",
  default: "#8c6d31"
};

function corGeologia(nome) {
  return coresGeologia[nome] || coresGeologia.default;
}

function criarGeologiaLayer(data) {
  geologiaLayer = L.geoJSON(data, {
    style: (feature) => {
      const props = feature.properties || {};
      const classe = props.NOME_UNIDA || "default";
      const cor = corGeologia(classe);

      return {
        color: "#5c4033",
        weight: 1,
        opacity: 1,
        fillColor: cor,
        fillOpacity: defaultPolygonOpacity
      };
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.NOME_UNIDA || "Geologia";

      layer.bindPopup(`
        <div class="popup-title">${nome}</div>
        <div class="popup-line"><strong>Tipo:</strong> Unidade geológica</div>
      `);
    }
  }).addTo(map);
}

/* -------------------------
   GEOMORFOLOGIA
   Classificação por NOME_UNIDA
   Troque depois pelas cores oficiais
------------------------- */
const coresGeomorfologia = {
  "Planícies Fluviomarinhas": "#9ecae1",
  "Tabuleiros": "#fdae6b",
  "Colinas": "#c994c7",
  "Vales": "#74c476",
  default: "#c994c7"
};

function corGeomorfologia(nome) {
  return coresGeomorfologia[nome] || coresGeomorfologia.default;
}

function criarGeomorfologiaLayer(data) {
  geomorfologiaLayer = L.geoJSON(data, {
    style: (feature) => {
      const props = feature.properties || {};
      const classe = props.NOME_UNIDA || "default";
      const cor = corGeomorfologia(classe);

      return {
        color: "#6b486b",
        weight: 1,
        opacity: 1,
        fillColor: cor,
        fillOpacity: defaultPolygonOpacity
      };
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.NOME_UNIDA || "Geomorfologia";

      layer.bindPopup(`
        <div class="popup-title">${nome}</div>
        <div class="popup-line"><strong>Tipo:</strong> Unidade geomorfológica</div>
      `);
    }
  }).addTo(map);
}

/* -------------------------
   SOLOS
   Classificação por legenda
   Troque depois pelas cores oficiais
------------------------- */
const coresSolos = {
  Latossolo: "#a6611a",
  Argissolo: "#dfc27d",
  Neossolo: "#80cdc1",
  Gleissolo: "#018571",
  default: "#b15928"
};

function corSolo(nome) {
  if (!nome) return coresSolos.default;

  const valor = String(nome).toLowerCase();

  if (valor.includes("latossolo")) return coresSolos.Latossolo;
  if (valor.includes("argissolo")) return coresSolos.Argissolo;
  if (valor.includes("neossolo")) return coresSolos.Neossolo;
  if (valor.includes("gleissolo")) return coresSolos.Gleissolo;

  return coresSolos.default;
}

function criarSolosLayer(data) {
  solosLayer = L.geoJSON(data, {
    style: (feature) => {
      const props = feature.properties || {};
      const classe = props.legenda || props.LEGENDA || "";
      const cor = corSolo(classe);

      return {
        color: "#6b3d1f",
        weight: 1,
        opacity: 1,
        fillColor: cor,
        fillOpacity: defaultPolygonOpacity
      };
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties || {};
      const nome = props.legenda || props.LEGENDA || "Solo";

      layer.bindPopup(`
        <div class="popup-title">${nome}</div>
        <div class="popup-line"><strong>Tipo:</strong> Classe de solo</div>
      `);
    }
  }).addTo(map);
}

function criarPopupSimples(tituloPadrao, props = {}) {
  const keys = Object.keys(props || {}).filter((key) => {
    const value = props[key];
    return value !== null && value !== undefined && value !== "";
  });

  const titulo =
    props.nome ||
    props.NOME ||
    props.name ||
    props.NAME ||
    props.NOME_UNIDA ||
    props.legenda ||
    props.LEGENDA ||
    tituloPadrao;

  let html = `<div class="popup-title">${titulo}</div>`;

  if (keys.length === 0) {
    html += `<div class="popup-line"><strong>Tipo:</strong> ${tituloPadrao}</div>`;
    return html;
  }

  let count = 0;
  for (const key of keys) {
    if (count >= 8) break;
    html += `<div class="popup-line"><strong>${formatarCampo(key)}:</strong> ${props[key]}</div>`;
    count++;
  }

  return html;
}

function formatarCampo(campo) {
  return campo
    .replaceAll("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function alternarLayer(layer, visible) {
  if (!layer) return;

  if (visible) {
    if (!map.hasLayer(layer)) map.addLayer(layer);
  } else {
    if (map.hasLayer(layer)) map.removeLayer(layer);
  }
}

function aplicarTransparencia(opacity) {
  if (municipiosLayer) municipiosLayer.setStyle({ fillOpacity: opacity * 0.15 });
  if (lagosLayer) lagosLayer.setStyle({ fillOpacity: opacity });
  if (ucLayer) ucLayer.setStyle({ fillOpacity: opacity });
  if (potencialidadesLayer) potencialidadesLayer.setStyle({ fillOpacity: opacity });
  if (geologiaLayer) geologiaLayer.setStyle({ fillOpacity: opacity });
  if (geomorfologiaLayer) geomorfologiaLayer.setStyle({ fillOpacity: opacity });
  if (solosLayer) solosLayer.setStyle({ fillOpacity: opacity });
}

function ajustarVista() {
  const layers = [];

  if (limiteLayer) layers.push(limiteLayer);
  if (municipiosLayer) layers.push(municipiosLayer);
  if (corpoDaguaLayer) layers.push(corpoDaguaLayer);
  if (hidrografiaLayer) layers.push(hidrografiaLayer);
  if (lagosLayer) layers.push(lagosLayer);
  if (ucLayer) layers.push(ucLayer);
  if (equipamentosLayer) layers.push(equipamentosLayer);
  if (fozLayer) layers.push(fozLayer);
  if (potencialidadesLayer) layers.push(potencialidadesLayer);
  if (geologiaLayer) layers.push(geologiaLayer);
  if (geomorfologiaLayer) layers.push(geomorfologiaLayer);
  if (solosLayer) layers.push(solosLayer);

  if (layers.length === 0) return;

  const group = new L.featureGroup(layers);
  const bounds = group.getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}

function alternarMapaBase() {
  if (currentBase === "osm") {
    map.removeLayer(osm);
    terrain.addTo(map);
    currentBase = "terrain";
  } else if (currentBase === "terrain") {
    map.removeLayer(terrain);
    satellite.addTo(map);
    currentBase = "satellite";
  } else {
    map.removeLayer(satellite);
    osm.addTo(map);
    currentBase = "osm";
  }
}

function exportarLimite() {
  if (!limiteLayer) {
    alert("A camada de limite ainda não foi carregada.");
    return;
  }

  const geojson = limiteLayer.toGeoJSON();
  const dataStr = JSON.stringify(geojson, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "limite_bacia_rio_preguicas.geojson";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function setStatus(html) {
  const box = el("statusBox");
  if (box) box.innerHTML = html;
}
