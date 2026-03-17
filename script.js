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

const defaultPolygonOpacity = 0.55;

const arquivos = {
  limite: "dados/limite_bacia.geojson",
  municipios: "dados/municipios.geojson",
  corpoDagua: "dados/corpo_dagua.geojson",
  hidrografia: "dados/Hidrografia.geojson",
  lagos: "dados/lagos.geojson",
  uc: "dados/unidades_conservacao.geojson",
  equipamentos: "dados/Equipamentos Urbanos Atins.geojson",
  foz: "dados/Foz.geojson",
  potencialidades: "dados/Potencialidades.geojson"
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
  } else {
    console.warn("Sidebar/toggle não encontrados. Verifique: sidebar, toggleBtn, toggleArrow.");
  }

  addSafeListener("chk_limite", "change", (e) => {
    alternarLayer(limiteLayer, e.target.checked);
  });

  addSafeListener("chk_municipios", "change", (e) => {
    alternarLayer(municipiosLayer, e.target.checked);
  });

  addSafeListener("chk_corpo_dagua", "change", (e) => {
    alternarLayer(corpoDaguaLayer, e.target.checked);
  });

  addSafeListener("chk_hidrografia", "change", (e) => {
    alternarLayer(hidrografiaLayer, e.target.checked);
  });

  addSafeListener("chk_lagos", "change", (e) => {
    alternarLayer(lagosLayer, e.target.checked);
  });

  addSafeListener("chk_uc", "change", (e) => {
    alternarLayer(ucLayer, e.target.checked);
  });

  addSafeListener("chk_equipamentos", "change", (e) => {
    alternarLayer(equipamentosLayer, e.target.checked);
  });

  addSafeListener("chk_foz", "change", (e) => {
    alternarLayer(fozLayer, e.target.checked);
  });

  addSafeListener("chk_potencialidades", "change", (e) => {
    alternarLayer(potencialidadesLayer, e.target.checked);
  });

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

    const [
      limiteData,
      municipiosData,
      corpoDaguaData,
      hidrografiaData,
      lagosData,
      ucData,
      equipamentosData,
      fozData,
      potencialidadesData
    ] = await Promise.all([
      carregarGeoJSON(arquivos.limite),
      carregarGeoJSON(arquivos.municipios),
      carregarGeoJSON(arquivos.corpoDagua),
      carregarGeoJSON(arquivos.hidrografia),
      carregarGeoJSON(arquivos.lagos),
      carregarGeoJSON(arquivos.uc),
      carregarGeoJSON(arquivos.equipamentos),
      carregarGeoJSON(arquivos.foz),
      carregarGeoJSON(arquivos.potencialidades)
    ]);

    criarLimiteLayer(limiteData);
    criarMunicipiosLayer(municipiosData);
    criarCorpoDaguaLayer(corpoDaguaData);
    criarHidrografiaLayer(hidrografiaData);
    criarLagosLayer(lagosData);
    criarUCLayer(ucData);
    criarEquipamentosLayer(equipamentosData);
    criarFozLayer(fozData);
    criarPotencialidadesLayer(potencialidadesData);

    ajustarVista();

    setStatus(
      "✅ Dados carregados com sucesso!<br>" +
      "<strong>Camadas ativas:</strong> limite, municípios, corpo d'água, hidrografia, lagos, unidades de conservação, equipamentos urbanos, foz e potencialidades."
    );
  } catch (error) {
    console.error("Erro ao carregar camadas:", error);
    setStatus(
      "❌ Erro ao carregar uma ou mais camadas.<br>" +
      "Abra o console para ver qual arquivo falhou."
    );
  }
}

async function carregarGeoJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao carregar ${url} | status ${response.status}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`Arquivo não é JSON válido: ${url}`);
    console.error(text.substring(0, 300));
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
      layer.bindPopup(criarPopupSimples("Hidrografia", feature.properties));
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
      layer.bindPopup(criarPopupSimples("Lago", feature.properties));
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

function criarPotencialidadesLayer(data) {
  potencialidadesLayer = L.geoJSON(data, {
    style: {
      color: "#b22222",
      weight: 1.4,
      opacity: 1,
      fillColor: "#e63946",
      fillOpacity: defaultPolygonOpacity
    },
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 6,
        color: "#ffffff",
        weight: 1.5,
        fillColor: "#e63946",
        fillOpacity: 0.95
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Potencialidade", feature.properties));
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
}

function ajustarVista() {
  const layers = [];

  if (limiteLayer) layers.push(limiteLayer);
  if (fozLayer) layers.push(fozLayer);
  if (equipamentosLayer) layers.push(equipamentosLayer);
  if (potencialidadesLayer) layers.push(potencialidadesLayer);

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
