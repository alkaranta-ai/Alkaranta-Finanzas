const categorias = {
  Ingreso: ["Sueldo","Horas Extras","Comisiones","Ventas","Honorarios","Inversiones","Otros"],
  Egreso:  ["Supermercado","Combustible","Servicios","Internet","Telefonía","Salud","Educación","Impuestos","Tarjetas","Entretenimiento","Otros"]
};

let movimientos  = JSON.parse(localStorage.getItem("movimientos"))  || [];
let presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || {};
let metas        = JSON.parse(localStorage.getItem("metas"))        || [];
let modoActual   = 'personal';
let editandoIdx  = null;
let metaAhorroIdx = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
  actualizarCategorias();
  poblarFiltroMeses();
  renderizar();
  renderPresupuesto();
  renderMetas();
  document.querySelectorAll(".overlay").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) cerrarModales(); });
  });
});

function cambiarTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + tab).classList.add('active');
  btn.classList.add('active');
  if (tab === 'inicio')        { renderizar(); }
  if (tab === 'movimientos')   { poblarFiltroMeses(); renderizar(); }
  if (tab === 'presupuesto')   { renderPresupuesto(); }
  if (tab === 'metas')         { renderMetas(); }
}

function cambiarModo(modo) {
  modoActual = modo;
  document.getElementById('btnPersonal').classList.toggle('active', modo === 'personal');
  document.getElementById('btnLaboral').classList.toggle('active', modo === 'laboral');
  cancelarEdicion();
  poblarFiltroMeses();
  renderizar();
  renderPresupuesto();
  renderMetas();
}

function pertenece(m) { return (m.entidad || 'personal') === modoActual; }

function actualizarCategorias() {
  const tipo = document.getElementById("tipo").value;
  const sel  = document.getElementById("categoria");
  sel.innerHTML = "";
  categorias[tipo].forEach(c => {
    const o = document.createElement("option");
    o.value = o.textContent = c;
    sel.appendChild(o);
  });
}

function guardarMovimiento() {
  const fecha       = document.getElementById("fecha").value;
  const tipo        = document.getElementById("tipo").value;
  const categoria   = document.getElementById("categoria").value;
  const monto       = Number(document.getElementById("monto").value);
  const descripcion = document.getElementById("descripcion").value.trim();
  if (!monto || monto <= 0) { alert("Ingresá un monto válido."); return; }
  if (!fecha) { alert("Seleccioná una fecha."); return; }
  const mov = { fecha, tipo, categoria, monto, descripcion, entidad: modoActual };
  if (editandoIdx !== null) {
    movimientos[editandoIdx] = mov;
    editandoIdx = null;
    document.getElementById("btnGuardar").textContent = "Guardar";
    document.getElementById("btnCancelar").style.display = "none";
  } else {
    movimientos.push(mov);
  }
  guardarLS(); limpiar(); poblarFiltroMeses(); renderizar(); renderPresupuesto();
}

function limpiar() {
  document.getElementById("monto").value = "";
  document.getElementById("descripcion").value = "";
}

function cancelarEdicion() {
  editandoIdx = null;
  document.getElementById("btnGuardar").textContent = "Guardar";
  document.getElementById("btnCancelar").style.display = "none";
  limpiar();
}

function editarMovimiento(i) {
  const m = movimientos[i];
  if (!m) return;
  editandoIdx = i;
  document.getElementById("fecha").value       = m.fecha;
  document.getElementById("tipo").value        = m.tipo;
  actualizarCategorias();
  document.getElementById("categoria").value   = m.categoria;
  document.getElementById("monto").value       = m.monto;
  document.getElementById("descripcion").value = m.descripcion || "";
  document.getElementById("btnGuardar").textContent = "Actualizar";
  document.getElementById("btnCancelar").style.display = "block";
  cambiarTab('movimientos', document.querySelectorAll('.nav-btn')[1]);
  setTimeout(() => document.querySelector('.form-card').scrollIntoView({ behavior: "smooth" }), 100);
}

function eliminarMovimiento(i) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  if (editandoIdx !== null) {
    if (editandoIdx === i) cancelarEdicion();
    else if (editandoIdx > i) editandoIdx--;
  }
  movimientos.splice(i, 1);
  guardarLS(); poblarFiltroMeses(); renderizar(); renderPresupuesto();
}

function guardarLS() {
  localStorage.setItem("movimientos",  JSON.stringify(movimientos));
  localStorage.setItem("presupuestos", JSON.stringify(presupuestos));
  localStorage.setItem("metas",        JSON.stringify(metas));
}

function poblarFiltroMeses() {
  const sel = document.getElementById("filtroMes");
  const actual = sel.value;
  const meses = new Set();
  movimientos.filter(pertenece).forEach(m => {
    if (m.fecha && m.fecha.length >= 7) meses.add(m.fecha.slice(0, 7));
  });
  sel.innerHTML = '<option value="">Todos los meses</option>';
  [...meses].sort().reverse().forEach(mes => {
    const [a, n] = mes.split("-");
    const nombre = new Date(a, n - 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    const o = document.createElement("option");
    o.value = mes;
    o.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    if (mes === actual) o.selected = true;
    sel.appendChild(o);
  });
}

function renderizar() {
  const filtroMes  = document.getElementById("filtroMes").value;
  const filtroTipo = document.getElementById("filtroTipo").value;
  const filtrados = movimientos.filter(m =>
    pertenece(m) &&
    (!filtroMes  || (m.fecha && m.fecha.startsWith(filtroMes))) &&
    (!filtroTipo || m.tipo === filtroTipo)
  );

  let ingresos = 0, egresos = 0;
  filtrados.forEach(m => { if (m.tipo === "Ingreso") ingresos += m.monto; else egresos += m.monto; });

  const saldo = ingresos - egresos;
  const sEl = document.getElementById("saldoTotal");
  sEl.textContent = "$" + saldo.toLocaleString("es-AR");
  sEl.className = "hero-amount" + (saldo < 0 ? " negative" : "");
  document.getElementById("totalIngresos").textContent = "$" + ingresos.toLocaleString("es-AR");
  document.getElementById("totalEgresos").textContent  = "$" + egresos.toLocaleString("es-AR");

  if (filtroMes) {
    const [a, n] = filtroMes.split("-");
    document.getElementById("periodoLabel").textContent =
      new Date(a, n - 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  } else {
    document.getElementById("periodoLabel").textContent = "Todos los períodos";
  }

  const lista = document.getElementById("listaMovimientos");
  lista.className = "list-group glass";
  lista.innerHTML = "";

  if (filtrados.length === 0) {
    lista.innerHTML = '<div class="empty"><span class="empty-icon">📭</span>Sin movimientos para mostrar.</div>';
  } else {
    [...filtrados].reverse().forEach(mov => {
      const idx = movimientos.indexOf(mov);
      const fecha = mov.fecha
        ? new Date(mov.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })
        : "";
      const isIng = mov.tipo === "Ingreso";
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <div class="list-row-left">
          <div class="list-icon ${isIng ? 'ing' : 'egr'}">${isIng ? '↑' : '↓'}</div>
          <div>
            <div class="list-title">${mov.categoria}</div>
            <div class="list-sub">${mov.descripcion || mov.tipo}</div>
          </div>
        </div>
        <div class="list-right">
          <div class="list-amount ${isIng ? 'ing' : 'egr'}">${isIng ? '+' : '-'}$${mov.monto.toLocaleString("es-AR")}</div>
          <div class="list-date">${fecha}</div>
        </div>
        <div class="list-actions">
          <button class="btn-row-action" onclick="editarMovimiento(${idx})">✏️</button>
          <button class="btn-row-action" onclick="eliminarMovimiento(${idx})">🗑️</button>
        </div>`;
      lista.appendChild(row);
    });
  }

  actualizarCategoriasList(filtrados);
  renderDashboard(ingresos, egresos, filtrados, filtroMes);
}

function actualizarCategoriasList(filtrados) {
  const cont = document.getElementById("listaCategorias");
  cont.className = "list-group glass";
  cont.innerHTML = "";
  const res = {};
  filtrados.forEach(m => { res[m.categoria] = (res[m.categoria] || 0) + m.monto; });
  const sorted = Object.entries(res).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    cont.innerHTML = '<div class="empty"><span class="empty-icon">📊</span>Sin datos aún.</div>';
    return;
  }
  const maxVal = sorted[0][1];
  sorted.forEach(([cat, total]) => {
    const pct = Math.round((total / maxVal) * 100);
    const isEgreso = filtrados.some(m => m.categoria === cat && m.tipo === "Egreso");
    const color = isEgreso ? "var(--red)" : "var(--emerald)";
    const row = document.createElement("div");
    row.className = "list-row";
    row.style.flexDirection = "column";
    row.style.alignItems = "stretch";
    row.style.gap = "6px";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="color:var(--text-1);font-size:15px;font-weight:500">${cat}</span>
        <span style="font-size:15px;font-weight:600;color:var(--text-1)">$${total.toLocaleString("es-AR")}</span>
      </div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${color}"></div></div>`;
    cont.appendChild(row);
  });
}

function diasEnPeriodo(filtroMes, filtrados) {
  if (filtroMes) {
    const [a, n] = filtroMes.split("-").map(Number);
    return new Date(a, n, 0).getDate();
  }
  const fechas = filtrados.map(m => m.fecha).filter(Boolean).sort();
  if (fechas.length === 0) return 1;
  const ini = new Date(fechas[0] + "T00:00:00");
  const fin = new Date(fechas[fechas.length - 1] + "T00:00:00");
  return Math.max(Math.round((fin - ini) / 86400000) + 1, 1);
}

function renderDashboard(ingresos, egresos, filtrados, filtroMes) {
  const total = ingresos + egresos;
  const pctIng = total > 0 ? Math.round((ingresos / total) * 100) : 50;
  const pctEgr = 100 - pctIng;
  document.getElementById("balBarIng").style.width = pctIng + "%";
  document.getElementById("balBarEgr").style.width = pctEgr + "%";
  document.getElementById("balPctIng").textContent = pctIng + "%";
  document.getElementById("balPctEgr").textContent = pctEgr + "%";
  const tasa = ingresos > 0 ? Math.round(((ingresos - egresos) / ingresos) * 100) : 0;
  const tasaEl = document.getElementById("kpiTasa");
  tasaEl.textContent = tasa + "%";
  tasaEl.classList.toggle("kpi-neg", tasa < 0);
  const porCat = {};
  filtrados.filter(m => m.tipo === "Egreso").forEach(m => {
    porCat[m.categoria] = (porCat[m.categoria] || 0) + m.monto;
  });
  const topCat = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("kpiTopCat").textContent = topCat ? topCat[0] : "—";
  document.getElementById("kpiTopCatMonto").textContent = topCat ? "$" + topCat[1].toLocaleString("es-AR") : "$0";
  const dias = diasEnPeriodo(filtroMes, filtrados);
  const promedio = Math.round(egresos / dias);
  document.getElementById("kpiPromedio").textContent = "$" + promedio.toLocaleString("es-AR");
  document.getElementById("kpiMovs").textContent = filtrados.length;
}

function explicarTasaAhorro() {
  alert(
    "¿Cómo se calcula la tasa de ahorro?\n\n" +
    "Es automática: (Ingresos − Egresos) / Ingresos del período que estés viendo.\n\n" +
    "Para que sea correcta, registrá tus ingresos y egresos en 'Movimientos'.\n\n" +
    "Si querés guardar para un objetivo (vacaciones, auto, etc.), usá la pestaña 'Metas'."
  );
}

function abrirModalPresupuesto() {
  const sel = document.getElementById("budgetCat");
  sel.innerHTML = "";
  const usadas = Object.keys(presupuestos)
    .filter(k => k.startsWith(modoActual + "_"))
    .map(k => k.replace(modoActual + "_", ""));
  categorias.Egreso.forEach(c => {
    if (usadas.includes(c)) return;
    const o = document.createElement("option");
    o.value = o.textContent = c;
    sel.appendChild(o);
  });
  if (sel.options.length === 0) {
    alert("Ya tenés presupuestos en todas las categorías. Eliminá uno antes de agregar otro.");
    return;
  }
  document.getElementById("budgetMonto").value = "";
  document.getElementById("modalPresupuesto").classList.add("open");
}

function guardarPresupuesto() {
  const cat   = document.getElementById("budgetCat").value;
  const monto = Number(document.getElementById("budgetMonto").value);
  if (!monto || monto <= 0) { alert("Ingresá un monto válido."); return; }
  presupuestos[modoActual + "_" + cat] = monto;
  guardarLS(); cerrarModales(); renderPresupuesto();
}

function eliminarPresupuesto(key) {
  const cat = key.replace(modoActual + "_", "");
  if (!confirm("¿Eliminar el presupuesto de \"" + cat + "\"?")) return;
  delete presupuestos[key];
  guardarLS(); renderPresupuesto();
}

function renderPresupuesto() {
  const filtroMes = document.getElementById("filtroMes") ? document.getElementById("filtroMes").value : "";
  const mes = filtroMes || new Date().toISOString().slice(0, 7);
  const cont = document.getElementById("budgetList");
  cont.className = "list-group glass";
  cont.innerHTML = "";
  const keys = Object.keys(presupuestos).filter(k => k.startsWith(modoActual + "_"));
  if (keys.length === 0) {
    cont.innerHTML = '<div class="empty"><span class="empty-icon">🎯</span>No hay presupuestos aún.</div>';
    return;
  }
  let totalLimite = 0, totalGastado = 0;
  keys.forEach(key => {
    const cat     = key.replace(modoActual + "_", "");
    const limite  = presupuestos[key];
    const gastado = movimientos
      .filter(m => pertenece(m) && m.tipo === "Egreso" && m.categoria === cat && m.fecha && m.fecha.startsWith(mes))
      .reduce((s, m) => s + m.monto, 0);
    const pct = Math.min((gastado / limite) * 100, 100);
    const cls = pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";
    totalLimite  += limite;
    totalGastado += gastado;
    const div = document.createElement("div");
    div.className = "budget-row";
    div.innerHTML = `
      <div class="budget-head">
        <span class="budget-name">${cat}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="budget-nums">$${gastado.toLocaleString("es-AR")} / <b>$${limite.toLocaleString("es-AR")}</b></span>
          <button class="btn-row-action" onclick="eliminarPresupuesto('${key}')" title="Eliminar" style="padding:3px 7px;font-size:11px">✕</button>
        </div>
      </div>
      <div class="prog-bar"><div class="prog-fill ${cls}" style="width:${pct}%"></div></div>`;
    cont.appendChild(div);
  });
  if (keys.length > 1) {
    const totalPct = Math.min((totalGastado / totalLimite) * 100, 100);
    const totalCls = totalPct >= 100 ? "over" : totalPct >= 80 ? "warn" : "ok";
    const totalDiv = document.createElement("div");
    totalDiv.className = "budget-row";
    totalDiv.style.background = "var(--surface-2)";
    totalDiv.style.fontWeight = "600";
    totalDiv.innerHTML = `
      <div class="budget-head">
        <span class="budget-name">Total</span>
        <span class="budget-nums">$${totalGastado.toLocaleString("es-AR")} / <b>$${totalLimite.toLocaleString("es-AR")}</b></span>
      </div>
      <div class="prog-bar"><div class="prog-fill ${totalCls}" style="width:${totalPct}%"></div></div>`;
    cont.appendChild(totalDiv);
  }
}

function abrirModalMeta() {
  ["metaNombre", "metaObjetivo", "metaAhorrado"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("modalMeta").classList.add("open");
}

function guardarMeta() {
  const nombre   = document.getElementById("metaNombre").value.trim();
  const objetivo = Number(document.getElementById("metaObjetivo").value);
  const ahorrado = Number(document.getElementById("metaAhorrado").value) || 0;
  const icono    = document.getElementById("metaIcono").value;
  if (!nombre) { alert("Ingresá un nombre."); return; }
  if (!objetivo || objetivo <= 0) { alert("Ingresá un objetivo válido."); return; }
  metas.push({ nombre, objetivo, ahorrado, icono, entidad: modoActual });
  guardarLS(); cerrarModales(); renderMetas();
}

function abrirModalAhorro(idx) {
  metaAhorroIdx = idx;
  document.getElementById("modalAhorroTitulo").textContent = metas[idx].nombre;
  document.getElementById("ahorroMonto").value = "";
  document.getElementById("modalAhorro").classList.add("open");
}

function confirmarAhorro() {
  const monto = Number(document.getElementById("ahorroMonto").value);
  if (!monto || monto <= 0) { alert("Ingresá un monto válido."); return; }
  metas[metaAhorroIdx].ahorrado += monto;
  guardarLS(); cerrarModales(); renderMetas();
}

function eliminarMeta(idx) {
  if (!confirm("¿Eliminar esta meta?")) return;
  metas.splice(idx, 1);
  guardarLS(); renderMetas();
}

function renderMetas() {
  const grid = document.getElementById("metaGrid");
  grid.innerHTML = "";
  const del = metas.map((m, i) => ({ ...m, _i: i })).filter(m => (m.entidad || 'personal') === modoActual);
  if (del.length === 0) {
    const empty = document.createElement("div");
    empty.style.gridColumn = "1/-1";
    empty.className = "empty";
    empty.innerHTML = '<span class="empty-icon">⭐</span>Todavía no tenés metas. Creá la primera.';
    grid.appendChild(empty);
  }
  del.forEach(m => {
    const pct = Math.min(Math.round((m.ahorrado / m.objetivo) * 100), 100);
    const cls = pct >= 100 ? "over" : pct >= 60 ? "warn" : "ok";
    const card = document.createElement("div");
    card.className = "meta-card glass";
    card.innerHTML = `
      <span class="meta-emoji">${m.icono}</span>
      <div class="meta-name">${m.nombre}</div>
      <div class="meta-sub">$<b>${m.ahorrado.toLocaleString("es-AR")}</b> de $${m.objetivo.toLocaleString("es-AR")}</div>
      <div class="prog-bar"><div class="prog-fill ${cls}" style="width:${pct}%"></div></div>
      <div class="meta-pct">${pct}%</div>
      <div class="meta-btns">
        <button class="btn-meta-plus" onclick="abrirModalAhorro(${m._i})">+ Agregar</button>
        <button class="btn-meta-del" onclick="eliminarMeta(${m._i})">🗑️</button>
      </div>`;
    grid.appendChild(card);
  });
  const btnNew = document.createElement("button");
  btnNew.className = "btn-add-meta";
  btnNew.textContent = "+ Nueva meta";
  btnNew.onclick = abrirModalMeta;
  grid.appendChild(btnNew);
}

function cerrarModales() {
  document.querySelectorAll(".overlay").forEach(m => {
    m.classList.remove("open");
    m.style.top    = '';
    m.style.height = '';
  });
}

function exportarCSV() {
  const del = movimientos.filter(pertenece);
  if (del.length === 0) { alert("No hay movimientos para exportar."); return; }
  const enc  = ["Fecha", "Tipo", "Categoría", "Monto", "Descripción"];
  const filas = del.map(m => [m.fecha, m.tipo, m.categoria, m.monto, m.descripcion || ""]);
  const csv = [enc, ...filas].map(r => r.map(c => "\"" + String(c).replace(/"/g, '""') + "\"").join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  a.download = "finanzas-" + modoActual + "-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function resetearFecha() {
  document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
}
