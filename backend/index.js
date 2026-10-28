const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;;

// Middleware para interpretar JSON en el body
app.use(express.json());

// Base de datos en memoria
const productos = [
	{ id: 1, nombre: 'Café con leche', precio: 1800, categoria: 'bebida' },
	{ id: 2, nombre: 'Medialuna', precio: 900, categoria: 'comida' },
	{ id: 3, nombre: 'Tostado de jamón y queso', precio: 3500, categoria: 'comida' },
	{ id: 4, nombre: 'Agua mineral', precio: 1200, categoria: 'bebida' }
];

// GET / - Bienvenida
app.get('/', (req, res) => {
	res.send('API de la Cafetería del CRUI funcionando');
});

// GET /api/productos - Listar productos
// GET /api/productos?categoria=bebida
// La consulta sin filtro devuelve todos los productos.
app.get('/api/productos', (req, res) => {
	const categoria = req.query.categoria;
	if (!categoria) {
		return res.json(productos);
	} else {
		res.json(productos.filter(p => p.categoria === categoria));
	}
});

// GET /api/productos/:id - Buscar por ID
app.get('/api/productos/:id', (req, res) => {
	const id = Number(req.params.id);
	const producto = productos.find(p => p.id === id);

	if (!producto) {
		return res.status(404).json({
			error: 'Producto no encontrado'
		});
	}

	res.json(producto);
});

// POST /api/productos - Agregar producto
app.post('/api/productos', (req, res) => {
	const { nombre, precio, categoria } = req.body;

	// Validaciones
	if (typeof nombre !== 'string' || nombre.trim() === '') {
		return res.status(400).json({
			error: 'El nombre es obligatorio'
		});
	}

	if (typeof precio !== 'number' || precio <= 0 || !Number.isFinite(precio)) {
		return res.status(400).json({
			error: 'El precio debe ser un número mayor a 0'
		});
	}

	// Crear producto
	const ultimoProducto = productos[productos.length - 1];
	const nuevoProducto = {
		id: ultimoProducto ? ultimoProducto.id + 1 : 1,
		nombre: nombre.trim(),
		precio,
		categoria
	};

	productos.push(nuevoProducto);

	res.status(201).json(nuevoProducto);
});

// Bonus 2: DELETE /api/productos/:id
app.delete('/api/productos/:id', (req, res) => {
	const id = Number(req.params.id);
	const indice = productos.findIndex(p => p.id === id);

	if (indice === -1) {
		return res.status(404).json({
			error: 'Producto no encontrado'
		});
	}

	const eliminado = productos.splice(indice, 1)[0];
	res.json(eliminado);
});

// Bonus 3: GET /api/resumen
app.get('/api/resumen', (req, res) => {
	const cantidad = productos.length;
	const suma = productos.reduce((total, p) => total + p.precio, 0);
	const precioPromedio = cantidad > 0 ? suma / cantidad : 0;

	res.json({ cantidad, precioPromedio });
});

// Iniciar servidor
app.listen(PORT, () => {
	console.log(`Servidor escuchando en http://localhost:${PORT}`);
});



app.put('/api/productos/:id', (req, res) => {
	const id = Number(req.params.id);
	const { nombre, precio, categoria } = req.body;

	const producto = productos.find(p => p.id === id);

	if (!producto) {
		return res.status(404).json({
			error: 'Producto no encontrado'
		});
	}

	if (
		!nombre ||
		typeof precio !== 'number' ||
		precio <= 0 ||
		!categoria
	) {
		return res.status(400).json({
			error: 'Datos inválidos. Se requiere nombre, precio mayor a cero y categoría.'
		});
	}

	producto.nombre = nombre;
	producto.precio = precio;
	producto.categoria = categoria;

	res.status(200).json(producto);
});