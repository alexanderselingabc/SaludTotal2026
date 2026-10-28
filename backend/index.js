
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// MIDDLEWARES
// --------------------------------------------------

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// DATOS
// --------------------------------------------------

const rutaDatos = path.join(__dirname, "data", "datos.json");

const datos = JSON.parse(
	fs.readFileSync(rutaDatos, "utf8")
);

// --------------------------------------------------
// UTILIDADES
// --------------------------------------------------

const colecciones_disponibles = Object.keys(datos);


function buscarColeccion(nombre) {
	if (!colecciones_disponibles.includes(nombre)) {
		return null;
	}

	return datos[nombre];
}

function siguienteId(coleccion) {
	return coleccion.length
		? Math.max(...coleccion.map(item => item.id)) + 1
		: 1;
}

// Nunca devolvemos las contraseñas al consultar usuarios.
function respuestaPublica(coleccion, recurso) {
	if (coleccion === "usuarios") {
		const { password, ...usuarioPublico } = recurso;
		return usuarioPublico;
	}

	return recurso;
}

function esObjetoValido(valor) {
	return valor !== null &&
		typeof valor === "object" &&
		!Array.isArray(valor);
}

// --------------------------------------------------
// RUTA DE PRUEBA
// --------------------------------------------------

app.get("/", (req, res) => {
	res.json({
		mensaje: "API de SaludTotal funcionando",
		colecciones: colecciones_disponibles
	});
});

// --------------------------------------------------
// LOGIN DE DEMOSTRACIÓN
// --------------------------------------------------

app.post("/api/login", (req, res) => {
	const { email, password } = req.body;

	if (
		typeof email !== "string" ||
		typeof password !== "string" ||
		!email.trim() ||
		!password
	) {
		return res.status(400).json({
			error: "Email y contraseña son obligatorios"
		});
	}

	const usuario = datos.usuarios.find(item =>
		item.email.toLowerCase() === email.trim().toLowerCase() &&
		item.password === password
	);

	if (!usuario) {
		return res.status(401).json({
			error: "Usuario o contraseña incorrectos"
		});
	}

	res.json(respuestaPublica("usuarios", usuario));
});

// --------------------------------------------------
// GET: LISTAR RECURSOS
// GET /api/turnos
// --------------------------------------------------

app.get("/api/:coleccion", (req, res) => {
	const coleccion = buscarColeccion(req.params.coleccion);

	if (!coleccion) {
		return res.status(404).json({
			error: "Colección no encontrada"
		});
	}

	res.json(
		coleccion.map(item =>
			respuestaPublica(req.params.coleccion, item)
		)
	);
});

// --------------------------------------------------
// GET: OBTENER UN RECURSO
// GET /api/turnos/1
// --------------------------------------------------

app.get("/api/:coleccion/:id", (req, res) => {
	const nombre = req.params.coleccion;
	const coleccion = buscarColeccion(nombre);

	if (!coleccion) {
		return res.status(404).json({
			error: "Colección no encontrada"
		});
	}

	const id = Number(req.params.id);

	if (!Number.isInteger(id) || id < 1) {
		return res.status(400).json({
			error: "El ID debe ser un entero positivo"
		});
	}

	const recurso = coleccion.find(item => item.id === id);

	if (!recurso) {
		return res.status(404).json({
			error: "Recurso no encontrado"
		});
	}

	res.json(respuestaPublica(nombre, recurso));
});

// --------------------------------------------------
// POST: CREAR UN RECURSO
// POST /api/turnos
// --------------------------------------------------

app.post("/api/:coleccion", (req, res) => {
	const nombre = req.params.coleccion;
	const coleccion = buscarColeccion(nombre);

	if (!coleccion) {
		return res.status(404).json({
			error: "Colección no encontrada"
		});
	}

	if (!esObjetoValido(req.body)) {
		return res.status(400).json({
			error: "El cuerpo debe ser un objeto JSON"
		});
	}

	if (req.body.id !== undefined) {
		return res.status(400).json({
			error: "El ID lo genera el servidor"
		});
	}

	if (nombre === "usuarios" &&
		(typeof req.body.password !== "string" ||
			!req.body.password)) {
		return res.status(400).json({
			error: "La contraseña es obligatoria"
		});
	}

	const nuevoRecurso = {
		...req.body,
		id: siguienteId(coleccion)
	};

	coleccion.push(nuevoRecurso);

	res.status(201).json(
		respuestaPublica(nombre, nuevoRecurso)
	);
});

// --------------------------------------------------
// PUT: REEMPLAZAR UN RECURSO
// PUT /api/turnos/1
// --------------------------------------------------

app.put("/api/:coleccion/:id", (req, res) => {
	const nombre = req.params.coleccion;
	const coleccion = buscarColeccion(nombre);

	if (!coleccion) {
		return res.status(404).json({
			error: "Colección no encontrada"
		});
	}

	const id = Number(req.params.id);

	if (!Number.isInteger(id) || id < 1) {
		return res.status(400).json({
			error: "El ID debe ser un entero positivo"
		});
	}

	if (!esObjetoValido(req.body)) {
		return res.status(400).json({
			error: "El cuerpo debe ser un objeto JSON"
		});
	}

	if (req.body.id !== undefined &&
		req.body.id !== id) {
		return res.status(400).json({
			error: "El ID del cuerpo no coincide con la URL"
		});
	}

	const indice = coleccion.findIndex(item => item.id === id);

	if (indice === -1) {
		return res.status(404).json({
			error: "Recurso no encontrado"
		});
	}

	if (nombre === "usuarios") {
		const password = req.body.password ??
			coleccion[indice].password;

		if (typeof password !== "string" || !password) {
			return res.status(400).json({
				error: "La contraseña no puede estar vacía"
			});
		}

		req.body.password = password;
	}

	const recursoActualizado = {
		...req.body,
		id
	};

	coleccion[indice] = recursoActualizado;

	res.json(respuestaPublica(nombre, recursoActualizado));
});

// --------------------------------------------------
// DELETE: ELIMINAR UN RECURSO
// DELETE /api/turnos/1
// --------------------------------------------------

app.delete("/api/:coleccion/:id", (req, res) => {
	const coleccion = buscarColeccion(req.params.coleccion);

	if (!coleccion) {
		return res.status(404).json({
			error: "Colección no encontrada"
		});
	}

	const id = Number(req.params.id);

	if (!Number.isInteger(id) || id < 1) {
		return res.status(400).json({
			error: "El ID debe ser un entero positivo"
		});
	}

	const indice = coleccion.findIndex(item => item.id === id);

	if (indice === -1) {
		return res.status(404).json({
			error: "Recurso no encontrado"
		});
	}

	coleccion.splice(indice, 1);

	res.status(204).end();
});

// --------------------------------------------------
// INICIAR SERVIDOR
// --------------------------------------------------

app.listen(PORT, () => {
	console.log(`API escuchando en el puerto ${PORT}`);
});
