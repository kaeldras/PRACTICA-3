document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const ruletaCanvas = document.getElementById("ruletaCanvas")
  const ruletaText = document.getElementById("ruletaText")
  const optionsTextarea = document.getElementById("optionsTextarea")
  const btnIniciar = document.getElementById("btnIniciar")
  const btnReiniciar = document.getElementById("btnReiniciar")
  const btnTitulo = document.getElementById("btnTitulo")
  const btnEditar = document.getElementById("btnEditar")
  const btnEsconder = document.getElementById("btnEsconder")
  const resultado = document.getElementById("resultado")

  // Variables globales
  let opciones = []
  let opcionesOcultas = []
  let opcionSeleccionada = null
  let estaGirando = false
  let anguloActual = 0
  let animacionId = null
  let modoEdicion = false
  let elementoEnPosicionFlecha = null // Para rastrear qué elemento está en la posición de la flecha

  // Colores básicos para los sectores de la ruleta (F2)
  const colores = [
    "#4285F4", // Azul
    "#EA4335", // Rojo
    "#34A853", // Verde
    "#FBBC05", // Amarillo
    "#9C27B0", // Morado
  ]

  // Inicializar la ruleta
  inicializarRuleta()

  // Event Listeners
  ruletaCanvas.addEventListener("click", girarRuleta) // F3: Click en ruleta
  ruletaText.parentElement.addEventListener("click", girarRuleta)
  btnIniciar.addEventListener("click", girarRuleta) // F3: Click en botón iniciar
  btnReiniciar.addEventListener("click", reiniciarRuleta) // F8: Click en botón reiniciar
  btnTitulo.addEventListener("click", mostrarTitulo)
  btnEditar.addEventListener("click", toggleEdicion)
  btnEsconder.addEventListener("click", ocultarElementoSeleccionado)
  optionsTextarea.addEventListener("click", () => {
    if (!modoEdicion) {
      toggleEdicion() // F7: Click en textarea habilita edición
    }
  })
  optionsTextarea.addEventListener("input", () => {
    if (modoEdicion) {
      actualizarOpciones() // F5: Cambios en textarea actualizan ruleta
    }
  })

  // Escuchar eventos de teclado
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !estaGirando) {
      event.preventDefault()
      girarRuleta() // F3: Tecla SPACE gira ruleta
    } else if (event.key.toLowerCase() === "s") {
      ocultarElementoSeleccionado() // F6: Tecla S oculta elemento seleccionado
    } else if (event.key.toLowerCase() === "r") {
      reiniciarRuleta() // F8: Tecla R reinicia
    } else if (event.key.toLowerCase() === "e") {
      toggleEdicion() // F7: Tecla E habilita edición
    } else if (event.key.toLowerCase() === "f") {
      togglePantallaCompleta() // F9: Tecla F activa pantalla completa
    }
  })

  // Funciones
  function inicializarRuleta() {
    // Obtener opciones del textarea (F3)
    actualizarOpciones()

    // Dibujar la ruleta
    dibujarRuleta()
  }

  function actualizarOpciones() {
    // F4: Permite copiar y pegar datos multifila
    opciones = optionsTextarea.value.split("\n").filter((item) => item.trim() !== "")

    // Filtrar opciones ocultas que ya no existen
    opcionesOcultas = opcionesOcultas.filter((opcion) => opciones.includes(opcion))

    // Si la opción seleccionada ya no existe, resetearla
    if (opcionSeleccionada && !opciones.includes(opcionSeleccionada)) {
      opcionSeleccionada = null
    }

    // F5: Actualizar ruleta con cambios del textarea
    dibujarRuleta()
  }

  function dibujarRuleta() {
    const ctx = ruletaCanvas.getContext("2d")
    const width = (ruletaCanvas.width = ruletaCanvas.offsetWidth)
    const height = (ruletaCanvas.height = ruletaCanvas.offsetHeight)
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 5

    // Limpiar el canvas
    ctx.clearRect(0, 0, width, height)

    // Obtener opciones visibles (excluyendo las ocultas)
    const opcionesVisibles = opciones.filter((opcion) => !opcionesOcultas.includes(opcion))

    if (opcionesVisibles.length === 0) {
      // Si no hay opciones visibles, dibujar un círculo gris
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = "#E0E0E0"
      ctx.fill()
      ctx.stroke()

      // Texto en el centro
      ctx.fillStyle = "#000"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No hay elementos", centerX, centerY)
      return
    }

    // Calcular ángulo por sector
    const anglePorSector = (2 * Math.PI) / opcionesVisibles.length

    // Dibujar cada sector
    opcionesVisibles.forEach((opcion, index) => {
      const startAngle = index * anglePorSector + anguloActual
      const endAngle = (index + 1) * anglePorSector + anguloActual

      // Dibujar sector
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // F2: Color del sector (rotando entre los 5 colores básicos)
      const colorIndex = index % colores.length
      ctx.fillStyle = colores[colorIndex]
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 1
      ctx.stroke()

      // Texto del sector
      ctx.save()
      ctx.translate(centerX, centerY)
      const textAngle = startAngle + anglePorSector / 2
      ctx.rotate(textAngle)
      ctx.translate(radius * 0.6, 0)
      ctx.rotate(Math.PI / 2)
      ctx.fillStyle = "#000"
      ctx.font = "bold 28px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(opcion, 0, 0)
      ctx.restore()
    })

    // Dibujar círculo central
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI)
    ctx.fillStyle = "#fff"
    ctx.fill()
    ctx.strokeStyle = "#ddd"
    ctx.lineWidth = 1
    ctx.stroke()

    // Determinar qué elemento está en la posición de la flecha (a la derecha, 0 grados)
    if (opcionesVisibles.length > 0) {
      // La flecha está a 0 grados (derecha), necesitamos encontrar qué sector está ahí
      // Convertir anguloActual a un valor entre 0 y 2π
      const anguloNormalizado = ((anguloActual % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

      // Calcular qué sector está en la posición de la flecha
      // La flecha está a 0 grados, así que necesitamos encontrar qué sector contiene ese ángulo
      let sectorEnFlecha = Math.floor((2 * Math.PI - anguloNormalizado) / anglePorSector) % opcionesVisibles.length

      // Ajustar si es necesario
      if (sectorEnFlecha < 0) {
        sectorEnFlecha += opcionesVisibles.length
      }

      // Guardar el elemento que está en la posición de la flecha
      elementoEnPosicionFlecha = opcionesVisibles[sectorEnFlecha]
    }
  }

  function girarRuleta() {
    if (estaGirando) return

    // Obtener opciones visibles
    const opcionesVisibles = opciones.filter((opcion) => !opcionesOcultas.includes(opcion))

    if (opcionesVisibles.length === 0) return

    estaGirando = true

    // Seleccionar un elemento aleatorio
    const indiceAleatorio = Math.floor(Math.random() * opcionesVisibles.length)
    const elementoSeleccionado = opcionesVisibles[indiceAleatorio]

    // Calcular el ángulo necesario para que el elemento seleccionado quede en la posición de la flecha
    const anglePorSector = (2 * Math.PI) / opcionesVisibles.length

    // Calcular cuánto necesitamos girar para que el elemento seleccionado quede en la posición de la flecha
    // La flecha está a 0 grados (derecha)
    const anguloDestino = 2 * Math.PI - (indiceAleatorio * anglePorSector + anglePorSector / 2)

    // Añadir varias vueltas completas para el efecto de giro
    const vueltas = 2 + Math.random() * 2 // Entre 2 y 4 vueltas completas
    const anguloTotal = anguloDestino + vueltas * 2 * Math.PI

    // Configurar la animación
    const duracionAnimacion = 3000 // 3 segundos
    const tiempoInicio = performance.now()
    const anguloInicial = anguloActual

    // Función de animación
    function animarGiro(tiempo) {
      const tiempoTranscurrido = tiempo - tiempoInicio
      const progreso = Math.min(tiempoTranscurrido / duracionAnimacion, 1)

      // Función de easing para desaceleración
      const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)
      const progresoSuavizado = easeOutQuad(progreso)

      // Calcular ángulo actual
      anguloActual = anguloInicial + progresoSuavizado * anguloTotal

      // Dibujar ruleta con nuevo ángulo
      dibujarRuleta()

      // Continuar animación o finalizar
      if (progreso < 1) {
        animacionId = requestAnimationFrame(animarGiro)
      } else {
        finalizarGiro()
      }
    }

    // Iniciar animación
    animacionId = requestAnimationFrame(animarGiro)
  }

  function finalizarGiro() {
    estaGirando = false

    // Usar el elemento que está en la posición de la flecha como el seleccionado
    opcionSeleccionada = elementoEnPosicionFlecha

    // Mostrar resultado en el banner superior
    resultado.textContent = opcionSeleccionada

    // Resaltar en el textarea
    resaltarOpcionSeleccionada()
  }

  function resaltarOpcionSeleccionada() {
    if (!opcionSeleccionada) return

    // F6: Resaltar en gris el último elemento sorteado
    // Obtener todas las líneas
    const lineas = optionsTextarea.value.split("\n")

    // Crear nuevo contenido con la opción seleccionada resaltada
    const nuevoContenido = lineas
      .map((linea) => {
        // Si es el elemento seleccionado, añadir un espacio al final para resaltarlo
        if (linea.trim() === opcionSeleccionada.trim()) {
          return `${linea} `
        }
        return linea
      })
      .join("\n")

    // Actualizar textarea
    optionsTextarea.value = nuevoContenido

    // Resaltar visualmente
    const indice = lineas.findIndex((linea) => linea.trim() === opcionSeleccionada.trim())
    if (indice >= 0) {
      const inicio = lineas.slice(0, indice).join("\n").length + (indice > 0 ? 1 : 0)
      const fin = inicio + opcionSeleccionada.length

      setTimeout(() => {
        optionsTextarea.focus()
        optionsTextarea.setSelectionRange(inicio, fin)

        // Aplicar estilo de fondo gris
        const seleccion = window.getSelection()
        if (seleccion.rangeCount > 0) {
          const rango = seleccion.getRangeAt(0)
          const span = document.createElement("span")
          span.style.backgroundColor = "#ccc"
          rango.surroundContents(span)
        }
      }, 100)
    }
  }

  function reiniciarRuleta() {
    // F8: Reiniciar ruleta y hacer visibles elementos ocultos
    // Detener animación si está girando
    if (animacionId) {
      cancelAnimationFrame(animacionId)
      estaGirando = false
    }

    // Resetear variables
    opcionesOcultas = []
    opcionSeleccionada = null
    anguloActual = 0
    elementoEnPosicionFlecha = null

    // Limpiar resultado
    resultado.textContent = ""

    // Redibujar ruleta
    dibujarRuleta()
  }

  function mostrarTitulo() {
    const titulo = prompt("Ingrese un título para la ruleta:", "Ruleta Dinámica")
    if (titulo) {
      document.title = titulo
    }
  }

  function toggleEdicion() {
    // F7: Habilitar edición
    modoEdicion = !modoEdicion

    if (modoEdicion) {
      optionsTextarea.focus()
      btnEditar.textContent = "Guardar"
    } else {
      actualizarOpciones()
      btnEditar.textContent = "Editar"
    }
  }

  function ocultarElementoSeleccionado() {
    // F6: Ocultar elemento seleccionado
    if (!opcionSeleccionada) return

    // Agregar a lista de opciones ocultas
    if (!opcionesOcultas.includes(opcionSeleccionada)) {
      opcionesOcultas.push(opcionSeleccionada)
    }

    // Redibujar ruleta
    dibujarRuleta()

    // Resetear selección
    opcionSeleccionada = null
    resultado.textContent = ""
  }

  function togglePantallaCompleta() {
    // F9: Pantalla completa
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al intentar pantalla completa: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }
})
