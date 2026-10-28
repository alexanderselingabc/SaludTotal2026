// ============================================================
// LOCAL STORAGE
// ============================================================

const STORAGE_KEY = "portalPacienteData";
const SESSION_KEY = "portalPacienteUsuario";
const API_URL = "https://saludtotal-backend-d2g6.onrender.com";


function guardarDatosGlobales(datos) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
}

function guardarUsuarioActual(usuario) {
	localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

async function obtenerTurnos() {
	const respuesta = await fetch(`${API_URL}/api/turnos`);

	if (!respuesta.ok) {
		throw new Error("Error al obtener los turnos");
	}

	return await respuesta.json();
}

async function obtenerUsuarios() {
	const respuesta = await fetch(`${API_URL}/api/usuarios`);

	if (!respuesta.ok) {
		throw new Error("Error al obtener los usuarios");
	}

	return await respuesta.json();
}


async function obtenerEspecialidadesDeMiApi() {

	const respuesta = await fetch(`${API_URL}/api/especialidades`);

	if (!respuesta.ok) {
		throw new Error("Error al obtener los usuarios");
	}

	return await respuesta.json();

}





async function obtenerDatosGlobales() {
	// Mejora: combinamos datos del local storage con los del json
	const ruta = resolverUrlRelativa("data/datos.json");
	const respuesta = await fetch(ruta);
	const datosIniciales = await respuesta.json();

	const datosGuardados = localStorage.getItem(STORAGE_KEY);

	if (!datosGuardados) {
		guardarDatosGlobales(datosIniciales);
		return datosIniciales;
	}

	const datosGuardadosParseados = JSON.parse(datosGuardados);

	return {
		...datosIniciales,
		...datosGuardadosParseados
	};
}

function obtenerUsuarioActual() {
	const usuario = localStorage.getItem(SESSION_KEY);
	return usuario ? JSON.parse(usuario) : null;
}

function cerrarSesion() {
	//esta funciona se llama directamente desde HTML.
	localStorage.removeItem(SESSION_KEY);
	window.location.href = resolverUrlRelativa("index.html");
}

// ============================================================
// UTILIDADES
// ============================================================

function resolverUrlRelativa(path) {
	// Resuelve la ruta tomando como referencia la raíz del proyecto.
	const dentroDePages = window.location.pathname.includes("/pages/");
	return dentroDePages
		? `../${path}`
		: path;
}

function normalizarRol(rol) {
	return rol === "medico" ? "admin" : rol;
}


// ============================================================
// ACCIONES DE FORMULARIOS
// ============================================================

async function buscarUsuario(email, password) {
	const datos = await obtenerDatosGlobales();
	return datos.usuarios.find(usuario =>
		usuario.email.toLowerCase() === email.toLowerCase() &&
		usuario.password === password
	);
}

async function interceptarIniciarSesion(event) {
	event.preventDefault();
	const email = document.querySelector("#email").value.trim();
	const password = document.querySelector("#password").value.trim();
	const errores = document.querySelector(".errores");

	if (!email || !password) {
		errores.style.display = "block";
		errores.textContent = "Completá email y contraseña.";
		return;
	}

	const usuario = await buscarUsuario(email, password);
	if (!usuario) {
		errores.style.display = "block";
		errores.textContent = "Usuario o contraseña incorrectos";
		return;
	}

	guardarUsuarioActual(usuario);

	const destino = normalizarRol(usuario.rol) === "admin"
		? "pages/statistics.html"
		: "index.html";
	window.location.href = resolverUrlRelativa(destino);
}

async function interceptarNuevoTurno(event) {
	event.preventDefault();
	const usuario = obtenerUsuarioActual();
	if (!usuario || usuario.rol !== "paciente") {
		window.location.href = resolverUrlRelativa("index.html");
		return;
	}

	const fecha = document.querySelector("#fecha").value;
	const hora = document.querySelector("#hora").value;
	const medicoId = Number(document.querySelector("#medico").value);
	const especialidad = document.querySelector("#especialidad").value;

	if (!fecha || !hora || !medicoId) {
		alert("Complete todos los datos del turno.");
		return;
	}

	const datos = await obtenerDatosGlobales();
	const nuevoTurno = {
		id: Date.now(),
		pacienteId: usuario.id,
		medicoId,
		especialidad,
		fecha,
		hora,
		estado: "Pendiente"
	};

	datos.turnos.push(nuevoTurno);
	guardarDatosGlobales(datos);
	window.location.href = resolverUrlRelativa("pages/confirmacion.html");
}


// ============================================================
// GENERAL: HEADER Y NAVBAR
// ============================================================

function renderizarNavBar(usuario) {

	const elementos = document.querySelectorAll(".paciente, .admin, .visitante");

	elementos.forEach(elemento => {
		elemento.style.display = "none";
	});

	const clase = usuario ? normalizarRol(usuario.rol) : "visitante";

	document.querySelectorAll(`.${clase}`).forEach(elemento => {
		elemento.style.display = "list-item";
	});

	const bienvenida = document.querySelector("#bienvenida");

	if (bienvenida) {
		bienvenida.textContent = usuario
			? `Bienvenid@ ${usuario.nombre}`
			: "Bienvenido visitante";
	}
}


// ============================================================
// VISITANTE: LOGIN
// ============================================================

function renderizarPageLogin() {
	const formulario = document.querySelector("#form-login");
	if (formulario) {
		formulario.addEventListener("submit", interceptarIniciarSesion);
	}
}


// ============================================================
// VISITANTE: HOME
// ============================================================

async function renderizarPageHome() {

	const lista = document.querySelector("#lista-especialidades");
	if (!lista) return;

	// const datos = await obtenerDatosGlobales();

	const especialidades = await obtenerEspecialidadesDeMiApi();


	for (const especialidad of especialidades) {
		const article = document.createElement("article");

		article.innerHTML = `
			<h3>${especialidad.nombre}</h3>
			<p>${especialidad.descripcion}</p>
		`;

		lista.append(article);
	}
}


// ============================================================
// PANTALLAS: PACIENTE - NUEVO TURNO
// ============================================================

async function renderizarPageNuevoTurno() {
	const datos = await obtenerDatosGlobales();
	const selectMedico = document.querySelector("#medico");

	if (!selectMedico) return;

	selectMedico.innerHTML = "";
	datos.medicos.forEach(medico => {
		selectMedico.innerHTML += `
			<option value="${medico.id}">
				${medico.nombre} - ${medico.especialidad}
			</option>
		`;
	});

	document.querySelector("#form-turno").addEventListener("submit", interceptarNuevoTurno);

}

// ============================================================
// PANTALLAS: PACIENTE - MIS TURNOS
// ============================================================
async function renderizarPageResultados(usuario) {

	const contenedor = document.querySelector("#tabla_de_resultados");
	if (!contenedor) return;

	if (!usuario || usuario.rol !== "paciente") {
		window.location.href = resolverUrlRelativa("pages/login.html");
		return;
	}
	const datos = await obtenerDatosGlobales();
	const resultados = datos.resultados.filter(resultado => resultado.pacienteId === usuario.id).sort(resultado => resultado.fecha);

	if (!resultados.length) {
		contenedor.innerHTML = '<tr><td colspan="6">Todavía no tenés resultados registrados.</td></tr>';
		return;
	}
	function resultadoAResultadoPaciente(resultado) {
		console.log(resultado)
		console.log(datos.medicos)
		const medico = datos.medicos.find(medico => medico.id === resultado.medicoId);
		return `<tr>
			<td>${resultado.tipo}</td>
			<td>${resultado.fecha}</td>
			<td>${medico?.nombre}</td>
			<td>${resultado.estado == true ? "Disponible" : "No disponible"}</td>
			<td> <button>Ver detalles</button> </td>
		</tr>`;
	}
	contenedor.innerHTML = resultados.map(resultadoAResultadoPaciente).join("");
}


async function renderizarPageMisTurnos(usuario) {
	const contenedor = document.querySelector("#turnos-container");
	if (!contenedor) return;

	if (!usuario || usuario.rol !== "paciente") {
		window.location.href = resolverUrlRelativa("pages/login.html");
		return;
	}

	const datos = await obtenerDatosGlobales();

	const turnosDelPaciente = datos.turnos
		.filter(turno => turno.pacienteId === usuario.id)
		.sort((a, b) => a.fecha.localeCompare(b.fecha));

	// filtramos y luego ordenamos los turnos por fecha.


	if (!turnosDelPaciente.length) {
		contenedor.innerHTML = '<tr><td colspan="6">Todavía no tenés turnos registrados.</td></tr>';
		return;
	}

	function turnoAFilaDePaciente(turno) {
		const medico = datos.medicos.find(
			medico => medico.id === turno.medicoId
		);

		return `<tr>
			<td>${turno.fecha}</td>
			<td>${turno.hora}</td>
			<td>${turno.especialidad}</td>
			<td>${medico ? medico.nombre : "Sin médico"}</td>
			<td>${turno.estado}</td>
			<td> <button class="danger" type="button">Cancelar</button> </td>
			<td> <button type="button">Reprogramar</button> </td>
		</tr>`;
	}

	contenedor.innerHTML = turnosDelPaciente.map(turnoAFilaDePaciente).join("");
}

// ============================================================
// PANTALLAS: ADMIN - ESTADISTICAS
// ============================================================

async function renderizarPageEstadisticas(usuario) {
	const contenedor = document.querySelector("#estadisticas");
	if (!contenedor) return;

	if (!usuario || usuario.rol !== "admin") {
		window.location.href = resolverUrlRelativa("index.html");
		return;
	}

	const turnos = await obtenerTurnos();
	const usuarios = await obtenerUsuarios();


	// const datos = await obtenerDatosGlobales();
	const totalTurnos = turnos.length;
	const pendientes = turnos.filter(turno => turno.estado === "Pendiente").length;
	const confirmados = turnos.filter(turno => turno.estado === "Confirmado").length;

	function turnoAFilaDeEstadisticas(turno) {
		const paciente = usuarios.find(
			usuario => usuario.id === turno.pacienteId
		);

		return `<tr>
			<td>${paciente ? paciente.nombre : "Paciente"}</td>
			<td>${turno.especialidad}</td>
			<td>${turno.fecha}</td>
			<td>${turno.estado}</td>
		</tr>`;
	}

	contenedor.innerHTML = `
		<ul>
			<li>Total de turnos: ${totalTurnos}</li>
			<li>Pendientes: ${pendientes}</li>
			<li>Confirmados: ${confirmados}</li>
		</ul>
		<table>
		<tr>
			<th>Paciente</th>
			<th>Especialidad</th>
			<th>Fecha</th>
			<th>Estado</th>
		</tr>
			${turnos.map(turnoAFilaDeEstadisticas).join("")}
		</table>
	`;
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

async function inicializarApp() {
	const usuario = obtenerUsuarioActual();
	const pagina = window.location.pathname.split("/").pop();

	const rolesPorPagina = {
		"solicitar-turno.html": "paciente",
		"mis-turnos.html": "paciente",
		"historial.html": "paciente",
		"resultados.html": "paciente",
		"confirmacion.html": "paciente",
		"statistics.html": "admin"
	};

	const rolRequerido = rolesPorPagina[pagina];

	if (rolRequerido) {
		if (!usuario) {
			window.location.href = resolverUrlRelativa("pages/login.html");
			return;
		}

		if (normalizarRol(usuario.rol) !== rolRequerido) {
			window.location.href = resolverUrlRelativa("index.html");
			return;
		}
	}

	renderizarNavBar(usuario);

	if (pagina === "index.html" || pagina === "") {
		await renderizarPageHome();
	}

	else if (pagina === "login.html") {
		renderizarPageLogin();
	}

	else if (pagina === "mis-turnos.html") {
		await renderizarPageMisTurnos(usuario);
	}

	else if (pagina === "resultados.html") {
		await renderizarPageResultados(usuario);
	}

	else if (pagina === "statistics.html") {
		await renderizarPageEstadisticas(usuario);
	}

	else if (pagina === "solicitar-turno.html") {
		await renderizarPageNuevoTurno();
	}
}

inicializarApp()