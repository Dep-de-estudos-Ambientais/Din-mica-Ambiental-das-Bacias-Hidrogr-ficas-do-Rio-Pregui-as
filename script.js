* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: #eef2ef;
}

.container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.sidebar {
  width: 360px;
  min-width: 360px;
  background: linear-gradient(180deg, #edf3ef 0%, #dfe9e2 100%);
  border-right: 3px solid #2d5d34;
  overflow-y: auto;
  position: relative;
  transition: margin-left 0.35s ease;
  box-shadow: 4px 0 12px rgba(0,0,0,0.12);
  z-index: 1000;
}

.sidebar.collapsed {
  margin-left: -320px;
}

.toggle-btn {
  position: absolute;
  right: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 84px;
  border: 2px solid #fff;
  border-radius: 0 22px 22px 0;
  background: linear-gradient(135deg, #2d5d34, #4d8755);
  color: #fff;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 2px 0 12px rgba(0,0,0,0.22);
  z-index: 1001;
}

.toggle-btn:hover {
  background: linear-gradient(135deg, #214928, #396c42);
}

.header {
  background: linear-gradient(135deg, #2d5d34 0%, #46794d 55%, #2d5d34 100%);
  color: #fff;
  padding: 26px 20px;
  text-align: center;
}

.header h1 {
  margin: 0 0 8px 0;
  font-size: 2rem;
  line-height: 1.1;
}

.header p {
  margin: 0;
  font-size: 0.96rem;
  opacity: 0.95;
}

.dept-badge {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.22);
  font-size: 0.87rem;
}

.panel {
  margin: 14px;
  background: rgba(255,255,255,0.84);
  border: 1px solid #cfdcd1;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.panel h2 {
  margin: 0 0 14px 0;
  color: #28522e;
  font-size: 1.2rem;
  border-bottom: 2px solid #4c8152;
  padding-bottom: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 4px;
}

.layer-item input[type="checkbox"] {
  transform: scale(1.15);
  accent-color: #2d5d34;
}

.layer-item label {
  color: #2d4f31;
  cursor: pointer;
  font-size: 0.98rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: #2d4f31;
  font-size: 0.96rem;
}

.legend-box {
  width: 24px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.35);
  display: inline-block;
}

.legend-box.limite {
  background: #000000;
}

.legend-box.municipios {
  background: #d4d4d4;
}

.legend-box.corpoagua {
  background: #0d6efd;
}

.legend-box.hidrografia {
  background: #47b5ff;
}

.legend-box.lagos {
  background: #8ed8ff;
}

.legend-box.uc {
  background: #2ecc71;
}

.legend-box.equipamentos {
  background: #ff8c00;
}

.legend-box.foz {
  background: #7b2cbf;
}

.legend-box.potencialidades {
  background: #e63946;
}

.slider-group label {
  display: block;
  margin-bottom: 10px;
  color: #2d4f31;
  font-weight: 600;
}

.slider-group input[type="range"] {
  width: 100%;
  accent-color: #2d5d34;
}

.slider-labels {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
  color: #5b7b60;
}

.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.btn {
  background: linear-gradient(135deg, #2d5d34, #477c4f);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 0.92rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}

.btn:hover {
  background: linear-gradient(135deg, #224729, #37663e);
}

.status-panel #statusBox {
  color: #2e4c33;
  font-size: 0.96rem;
  line-height: 1.45;
  background: #f7fbf7;
  border: 1px solid #b8d3bc;
  border-radius: 10px;
  padding: 12px;
}

#map {
  flex: 1;
  height: 100vh;
  min-width: 0;
}

.leaflet-popup-content-wrapper {
  border-radius: 10px;
}

.popup-title {
  font-size: 1rem;
  font-weight: 700;
  color: #25512d;
  margin-bottom: 8px;
}

.popup-line {
  margin-bottom: 4px;
  font-size: 0.9rem;
  color: #334a36;
}

.north-arrow {
  background: #ffffff;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 2px solid #222;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.north-arrow span:first-child {
  font-size: 1.15rem;
  line-height: 1;
}

.north-arrow span:last-child {
  font-size: 0.72rem;
  line-height: 1;
}

@media (max-width: 900px) {
  .sidebar {
    width: 300px;
    min-width: 300px;
  }

  .sidebar.collapsed {
    margin-left: -260px;
  }

  .header h1 {
    font-size: 1.6rem;
  }
}
