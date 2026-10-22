#  Turno de Noche: FNAF Videojuego 2D

Videojuego 2D de navegador desarrollado con HTML5 Canvas, CSS y JavaScript.

> Trabajo realizado en **binas**.

---

##  Integrantes

| Nombre completo | No. de control |
|---|---|
| Pablo Ernesto Butanda López | 23200987 |
| Mario Alberto Silva López | 23200900 |

**Materia:** _Graficación_
**Docente:** _Luis Alejandro Santana Valadez_
**Institución:** _Instituto Tecnológico de Pachuca_
**Fecha:** 21 de octubre de 2026

---

##  Contexto

Los videojuegos web permiten practicar de forma integrada el diseño de interfaces, la programación orientada a eventos y la animación en tiempo real, sin instalar software adicional. Este proyecto surge como actividad académica para aplicar esos conocimientos en un producto interactivo completo.

La ambientación es la de un **turno de noche en la oficina de seguridad del videojuego de FNAF (Five Nights at Freddy's)**, vista a través de un monitor de cámaras de seguridad. El jugador es el vigilante y debe desactivar a los animatrónicos que despiertan por el local. Para lograr la atmósfera se usaron efectos visuales propios del género de terror: estática, líneas de escaneo, indicador de grabación (REC), reloj nocturno y fallos de luz.

---

##  Objetivo

### Objetivo general
Desarrollar un videojuego 2D funcional, interactivo y visualmente atractivo que se ejecute en el navegador, aplicando HTML5 Canvas, CSS y JavaScript.

### Objetivos específicos
- Mantener siempre **25 objetos** en pantalla, con movimiento propio.
- Implementar **cuatro tipos de movimiento**: hacia arriba, hacia abajo, diagonal y circular.
- Hacer que los objetos **aparezcan y desaparezcan al azar**, con velocidades distintas.
- Programar **colisiones con rebote** y animación de choque.
- Registrar los clics sobre los objetos en un **contador de puntos**.
- Integrar **música de fondo y efectos de sonido** con control de volumen.
- Diseñar una interfaz **responsiva** con encabezado, área de juego, panel lateral y créditos.

---

##  Justificación

- **Aplicación práctica:** une HTML (estructura), CSS (presentación) y JavaScript (lógica) en un solo proyecto.
- **Accesibilidad:** al ejecutarse en el navegador, no requiere instalación y funciona en cualquier equipo moderno.
- **Desarrollo de lógica:** exige resolver problemas reales de programación, como el ciclo de animación, la detección de colisiones, el manejo de eventos y la gestión de audio.
- **Trabajo colaborativo:** el desarrollo en binas permitió dividir tareas, revisar el código del compañero y practicar la comunicación en equipo.
- **Creatividad:** la temática y la ambientación dieron libertad para diseñar una experiencia propia y atractiva.

---

##  Operación del videojuego

### Cómo ejecutarlo
1. Descarga o clona el proyecto y conserva la estructura de carpetas.
2. Abre `index.html` en el navegador (se recomienda Google Chrome).
   - Opcional: usa la extensión **Live Server** de Visual Studio Code y presiona *Go Live*.
3. Presiona **"Iniciar turno"**. Este paso es necesario para que el navegador permita reproducir audio.

### Cómo se juega
| Acción | Resultado |
|---|---|
| **Clic** sobre un animatrónico | Se desactiva, suma **1 punto** y reaparece en otra zona |
| **Clic** en una zona vacía | Se muestra un anillo rojo sin sumar puntos |
| **Choque** entre animatrónicos | Rebotan con chispas, texto de impacto y sonido |
| **Botón "Silenciar"** | Activa o desactiva el sonido |
| **Control de volumen** | Ajusta el volumen de la música de fondo |

### Reglas
- Siempre hay **6 animatrónicos** (con múltiples clones) activos en el local.
- Cada uno tiene tamaño, velocidad y trayectoria distintos.
- Si un animatrónico sale de la pantalla, reaparece por otro borde.
- Cada cierto tiempo se desvanece y vuelve a aparecer en otro lugar.

### Elementos de la interfaz
- **Encabezado:** imagen y título del juego.
- **Área de juego:** canvas de 960×600 px con efectos de cámara de seguridad.
- **Panel lateral:** contador de animatrónicos desactivados, manual del vigilante y controles de audio.
- **Pie de página:** créditos de los integrantes.

### Sonidos
1. **Música de fondo:** en bucle desde que inicia el turno.
2. **Efecto de clic:** al desactivar un animatrónico.
3. **Efecto de choque:** cuando dos animatrónicos chocan.

---

## 🛠️ Tecnologías utilizadas

- **HTML5**, con el elemento `<canvas>` para el juego.
- **CSS3**, para estilos, animaciones y cursor personalizado.
- **JavaScript (ES6)**, para la lógica, las animaciones y el audio.
- **Bootstrap 5.3.3**, para la maqueta responsiva.
- **Google Fonts** (VT323 y Special Elite), para la tipografía.
- **Visual Studio Code** con Live Server, como entorno de desarrollo.

---

##  Estructura del proyecto

```
videojuego-2d/
├── index.html      # Estructura de la página
├── style.css       # Estilos
├── juego.js        # Lógica del videojuego
└── assets/         # Imágenes, cursor y sonidos
```

---

##  Conclusiones

El desarrollo de este videojuego nos permitió aplicar de forma práctica los conocimientos de HTML, CSS y JavaScript en un proyecto completo. Pasamos de la teoría a un producto funcional que cumple con todos los requisitos planteados: 25 objetos simultáneos, cuatro tipos de movimiento, colisiones, contador y audio.

Entre los principales aprendizajes destacan el uso del ciclo de animación con `requestAnimationFrame`, la detección de colisiones entre objetos y el manejo de eventos del mouse. También aprendimos que los navegadores restringen la reproducción automática de audio, por lo que se agregó una pantalla de inicio. Nos encontramos con retos como la organización de las rutas de los archivos y las limitaciones del tamaño de los cursores personalizados, que resolvimos probando y corrigiendo.

Trabajar en binas nos ayudó a repartir las tareas, revisar el código del otro y encontrar errores más rápido. Como mejoras futuras se podrían agregar niveles de dificultad, un límite de tiempo, un registro de la puntuación máxima y nuevos tipos de enemigos.

---
