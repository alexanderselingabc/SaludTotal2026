# Portal del Paciente - Clínica SaludTotal

## Caso de estudio

**Portal del Paciente** para la **Clínica SaludTotal**.

Este proyecto corresponde al desarrollo de un prototipo web dínamica realizado como parte del Hito 3 de la asignatura Prácticas Profesionalizantes I.

---

## Equipo desarrollador

**Equipo:** Equipo 1

### Integrantes

- Nombre y Apellido
- Nombre y Apellido
- Nombre y Apellido
- Nombre y Apellido

---

## Descripción del sistema

El Portal del Paciente es una aplicación web destinada a mejorar la comunicación entre la Clínica SaludTotal y sus pacientes.

El sistema permitirá gestionar turnos médicos, consultar el historial clínico y acceder a los resultados de estudios y análisis de manera rápida y segura.

Prototipo 1: En esta primera versión se desarrolló un prototipo navegable utilizando únicamente HTML5 y CSS, simulando las principales funcionalidades del sistema.

Prototipo 2: Se eliminan datos hardcodeados de html. Se incorpora el uso de javascript y json para carga inicial. Se utiliza localStorage para comunicación entre pantallas.

---

## Tecnologías utilizadas

- HTML5
- CSS3
- Git
- GitHub
- JavaScript localStorage, libreria JSON
- createElement
- Arrays, objetos

---

## Organización del proyecto

```
portal-paciente/
│
├── index.html
├── README.md
│
├── css/
│   └── styles.css
│
├── js/
│   └── scripts.js
│
├── data/
│   └── datos.json
│
├── documentacion/
│   ├── Hito01 - Consignas.pdf
│   ├── Hito02 - Consignas.pdf
│   └── Hito03 - Consignas.pdf
│
├── img/
│
└── pages/
    ├── confirmacion.html
    ├── historial.html
    ├── login.html
    ├── mis-turnos.html
    ├── resultados.html
    ├── signup.html
    ├── solicitar-turno.html
    └── statistics.html
```

---

## Pantallas desarrolladas

### Inicio

Presenta la aplicación y permite acceder a todas las funcionalidades mediante un menú de navegación. Pensada para el usuario visitante.

### Solicitar Turno

Contiene un formulario HTML para simular la solicitud de un turno médico. Pensado para usuario con rol Paciente.

### Confirmación

Simula el resultado exitoso del envío del formulario indicando que el turno fue solicitado correctamente. Pensado para usuario con rol Paciente.

### Mis Turnos

Muestra un listado de turnos registrados junto con su estado. Pensado para usuario con rol Paciente.

### Historial Clínico

Presenta información simulada correspondiente al historial médico del paciente. Pensado para usuario con rol Paciente.

### Resultados de Análisis

Permite visualizar estudios disponibles y simula la descarga de resultados. Pensado para usuario con rol Paciente.

### Estadisticas

Permite visualizar algunos datos básicos como cantidad de pacientes registrados, pensados para la vista del usuario con rol Administrador.

### Login

Permite iniciar sesión como paciente u administrador, según rol definido en ``data/datos.json``.

### SignUp

Permite crear una nueva cuenta como paciente. Sólo lo almacena en la localStorage.

---

## Estado del proyecto

🚧 Prototipo dínamico navegable en desarrollo.

Esta versión representa únicamente una simulación de la interfaz del sistema y no implementa lógica de negocio ni conexión real a una base de datos.

---

## Licencia

Proyecto desarrollado con fines exclusivamente educativos para la asignatura **Prácticas Profesionalizantes I**.