import express from "express"
const app = express();
const puerto = 3000;

app.get('/', (req, res) => {
	res.send('Hola, mundo desde Express!');
});

app.listen(puerto, () => { console.log(`Servidor en http://localhost:${puerto}`); });