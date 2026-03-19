// ─── Configuración de métodos ────────────────────────────────────────────────

const INTERPOLACIONES = {
  lineal:     { entradas: 2, fn: interpolarLineal },
  cuadratica: { entradas: 3, fn: interpolarCuadratica },
  lg_1:       { entradas: 2, fn: lagrangePrimer },
  lg_2:       { entradas: 3, fn: lagrangeSegundo },
};

// ─── Estado ──────────────────────────────────────────────────────────────────

let resultado = null;

// ─── DOM helpers ─────────────────────────────────────────────────────────────

const el  = (id) => document.getElementById(id);
const num = (id) => el(id).valueAsNumber;

// ─── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  el("inputError").addEventListener("input", actualizarError);
  el("x").addEventListener("input", actualizarAdvertencia);
  el("tipoInterpolacion").addEventListener("change", () => {
    generarCampos();
    suscribirCamposPuntos();
  });
  // No llamar generarCampos() aquí: al cargar, el select tiene
  // "Elegir opción" (value=""), lo que causaría un crash.
});

// ─── UI ───────────────────────────────────────────────────────────────────────

function generarCampos() {
  const tipo = el("tipoInterpolacion").value;
  const cantidad = INTERPOLACIONES[tipo].entradas;
  const contenedor = el("camposDatos");

  const filas = Array.from({ length: cantidad }, (_, i) => `
    <div class="row mb-2">
      <div class="col-md-6">
        <input type="number" class="form-control" placeholder="x${i}" id="x${i}">
      </div>
      <div class="col-md-6">
        <input type="number" class="form-control" placeholder="f(x${i})" id="f${i}">
      </div>
    </div>
  `).join("");

  contenedor.innerHTML = "<h5>Ingrese los datos:</h5>" + filas;
}

// Suscribe actualizarAdvertencia a cada campo x0, x1... para que reaccione
// cuando cambian los puntos, no solo cuando cambia x.
function suscribirCamposPuntos() {
  const tipo = el("tipoInterpolacion").value;
  const cantidad = INTERPOLACIONES[tipo].entradas;
  for (let i = 0; i < cantidad; i++) {
    el(`x${i}`)?.addEventListener("input", actualizarAdvertencia);
  }
}

function calcularInterpolacion() {
  const tipo = el("tipoInterpolacion").value;
  resultado = INTERPOLACIONES[tipo].fn();
  el("resultado").innerHTML = `Resultado: f(x) = ${resultado}`;
}

function mostrarError() {
  const seccion = el("seccionError");
  seccion.style.display = "block";
  seccion.style.opacity = 0;
  seccion.getBoundingClientRect(); // forzar reflow
  seccion.style.transition = "opacity 0.5s";
  seccion.style.opacity = 1;
}

function actualizarError() {
  const valorExacto = el("inputError").valueAsNumber;
  if (!valorExacto || resultado === null) return;

  const error = Math.abs((valorExacto - resultado) / valorExacto) * 100;
  el("errorP").textContent = `Error porcentual: ${error.toFixed(6)}%`;
}

function actualizarAdvertencia() {
  const tipo = el("tipoInterpolacion").value;
  if (!tipo) return;

  const cantidad = INTERPOLACIONES[tipo].entradas;
  const puntos = leerPuntos(cantidad);
  const x = num("x");

  const xMin = puntos[0].x;
  const xMax = puntos[cantidad - 1].x;

  const advertencia = el("advertencia");

  if (isNaN(x) || isNaN(xMin) || isNaN(xMax)) {
    advertencia.style.display = "none";
    return;
  }

  advertencia.style.display = esExtrapolacion(xMin, xMax, x) ? "block" : "none";
}

// ─── Lógica de extrapolación ──────────────────────────────────────────────────

function esExtrapolacion(a, b, x) {
  return x < a || x > b;
}

function verificarExtrapolacion(a, b, x) {
  el("advertencia").style.display = esExtrapolacion(a, b, x) ? "block" : "none";
}

// ─── Lectura de puntos desde el DOM ──────────────────────────────────────────

function leerPuntos(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({
    x: num(`x${i}`),
    f: num(`f${i}`),
  }));
}

// ─── Métodos de interpolación ─────────────────────────────────────────────────

function interpolarLineal() {
  const [p0, p1] = leerPuntos(2);
  const x = num("x");
  verificarExtrapolacion(p0.x, p1.x, x);
  return p0.f + ((p1.f - p0.f) / (p1.x - p0.x)) * (x - p0.x);
}

function interpolarCuadratica() {
  const [p0, p1, p2] = leerPuntos(3);
  const x = num("x");
  verificarExtrapolacion(p0.x, p2.x, x);
  const b0 = p0.f;
  const b1 = (p1.f - p0.f) / (p1.x - p0.x);
  const b2 = ((p2.f - p1.f) / (p2.x - p1.x) - b1) / (p2.x - p0.x);
  return b0 + b1 * (x - p0.x) + b2 * (x - p0.x) * (x - p1.x);
}

function lagrangePrimer() {
  const [p0, p1] = leerPuntos(2);
  const x = num("x");
  verificarExtrapolacion(p0.x, p1.x, x);
  const L0 = (x - p1.x) / (p0.x - p1.x);
  const L1 = (x - p0.x) / (p1.x - p0.x);
  return L0 * p0.f + L1 * p1.f;
}

function lagrangeSegundo() {
  const [p0, p1, p2] = leerPuntos(3);
  const x = num("x");
  verificarExtrapolacion(p0.x, p2.x, x);
  const L0 = ((x - p1.x) * (x - p2.x)) / ((p0.x - p1.x) * (p0.x - p2.x));
  const L1 = ((x - p0.x) * (x - p2.x)) / ((p1.x - p0.x) * (p1.x - p2.x));
  const L2 = ((x - p0.x) * (x - p1.x)) / ((p2.x - p0.x) * (p2.x - p1.x));
  return L0 * p0.f + L1 * p1.f + L2 * p2.f;
}