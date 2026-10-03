import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, onValue, query, orderByKey, limitToLast
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8VOrOMxLeojFOXQe-0AzyJYdxLn3k7C8",
  authDomain: "deteccion-picudo-cauca.firebaseapp.com",
  databaseURL: "https://deteccion-picudo-cauca-default-rtdb.firebaseio.com",
  projectId: "deteccion-picudo-cauca",
  storageBucket: "deteccion-picudo-cauca.firebasestorage.app",
  messagingSenderId: "534583178595",
  appId: "1:534583178595:web:aa31c39dc637f6dd15cf56",
  measurementId: "G-SBBF2KLSP0"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const botonesNodo = document.querySelectorAll('.btn-nodo');
const paneles = {
  ambiental1: document.getElementById('panel-ambiental1'),
  suelo1: document.getElementById('panel-suelo1')
};

botonesNodo.forEach(btn => {
  btn.addEventListener('click', () => {
    botonesNodo.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(paneles).forEach(p => p.classList.remove('active'));
    const nodo = btn.dataset.nodo;
    if (paneles[nodo]) paneles[nodo].classList.add('active');
  });
});

const ctxAmb = document.getElementById('chart-ambiental').getContext('2d');
const chartAmb = new Chart(ctxAmb, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: [],
        borderColor: '#e53935',
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
        tension: 0.3,
        yAxisID: 'yTemp',
        pointRadius: 3
      },
      {
        label: 'Humedad (%)',
        data: [],
        borderColor: '#1e88e5',
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        tension: 0.3,
        yAxisID: 'yHum',
        pointRadius: 3
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' } },
    scales: {
      yTemp: {
        type: 'linear', position: 'left',
        title: { display: true, text: 'Temperatura (°C)', color: '#e53935' },
        ticks: { color: '#e53935' }
      },
      yHum: {
        type: 'linear', position: 'right',
        title: { display: true, text: 'Humedad (%)', color: '#1e88e5' },
        ticks: { color: '#1e88e5' },
        grid: { drawOnChartArea: false }
      }
    }
  }
});

const ctxSue = document.getElementById('chart-suelo').getContext('2d');
const chartSue = new Chart(ctxSue, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Humedad suelo (%)',
        data: [],
        borderColor: '#1e88e5',
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        tension: 0.3,
        yAxisID: 'yHum',
        pointRadius: 3
      },
      {
        label: 'pH',
        data: [],
        borderColor: '#8e24aa',
        backgroundColor: 'rgba(142, 36, 170, 0.1)',
        tension: 0.3,
        yAxisID: 'yPH',
        pointRadius: 3
      },
      {
        label: 'EC (µS/cm)',
        data: [],
        borderColor: '#fb8c00',
        backgroundColor: 'rgba(251, 140, 0, 0.1)',
        tension: 0.3,
        yAxisID: 'yEC',
        pointRadius: 3
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' } },
    scales: {
      yHum: {
        type: 'linear', position: 'left',
        title: { display: true, text: 'Humedad (%)', color: '#1e88e5' },
        ticks: { color: '#1e88e5' }
      },
      yPH: {
        type: 'linear', position: 'right',
        title: { display: true, text: 'pH', color: '#8e24aa' },
        ticks: { color: '#8e24aa' },
        grid: { drawOnChartArea: false }
      },
      yEC: {
        type: 'linear', position: 'right',
        title: { display: true, text: 'EC (µS/cm)', color: '#fb8c00' },
        ticks: { color: '#fb8c00' },
        grid: { drawOnChartArea: false }
      }
    }
  }
});

const datosAmbRef = ref(database, 'sistema_picudo/nodos/ambiental1/datos');

onValue(query(datosAmbRef, orderByKey(), limitToLast(1)), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  const last = Object.values(data)[0];
  document.getElementById('amb-temp').textContent = `${last.temperature} °C`;
  document.getElementById('amb-hum').textContent  = `${last.humidity} %`;
  document.getElementById('amb-pres').textContent = `${last.pressure?.toFixed(1) ?? '--'} hPa`;
  document.getElementById('amb-uv').textContent   = last.uv ?? '--';
  document.getElementById('amb-rssi').textContent = `${last.rssi} dBm`;
  document.getElementById('amb-snr').textContent  = `${last.snr} dB`;
  document.getElementById('amb-cnt').textContent  = last.count ?? '--';
  document.getElementById('amb-ts').textContent   = last.timestamp ?? '--';
});

onValue(query(datosAmbRef, orderByKey(), limitToLast(50)), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  const lecturas = Object.entries(data)
    .map(([k, v]) => ({ key: Number(k), ...v }))
    .sort((a, b) => a.key - b.key);
  chartAmb.data.labels           = lecturas.map(l => String(l.timestamp));
  chartAmb.data.datasets[0].data = lecturas.map(l => l.temperature);
  chartAmb.data.datasets[1].data = lecturas.map(l => l.humidity);
  chartAmb.update();
  window.lecturasAmb = lecturas;
  const info = document.getElementById('info-amb');
  if (info) info.textContent = `${lecturas.length} registros listos para descargar`;
});

onValue(ref(database, 'sistema_picudo/nodos/ambiental1/metadata'), (snapshot) => {
  const meta = snapshot.val();
  if (!meta) return;
  document.getElementById('amb-meta-tipo').textContent      = meta.tipo ?? '--';
  document.getElementById('amb-meta-ubicacion').textContent = meta.ubicacion ?? '--';
  document.getElementById('amb-meta-estado').textContent    = meta.estado ?? '--';
  document.getElementById('amb-meta-bateria').textContent   = `${meta.bateria ?? '--'}%`;
  document.getElementById('amb-meta-firmware').textContent  = meta.version_firmware ?? '--';
  document.getElementById('amb-meta-rssi').textContent      = `${meta.rssi_promedio ?? '--'} dBm`;
  document.getElementById('amb-meta-snr').textContent       = `${meta.snr_promedio ?? '--'} dB`;
  document.getElementById('amb-meta-ultima').textContent    = meta.ultima_comunicacion ?? '--';
});

const datosSueRef = ref(database, 'sistema_picudo/nodos/suelo1/datos');

onValue(query(datosSueRef, orderByKey(), limitToLast(1)), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  const last = Object.values(data)[0];
  document.getElementById('sue-hum').textContent  = `${last.soil_humidity ?? '--'} %`;
  document.getElementById('sue-temp').textContent = `${last.soil_temperature ?? '--'} °C`;
  document.getElementById('sue-ph').textContent   = last.ph ?? '--';
  document.getElementById('sue-ec').textContent   = `${last.ec ?? '--'} µS/cm`;
  document.getElementById('sue-n').textContent    = `${last.nitrogen ?? '--'} mg/kg`;
  document.getElementById('sue-p').textContent    = `${last.phosphorus ?? '--'} mg/kg`;
  document.getElementById('sue-k').textContent    = `${last.potassium ?? '--'} mg/kg`;
  document.getElementById('sue-rssi').textContent = `${last.rssi ?? '--'} dBm`;
});

onValue(query(datosSueRef, orderByKey(), limitToLast(50)), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  const lecturas = Object.entries(data)
    .map(([k, v]) => ({ key: Number(k), ...v }))
    .sort((a, b) => a.key - b.key);
  chartSue.data.labels           = lecturas.map(l => String(l.timestamp));
  chartSue.data.datasets[0].data = lecturas.map(l => l.soil_humidity);
  chartSue.data.datasets[1].data = lecturas.map(l => l.ph);
  chartSue.data.datasets[2].data = lecturas.map(l => l.ec);
  chartSue.update();
  window.lecturasSue = lecturas;
  const info = document.getElementById('info-sue');
  if (info) info.textContent = `${lecturas.length} registros listos para descargar`;
});

onValue(ref(database, 'sistema_picudo/nodos/suelo1/metadata'), (snapshot) => {
  const meta = snapshot.val();
  if (!meta) return;
  document.getElementById('sue-meta-tipo').textContent      = meta.tipo ?? '--';
  document.getElementById('sue-meta-ubicacion').textContent = meta.ubicacion ?? '--';
  document.getElementById('sue-meta-estado').textContent    = meta.estado ?? '--';
  document.getElementById('sue-meta-bateria').textContent   = `${meta.bateria ?? '--'}%`;
  document.getElementById('sue-meta-firmware').textContent  = meta.version_firmware ?? '--';
  document.getElementById('sue-meta-rssi').textContent      = `${meta.rssi_promedio ?? '--'} dBm`;
  document.getElementById('sue-meta-snr').textContent       = `${meta.snr_promedio ?? '--'} dB`;
  document.getElementById('sue-meta-ultima').textContent    = meta.ultima_comunicacion ?? '--';
});

function descargarArchivo(contenido, nombre, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportarCSV(lecturas, headers, prefijo) {
  if (!lecturas || lecturas.length === 0) {
    alert('No hay datos aún para descargar');
    return;
  }
  const filas = lecturas.map(l => headers.map(h => l[h] ?? '').join(','));
  const csv = [headers.join(','), ...filas].join('\n');
  const fecha = new Date().toISOString().slice(0, 10);
  descargarArchivo(csv, `${prefijo}_${fecha}.csv`, 'text/csv;charset=utf-8;');
}

function exportarJSON(lecturas, prefijo) {
  if (!lecturas || lecturas.length === 0) {
    alert('No hay datos aún para descargar');
    return;
  }
  const json = JSON.stringify(lecturas, null, 2);
  const fecha = new Date().toISOString().slice(0, 10);
  descargarArchivo(json, `${prefijo}_${fecha}.json`, 'application/json');
}

document.getElementById('btn-csv-amb')?.addEventListener('click', () => {
  exportarCSV(window.lecturasAmb,
    ['timestamp', 'temperature', 'humidity', 'pressure', 'uv', 'rssi', 'snr', 'count'],
    'ambiental1');
});

document.getElementById('btn-json-amb')?.addEventListener('click', () => {
  exportarJSON(window.lecturasAmb, 'ambiental1');
});

document.getElementById('btn-csv-sue')?.addEventListener('click', () => {
  exportarCSV(window.lecturasSue,
    ['timestamp', 'soil_humidity', 'soil_temperature', 'ph', 'ec',
     'nitrogen', 'phosphorus', 'potassium', 'rssi', 'snr', 'count'],
    'suelo1');
});

document.getElementById('btn-json-sue')?.addEventListener('click', () => {
  exportarJSON(window.lecturasSue, 'suelo1');
});
