const STORAGE_KEY = "portalPacienteData";
const SESSION_KEY = "portalPacienteUsuario";

// ============================================================
// DATOS
// ============================================================

async function obtenerDatos() {
	const datosGuardados = localStorage.getItem(STORAGE_KEY);

	if (datosGuardados) {
		return JSON.parse(datosGuardados);
	}

	const ruta = window.location.pathname.includes("/pages/")
		? "../data/datos.json"
		: "data/datos.json";

	const respuesta = await fetch(ruta);
		const datos = await respuesta.json();

		guardarDatos(datos);

		return datos;
}


function guardarDatos(datos) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
}


// ============================================================
// SESIÓN
// ============================================================

function obtenerUsuarioActual() {
	const usuario = localStorage.getItem(SESSION_KEY);

	return usuario ? JSON.parse(usuario) : null;
}

function guardarUsuarioActual(usuario) {
	localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

function desconectar() {
	localStorage.removeItem(SESSION_KEY);
}

function normalizarRol(rol) {
	return rol === "medico" ? "admin" : rol;
}


// ============================================================
// LOGIN
// ============================================================

async function buscarUsuario(email, password) {

	const datos = await obtenerDatos();

	return datos.usuarios.find(usuario =>
		usuario.email.toLowerCase() === email.toLowerCase() &&
		usuario.password === password
	);
}

function cerrarSesion() {
	//esta funciona se llama directamente desde HTML.
	localStorage.removeItem(SESSION_KEY);
	window.location.href = resolverUrl("index.html");
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

	const destino = normalizarRol(usuario.rol) === "admin"
		? "pages/statistics.html"
		: "index.html";
	window.location.href = resolverUrl(destino);
}


function asignarLoginAlFormulario() {
	const formulario = document.querySelector("#form-login");
	if (formulario) {
		formulario.addEventListener("submit", iniciarSesion);
	}
}


// ============================================================
// INTERFAZ
// ============================================================

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


// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

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


// ============================================================
// TURNOS
// ============================================================

async function poblarSelectoresTurno() {
	const datos = await obtenerDatos();
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

async function renderizarTurnosPaciente() {

	const contenedor = document.querySelector("#turnos-container");

	if (!contenedor) return;

	const usuario = obtenerUsuarioActual();
	if (!usuario || usuario.rol !== "paciente") {
		window.location.href = "../pages/login.html";
		return;
	}

	const datos = await obtenerDatos();

	const turnos = datos.turnos
		.filter(turno => turno.pacienteId === usuario.id)
		.sort((a, b) => a.fecha.localeCompare(b.fecha));

	// en clase habíamos puesto .reverse() solamente para que los ultimos turnos aparezcan arriba, pero es mas correcto ordenarlos segun la fecha con sort() y pasando como funcion el criterio de ordenamiento


	if (!turnos.length) {
		contenedor.innerHTML = '<tr><td colspan="6">Todavía no tenés turnos registrados.</td></tr>';
		return;
	}

	contenedor.innerHTML = turnos.map(turno => {
		const medico = datos.medicos.find(
			medico => medico.id === turno.medicoId
		);

		return `<tr>
				<td>${turno.fecha}</td>
				<td>${turno.hora}</td>
				<td>${turno.especialidad}</td>
			<td>${medico ? medico.nombre : "Sin médico"}</td>
				<td>${turno.estado}</td>
			<td>
				<button class="danger" type="button">Cancelar</button>
			</td>
			<td>
				<button type="button">Reprogramar</button>
			</td>
		</tr>`;
	}).join("");
}


// ============================================================
// ADMIN.ESTADÍSTICAS
// ============================================================


async function renderizarEstadisticasMedico() {
	const contenedor = document.querySelector("#estadisticas");
	if (!contenedor) return;

	const usuario = obtenerUsuarioActual();
	if (!usuario || !["admin", "medico"].includes(usuario.rol)) {
		window.location.href = resolverUrl("index.html");
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
		<tr>
			<th>Paciente</th>
			<th>Especialidad</th>
			<th>Fecha</th>
			<th>Estado</th>
		</tr>

			${datos.turnos.map(turno => {
		const paciente = datos.usuarios.find(
			usuario => usuario.id === turno.pacienteId
		);

		return `<tr>
			<td>${paciente ? paciente.nombre : "Paciente"}</td>
			<td>${turno.especialidad}</td>
			<td>${turno.fecha}</td>
			<td>${turno.estado}</td>
		</tr>`;
	}).join("")}
		</table>
	`;
}


// ============================================================
// CONTROL DE ACCESO
// ============================================================


function resolverUrl(path) {
	const dentroDePages = window.location.pathname.includes("/pages/");
	return dentroDePages ? `../${path}` : path;
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
			window.location.href = resolverUrl("pages/login.html");
		}

		return;
	}

	const rol = normalizarRol(usuario.rol);

	if (paginasPaciente.includes(pagina) && rol !== "paciente") {
		window.location.href = resolverUrl("index.html");
		return;
	}

	if (paginasAdmin.includes(pagina) && rol !== "admin") {
		window.location.href = resolverUrl("index.html");
	}
}


// ============================================================
// INICIALIZACIÓN
// ============================================================

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

inicializarApp()
