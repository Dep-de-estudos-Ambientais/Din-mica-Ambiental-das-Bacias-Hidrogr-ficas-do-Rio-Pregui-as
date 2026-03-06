let map;
let osm, satellite, terrain;
let currentBase = "osm";

let limiteLayer = null;
let municipiosLayer = null;
let riosLayer = null;
let lagosLayer = null;
let ucLayer = null;

const arquivos = {
  limite: "dados/limite_bacia.geojson",
  municipios: "dados/municipios.geojson",
  rios: "dados/corpo_dagua.geojson",
  lagos: "dados/lagos.geojson",
  uc: "dados/unidades_conservacao.geojson"
};

const defaultPolygonOpacity = 0.55;

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initUI();
  carregarCamadas();
});

function initMap() {
  map = L.map("map", {
    zoomControl: true
  }).setView([-2.95, -42.82], 9);

  osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  });

  satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "&copy; Esri"
    }
  );

  terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenTopoMap contributors"
  });

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
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleBtn");
  const toggleArrow = document.getElementById("toggleArrow");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    toggleArrow.textContent = sidebar.classList.contains("collapsed") ? "▶" : "◀";

    setTimeout(() => {
      map.invalidateSize();
    }, 350);
  });

  document.getElementById("chk_limite").addEventListener("change", (e) => {
    alternarLayer(limiteLayer, e.target.checked);
  });

  document.getElementById("chk_municipios").addEventListener("change", (e) => {
    alternarLayer(municipiosLayer, e.target.checked);
  });

  document.getElementById("chk_rios").addEventListener("change", (e) => {
    alternarLayer(riosLayer, e.target.checked);
  });

  document.getElementById("chk_lagos").addEventListener("change", (e) => {
    alternarLayer(lagosLayer, e.target.checked);
  });

  document.getElementById("chk_uc").addEventListener("change", (e) => {
    alternarLayer(ucLayer, e.target.checked);
  });

  document.getElementById("opacityRange").addEventListener("input", (e) => {
    const opacity = Number(e.target.value) / 100;
    aplicarTransparencia(opacity);
  });

  document.getElementById("btnVista").addEventListener("click", ajustarVista);
  document.getElementById("btnBase").addEventListener("click", alternarMapaBase);
  document.getElementById("btnExportar").addEventListener("click", exportarLimite);
}

async function carregarCamadas() {
  try {
    setStatus("🔄 Carregando camadas...");

    const [
      limiteData,
      municipiosData,
      riosData,
      lagosData,
      ucData
    ] = await Promise.all([
      carregarGeoJSON(arquivos.limite),
      carregarGeoJSON(arquivos.municipios),
      carregarGeoJSON(arquivos.rios),
      carregarGeoJSON(arquivos.lagos),
      carregarGeoJSON(arquivos.uc)
    ]);

    criarLimiteLayer(limiteData);
    criarMunicipiosLayer(municipiosData);
    criarRiosLayer(riosData);
    criarLagosLayer(lagosData);
    criarUCLayer(ucData);

    ajustarVista();

    setStatus(
      "✅ Dados carregados com sucesso!<br>" +
      "<strong>Camadas:</strong> limite, municípios, corpos d'água, lagos e unidades de conservação.<br>" +
      "• Use os checkboxes para ligar ou desligar camadas.<br>" +
      "• Ajuste a transparência das camadas poligonais.<br>" +
      "• Use o botão lateral para recolher o menu."
    );
  } catch (error) {
    console.error(error);
    setStatus(
      "❌ Erro ao carregar os arquivos GeoJSON.<br>" +
      "Verifique se os nomes dos arquivos e a pasta <strong>dados</strong> estão corretos."
    );
  }
}

async function carregarGeoJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao carregar: ${url}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json") && !contentType.includes("geo+json") && !contentType.includes("text/plain")) {
    console.warn(`Tipo de conteúdo inesperado em ${url}: ${contentType}`);
  }

  return await response.json();
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
      color: "#777777",
      weight: 1.2,
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

function criarRiosLayer(data) {
  riosLayer = L.geoJSON(data, {
    style: {
      color: "#187bff",
      weight: 2,
      opacity: 0.95
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(criarPopupSimples("Corpo d'água", feature.properties));
    }
  }).addTo(map);
}

function criarLagosLayer(data) {
  lagosLayer = L.geoJSON(data, {
    style: {
      color: "#2f7fb5",
      weight: 1,
      opacity: 1,
      fillColor: "#73c8ff",
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
        fill = "#1f9d55";
      } else if (categoria.includes("uso sustentável") || categoria.includes("uso sustentavel")) {
        fill = "#52c878";
      }

      return {
        color: "#1d6b3f",
        weight: 1.5,
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

function criarPopupSimples(tituloPadrao, props = {}) {
  const keys = Object.keys(props || {}).filter((key) => {
    const value = props[key];
    return value !== null && value !== undefined && value !== "";
  });

  let titulo =
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
  if (municipiosLayer) {
    municipiosLayer.setStyle({
      fillOpacity: opacity * 0.15
    });
  }

  if (lagosLayer) {
    lagosLayer.setStyle({
      fillOpacity: opacity
    });
  }

  if (ucLayer) {
    ucLayer.setStyle({
      fillOpacity: opacity
    });
  }
}

function ajustarVista() {
  const layers = [];

  if (limiteLayer) layers.push(limiteLayer);
  else {
    if (riosLayer) layers.push(riosLayer);
    if (lagosLayer) layers.push(lagosLayer);
    if (ucLayer) layers.push(ucLayer);
  }

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
  document.getElementById("statusBox").innerHTML = html;
}
