const STORAGE_KEY = "portalPacienteData";
const SESSION_KEY = "portalPacienteUsuario";

function resolveUrl(path) {
	const isInsidePages = window.location.pathname.includes("/pages/");
	return isInsidePages ? `../${path}` : path;
}

function getDataUrl() {
	return window.location.pathname.includes("/pages/") ? "../data/datos.json" : "data/datos.json";
}

const DATA_FALLBACK = { usuarios: [], medicos: [], turnos: [], especialidades: [] };

async function obtenerDatos() {

	const datosGuardados = localStorage.getItem(STORAGE_KEY);

	if (datosGuardados) {
		try {
			return JSON.parse(datosGuardados);
		} catch (error) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	try {
		const respuesta = await fetch(getDataUrl());

		if (!respuesta.ok) {
			throw new Error("No se pudo cargar JSON");
		}

		const datos = await respuesta.json();

		guardarDatos(datos);

		return datos;

	} catch (error) {
		console.error("No se pudieron cargar los datos:", error);
		return DATA_FALLBACK;
	}
}

async function renderizarEspecialidadesHome() {

	const lista = document.querySelector("#lista-especialidades");
	if (!lista) return;

	const datos = await obtenerDatos();

	for (const especialidad of datos.especialidades) {

		const article = document.createElement("article");

		article.innerHTML = `
			<h3>${especialidad.nombre}</h3>
			<p>${especialidad.descripcion}</p>
		`;

		lista.append(article);
	}
}







async function renderizarTurnosPaciente() {

	const contenedor = document.querySelector("#turnos-container");
	if (!contenedor) return;

	const usuario = obtenerUsuarioActual();
	if (!usuario || usuario.rol !== "paciente") {
		window.location.href = "../pages/login.html";
		return;
	}

	const datos = await obtenerDatos();
	const turnos = datos.turnos.filter(turno => turno.pacienteId === usuario.id).reverse();

	if (!turnos.length) {
		contenedor.innerHTML = '<tr><td colspan="6">Todavía no tenés turnos registrados.</td></tr>';
		return;
	}

	contenedor.innerHTML = turnos.map(turno => {
		const medico = datos.medicos.find(item => item.id === turno.medicoId);

		return `
			<tr>
				<td>${turno.fecha}</td>
				<td>${turno.hora}</td>
				<td>${turno.especialidad}</td>
				<td>${medico ? medico.nombre : "Sin medico"}</td>
				<td>${turno.estado}</td>
				<td><button class="danger" type="button">Cancelar</button></td>
				<td><button type="button">Reprogramar</button></td>
			</tr>
		`;
	}).join("");
}

async function renderizarEstadisticasMedico() {
	const contenedor = document.querySelector("#estadisticas");
	if (!contenedor) return;

	const usuario = obtenerUsuarioActual();
	if (!usuario || !["admin", "medico"].includes(usuario.rol)) {
		window.location.href = resolveUrl("index.html");
		return;
	}

	const datos = await obtenerDatos();
	const totalTurnos = datos.turnos.length;
	const pendientes = datos.turnos.filter(turno => turno.estado === "Pendiente").length;
	const confirmados = datos.turnos.filter(turno => turno.estado === "Confirmado").length;

	contenedor.innerHTML = `
		<ul>
			<li>Total de turnos: ${totalTurnos}</li>
			<li>Pendientes: ${pendientes}</li>
			<li>Confirmados: ${confirmados}</li>
		</ul>
		<table>
			<tr><th>Paciente</th><th>Especialidad</th><th>Fecha</th><th>Estado</th></tr>
			${datos.turnos.map(turno => {
		const paciente = datos.usuarios.find(usuarioActual => usuarioActual.id === turno.pacienteId);
		return `<tr><td>${paciente ? paciente.nombre : "Paciente"}</td><td>${turno.especialidad}</td><td>${turno.fecha}</td><td>${turno.estado}</td></tr>`;
	}).join("")}
		</table>
	`;
}
































function normalizarRol(rol) {
	return rol === "medico" ? "admin" : rol;
}


function guardarDatos(datos) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
}

function obtenerUsuarioActual() {
	const usuarioGuardado = localStorage.getItem(SESSION_KEY);
	if (!usuarioGuardado) {
		return null;
	}

	try {
		return JSON.parse(usuarioGuardado);
	} catch (error) {
		localStorage.removeItem(SESSION_KEY);
		return null;
	}
}

function desconectar() {
	localStorage.removeItem(SESSION_KEY);
}

function guardarUsuarioActual(usuario) {
	localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

async function buscarUsuario(email, password) {

	const data = await obtenerDatos();

	return data.usuarios.find(usuario =>
		usuario.email.toLowerCase() === email.toLowerCase() &&
		usuario.password === password
	);
}

function cerrarSesion() {
	localStorage.removeItem(SESSION_KEY);
	window.location.href = resolveUrl("index.html");
}

async function iniciarSesion(event) {
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
	const destino = normalizarRol(usuario.rol) === "admin" ? "pages/statistics.html" : "index.html";
	window.location.href = resolveUrl(destino);
}


function asignarLoginAlFormulario() {
	const formulario = document.querySelector("#form-login");
	if (formulario) {
		formulario.addEventListener("submit", iniciarSesion);
	}
}

async function poblarSelectoresTurno() {
	const datos = await obtenerDatos();
	const selectMedico = document.querySelector("#medico");
	if (selectMedico) {
		selectMedico.innerHTML = datos.medicos.map(medico => {
			return `<option value="${medico.id}">${medico.nombre} - ${medico.especialidad}</option>`;
		}).join("");
	}
}
async function registrarNuevoTurno(event) {
	event.preventDefault();
	const usuario = obtenerUsuarioActual();
	if (!usuario || usuario.rol !== "paciente") {
		window.location.href = "../pages/login.html";
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

	const datos = await obtenerDatos();
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
	guardarDatos(datos);
	window.location.href = "confirmacion.html";
}





function protegerPaginaPorRol() {

	const usuario = obtenerUsuarioActual();
	const pagina = window.location.pathname.split("/").pop();

	const paginasPaciente = [
		"solicitar-turno.html",
		"mis-turnos.html",
		"historial.html",
		"resultados.html",
		"confirmacion.html"
	];

	const paginasAdmin = [
		"statistics.html"
	];

	if (!usuario) {

		if (
			paginasPaciente.includes(pagina) ||
			paginasAdmin.includes(pagina)
		) {
			window.location.href = resolveUrl("pages/login.html");
		}

		return;
	}

	const rol = normalizarRol(usuario.rol);

	if (paginasPaciente.includes(pagina) && rol !== "paciente") {
		window.location.href = resolveUrl("index.html");
		return;
	}

	if (paginasAdmin.includes(pagina) && rol !== "admin") {
		window.location.href = resolveUrl("index.html");
	}
}
function actualizarInterfaz(usuario) {

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


async function inicializarApp() {

	const pagina = window.location.pathname.split("/").pop();
	const usuario = obtenerUsuarioActual();

	actualizarInterfaz(usuario);

	if (pagina === "index.html" || pagina === "") {
		await renderizarEspecialidadesHome();
	}

	else if (pagina === "login.html") {
		asignarLoginAlFormulario();
	}

	else if (pagina === "mis-turnos.html") {
		await renderizarTurnosPaciente();
	}

	else if (pagina === "statistics.html") {
		await renderizarEstadisticasMedico();
	}

	else if (pagina === "solicitar-turno.html") {

		await poblarSelectoresTurno();

		document.querySelector("#form-turno").addEventListener("submit", registrarNuevoTurno);
	}
}

protegerPaginaPorRol();

window.addEventListener("DOMContentLoaded", inicializarApp);