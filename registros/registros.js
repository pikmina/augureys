const RegistrosApp = (() => {

  const API_URL = "https://script.google.com/macros/s/AKfycbzGakHN4YF7SKk1ULt2LFZC1Vky2ZHNNK-GxxGfW0RyQXZ8jrdGkmhmWODnFfJidaQ-WA/exec";

  let registros = [];
  let filtrosActivos = {};
  let columnaOrden = null;
  let ascendente = true;
  let pestañaActiva = "Todos";
  let busquedaTexto = "";

  /* ================================
     INIT
  ================================= */
  function init() {

    if (!document.getElementById("tabla-registros")) return;

    activarTabs();
    activarFiltros();

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        registros = data;
        generarFiltros();
        renderTabla();
      })
      .catch(err => console.error(err));
  }

  /* ================================
     TABS (USA LAS DEL HTML)
  ================================= */
  function activarTabs() {

    document.querySelectorAll(".tab-btn").forEach(btn => {

      btn.addEventListener("click", () => {

        document.querySelectorAll(".tab-btn")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        pestañaActiva = btn.dataset.tab;
        renderTabla();
      });

    });
  }

  /* ================================
     FILTROS
  ================================= */
  function generarFiltros() {
    crearGrupoCheckbox("Grupo", "filtro-grupo");
    crearGrupoCheckbox("Tipo de Sangre", "filtro-sangre");
    crearGrupoCheckbox("Sexo", "filtro-sexo");
  }

  function crearGrupoCheckbox(campo, contenedorId) {

    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    const valores = [...new Set(
      registros.map(r => r[campo]).filter(v => v)
    )].sort();

    cont.innerHTML = "";

    const titulo = document.createElement("h4");
    titulo.textContent = campo;
    cont.appendChild(titulo);

    valores.forEach(val => {

      const label = document.createElement("label");

      label.innerHTML = `
      <input type="checkbox" data-campo="${campo}" value="${val}">
      ${val}
    `;

      cont.appendChild(label);
      cont.appendChild(document.createElement("br"));
    });
  }

  function activarFiltros() {

    document.addEventListener("change", e => {

      if (!e.target.matches("#filtro-grupo input, #filtro-sangre input, #filtro-sexo input")) return;

      filtrosActivos = {};

      document.querySelectorAll(
        "#filtro-grupo input:checked, #filtro-sangre input:checked, #filtro-sexo input:checked"
      ).forEach(chk => {

        const campo = chk.dataset.campo;
        if (!filtrosActivos[campo]) filtrosActivos[campo] = [];
        filtrosActivos[campo].push(chk.value);
      });

      renderTabla();
    });

    const btnLimpiar = document.getElementById("btn-limpiar-filtros");

    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", () => {

        document.querySelectorAll(
          "#filtro-grupo input, #filtro-sangre input, #filtro-sexo input"
        ).forEach(chk => chk.checked = false);

        filtrosActivos = {};
        renderTabla(registros);
      });
    }

    const inputBusqueda = document.getElementById("busqueda-texto");

    if (inputBusqueda) {
      inputBusqueda.addEventListener("input", e => {
        busquedaTexto = e.target.value.toLowerCase().trim();
        renderTabla();
      });
    }
  }

  function aplicarFiltros() {

    return registros.filter(r => {

      const pasaCheckbox = Object.keys(filtrosActivos).every(campo =>
        filtrosActivos[campo].includes(r[campo])
      );

      if (!pasaCheckbox) return false;

      if (busquedaTexto) {

        const textoRegistro = [
          r["Nombre"],
          r["Apellido"],
          r["Condición"],
          r["Grupo"],
          r["Tipo de Sangre"],
          r["Raza"],
          r["Empleo Área"],
          r["Empleo Puesto"]
        ]
          .join(" ")
          .toLowerCase();

        if (!textoRegistro.includes(busquedaTexto)) {
          return false;
        }
      }

      return true;
    });
  }

  /* ================================
     RENDER TABLA
  ================================= */
  function renderTabla() {

    let datos = aplicarFiltros();

    if (columnaOrden) {
      datos.sort((a, b) => {
        let A = (a[columnaOrden] || "").toString().toLowerCase();
        let B = (b[columnaOrden] || "").toString().toLowerCase();
        return (A < B ? -1 : A > B ? 1 : 0) * (ascendente ? 1 : -1);
      });
    }

    const theadRow = document.querySelector("#tabla-registros thead tr");
    const tbody = document.querySelector("#tabla-registros tbody");

    if (!theadRow || !tbody) return;

    let headers = [];
    let filas = "";

    if (pestañaActiva === "Todos") {
      headers = [
        "Nombre",
        "Apellido",
        "Grupo",
        "Condición",
        "Tipo de Sangre",
        "Raza",
        "Sexo",
        "PB",
        "Empleo Área",
        "Empleo Puesto"
      ];

      datos.forEach(r => {
        filas += `
      <tr>
        <td>${r["Nombre"] || ""}</td>
        <td>${r["Apellido"] || ""}</td>
        <td>${r["Grupo"] || ""}</td>
        <td>${r["Condición"] || ""}</td>
        <td>${r["Tipo de Sangre"] || ""}</td>
        <td>${r["Raza"] || ""}</td>
        <td>${r["Sexo"] || ""}</td>
        <td>${r["PB"] || ""}</td>
        <td>${r["Empleo Área"] || ""}</td>
        <td>${r["Empleo Puesto"] || ""}</td>
      </tr>
    `;
      });
    }

    if (pestañaActiva === "personaje") {
      headers = ["Nombre", "Condición", "Tipo de Sangre", "Raza", "PB"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>
            <td>${r["Condición"] || ""}</td>
            <td>${r["Tipo de Sangre"] || ""}</td>
            <td>${r["Raza"] || ""}</td>
            <td>${r["PB"] || ""}</td>
          </tr>
        `;
      });
    }

    if (pestañaActiva === "pb") {
      headers = ["Nombre", "PB"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>
            <td>${r["PB"] || ""}</td>
          </tr>
        `;
      });
    }

    if (pestañaActiva === "rango") {
      headers = ["Institución", "Puesto", "Nombre"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Empleo Área"] || ""}</td>
            <td>${r["Empleo Puesto"] || ""}</td>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>           
          </tr>
        `;
      });
    }

    if (pestañaActiva === "sangre") {
      headers = ["Nombre", "Tipo de Sangre", "Condición", "Raza"];
      datos.forEach(r => {
        filas += `
          <tr>
            <td>${r["Apellido"] || ""} ${r["Nombre"] || ""}</td>
            <td>${r["Tipo de Sangre"] || ""}</td>
            <td>${r["Condición"] || ""}</td>
            <td>${r["Raza"] || ""}</td>
          </tr>
        `;
      });
    }

    theadRow.innerHTML = headers.map(h =>
      `<th onclick="RegistrosApp.ordenar('${h}')">${h}</th>`
    ).join("");

    tbody.innerHTML = filas;
  }

  /* ================================
     SORT
  ================================= */
  function ordenar(col) {

    if (columnaOrden === col) {
      ascendente = !ascendente;
    } else {
      columnaOrden = col;
      ascendente = true;
    }

    renderTabla();
  }

  return {
    init,
    ordenar
  };

})();

document.addEventListener("DOMContentLoaded", () => {
  RegistrosApp.init();
});