const RegistrosApp = (() => {

  const API_URL = "https://script.google.com/macros/s/AKfycbzGakHN4YF7SKk1ULt2LFZC1Vky2ZHNNK-GxxGfW0RyQXZ8jrdGkmhmWODnFfJidaQ-WA/exec";

  let registros = [];
  let filtrosActivos = {};
  let columnaOrden = null;
  let ascendente = true;
  let pestañaActiva = "apellidos";
  let busquedaTexto = "";

  /* ================================
     INIT
  ================================= */
  function init() {

    if (!document.getElementById("lista-registros")) return;

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
     TABS
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
          r["Empleo Puesto"],
          r["Curso"]
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
     RENDER TEXTO HTML
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

const contenedor = document.getElementById("lista-registros");
if (!contenedor) return;

contenedor.innerHTML = ""; // ← fuerza reinicio DOM

let salida = "";

    if (pestañaActiva === "apellidos") {

      const grupos = {};

      datos.forEach(r => {
        const apellido = r["Apellido"] || "Sin apellido";
        if (!grupos[apellido]) grupos[apellido] = [];
        grupos[apellido].push(r);
      });

      const apellidosOrdenados = Object.keys(grupos)
        .sort((a, b) => a.localeCompare(b, 'es'));

      apellidosOrdenados.forEach(apellido => {

        salida += `
<personaje>
<pjg>${apellido}</pjg>
`;
        grupos[apellido]
          .sort((a, b) => (a["Nombre"] || "").localeCompare(b["Nombre"] || "", 'es'))
          .forEach(r => {
            salida += `
&mdash; <b>${r["Nombre"] || ""} ${r["Apellido"] || ""}</b> &bull; ${r["Grupo"] || ""} &bull; ${r["Tipo de Sangre"] || ""}<br/>
`;
          });

        salida += `
</personaje>
`;
      });
    }


if (pestañaActiva === "pb") {

  const grupos = {};

  datos.forEach(r => {
    const sexo = r["Sexo"] || "Sin especificar";
    if (!grupos[sexo]) grupos[sexo] = [];
    grupos[sexo].push(r);
  });

  const sexosOrdenados = Object.keys(grupos)
    .sort((a,b)=> a.localeCompare(b,'es'));

  sexosOrdenados.forEach(sexo => {

    salida += `
<personaje>
<pjg>${sexo}</pjg>
`;

    grupos[sexo]
      .sort((a,b)=> (a["Apellido"]||"").localeCompare(b["Apellido"]||"", 'es'))
      .forEach(r => {
        salida += `
&mdash; <em>${r["PB"] || ""}</em> es <b>${r["Apellido"] || ""} ${r["Nombre"] || ""}</b><br>
`;
      });

    salida += `
</personaje><br>
`;
  });
}

    if (pestañaActiva === "rango") {
  const grupos = {};

  datos.forEach(r => {
    const empleo = r["Empleo Área"] || "Sin especificar";
    if (!grupos[empleo]) grupos[empleo] = [];
    grupos[empleo].push(r);
  });

  const empleosOrdenados = Object.keys(grupos)
    .sort((a,b)=> a.localeCompare(b,'es'));

  empleosOrdenados.forEach(empleo => {

    salida += `
<personaje>
<pjg>${empleo}</pjg>
`;

    grupos[empleo ]
      .sort((a,b)=> (a["Apellido"]||"").localeCompare(b["Apellido"]||"", 'es'))
      .forEach(r => {
        salida += `
&mdash; <b>${r["Apellido"] || ""} ${r["Nombre"] || ""}</b> es <em>${r["Empleo Puesto"] || ""}</em><br>
`;
      });

    salida += `
</personaje><br>
`;
  });
    }

if (pestañaActiva === "sangre") {

  const grupos = {};

  datos.forEach(r => {
    const sangre = r["Tipo de Sangre"] || "Sin especificar";
    if (!grupos[sangre]) grupos[sangre] = [];
    grupos[sangre].push(r);
  });

  const sangresOrdenadas = Object.keys(grupos)
    .sort((a,b)=> a.localeCompare(b,'es'));

  sangresOrdenadas.forEach(sangre => {

    salida += `
<personaje>
<pjg>${sangre}</pjg>
`;

    grupos[sangre]
      .sort((a,b)=> (a["Apellido"]||"").localeCompare(b["Apellido"]||"", 'es'))
      .forEach(r => {
        salida += `
&mdash; <b>${r["Apellido"] || ""} ${r["Nombre"] || ""}</b><br/>
`;
      });

    salida += `
</personaje><br>
`;
  });
}

if (pestañaActiva === "hibridos") {

  const grupos = {};

  datos.forEach(r => {
    const raza = r["Raza"] || "Sin especificar";
    if (!grupos[raza]) grupos[raza] = [];
    grupos[raza].push(r);
  });

  const razasOrdenadas = Object.keys(grupos)
    .sort((a,b)=> a.localeCompare(b,'es'));

  razasOrdenadas.forEach(raza => {

    salida += `
<personaje>
<pjg>${raza}</pjg>
`;

    grupos[raza]
      .sort((a,b)=> (a["Apellido"]||"").localeCompare(b["Apellido"]||"", 'es'))
      .forEach(r => {
        salida += `
&mdash; <b>${r["Apellido"] || ""} ${r["Nombre"] || ""}</b><br>
`;
      });

    salida += `
</personaje><br>
`;
  });
}

if (pestañaActiva === "condiciones") {

  const grupos = {};

  datos.forEach(r => {
    const condicion = (r["Condición"] || "").trim();
    if (!condicion) return; // ← ignorar vacíos

    if (!grupos[condicion]) grupos[condicion] = [];
    grupos[condicion].push(r);
  });

  const condicionesOrdenadas = Object.keys(grupos)
    .sort((a,b)=> a.localeCompare(b,'es'));

  condicionesOrdenadas.forEach(condicion => {

    salida += `
<personaje>
<pjg>${condicion}</pjg>
`;

    grupos[condicion]
      .sort((a,b)=> (a["Apellido"]||"").localeCompare(b["Apellido"]||"", 'es'))
      .forEach(r => {
        salida += `
&mdash; <b>${r["Apellido"] || ""} ${r["Nombre"] || ""}</b><br>
`;
      });

    salida += `
</personaje><br>
`;
  });
}

if (pestañaActiva === "hogwarts") {

  const casasOrden = ["Gryffindor","Ravenclaw","Hufflepuff","Slytherin"];
  const grupos = {};

  // Filtrar y agrupar por Casa → Curso
  datos.forEach(r => {
    const area = (r["Empleo Área"] || "").trim().toLowerCase();
    if (area !== "hogwarts") return;

    const casa = r["Grupo"] || "Sin grupo";
    const curso = r["Curso"] || "Sin curso";

    if (!grupos[casa]) grupos[casa] = {};
    if (!grupos[casa][curso]) grupos[casa][curso] = [];

    grupos[casa][curso].push(r);
  });

  casasOrden.forEach(casa => {

    if (!grupos[casa]) return;

    salida += `
<personaje>
<casa style="
  font-weight:bold;
  color:${
    casa==="Gryffindor" ? "#7F0909" :
    casa==="Slytherin"  ? "#0D6217" :
    casa==="Ravenclaw"  ? "#0E1A40" :
    casa==="Hufflepuff" ? "#ECB939" :
    "#444"
  };
">
${casa}
</casa>
`;

    // Ordenar cursos numéricamente cuando sea posible
    const cursosOrdenados = Object.keys(grupos[casa]).sort((a,b)=>{
      const na = parseInt(a);
      const nb = parseInt(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b,'es');
    });

    cursosOrdenados.forEach(curso => {

      salida += `
&nbsp;&nbsp;<curso>${curso}</curso><br>
`;

      grupos[casa][curso]
        .sort((a,b)=> (a["Apellido"]||"").localeCompare(b["Apellido"]||"", 'es'))
        .forEach(r => {
          salida += `
&nbsp;&nbsp;&nbsp;&nbsp;• <b>${r["Nombre"] || ""} ${r["Apellido"] || ""}</b>
&nbsp;<span>Puesto: ${r["Empleo Puesto"] || ""}</span><br>
`;
        });

      salida += `<br>`;
    });

    salida += `
</personaje><br>
`;
  });
}

    contenedor.innerHTML = salida;
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