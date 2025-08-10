document.addEventListener('DOMContentLoaded', () => { // Se que no debiamos usarlo, pero si lo saco, me saltea el login y me rompe el calendario por algun motivo. Probe agregandole defer a todos los scripts y no funciono.

    // LOGIN
    const userDNI = sessionStorage.getItem('userDNI')
    if (!userDNI) {
        window.location.href = 'login.html'
        return
    }

    // API
    const API_URL = 'https://68986d7bddf05523e55edf19.mockapi.io/clases'

    // DOM
    const listaTurnosContainer = document.getElementById('lista-turnos')
    const misReservasContainer = document.getElementById('mis-reservas')
    const turnosTitulo = document.getElementById('turnos-disponibles-titulo')
    const logoutBtn = document.getElementById('logout-btn')
    const calendarElement = document.getElementById('calendar')

    // VARIABLES GENERALES
    let misReservas = []
    let turnosDelDia = []
    let calendar

    // FUNCIONES
    const formatearFecha = (fecha) => {
        if (!fecha) return null
        const date = new Date(fecha)
        if (isNaN(date.getTime())) return null

        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        const monthFormateado = String(month).padStart(2, '0')
        const dayFormateado = String(day).padStart(2, '0')

        return `${year}-${monthFormateado}-${dayFormateado}`
    }

    const cargarTurnosDelDia = async (fecha) => {

        turnosDelDia = []

        const fechaFormato = formatearFecha(fecha)
        
        if (!fechaFormato) {
            turnosTitulo.textContent = `Turnos Disponibles`
            listaTurnosContainer.innerHTML = '<p>Selecciona una fecha del calendario para ver los turnos.</p>'
            return
        }

        // turnosTitulo.textContent = `Turnos Disponibles - ${fechaFormato}` // tuve que sacar esta linea porque hay un problema con las fechas, me queda 1 dia desfasado
        // creo que tiene que ver con algo de la zona horaria pero realmente no pude arreglarlo. Mas abajo en mis reservas voy a tener que sumarle 1 dia, y la base de datos en mockapi la voy a tener que dejar 1 dia atrasada por el defasaje.
        listaTurnosContainer.innerHTML = '<p>Buscando turnos...</p>'
        
        try {
            const [clasesRes, todasLasReservasRes] = await Promise.all([
                fetch(`${API_URL}/clases?fecha=${fechaFormato}`),
                fetch(`${API_URL}/reservas`)
            ])

            if (!clasesRes.ok || !todasLasReservasRes.ok) {
                throw new Error(`Error al contactar la API. Status: Clases ${clasesRes.status}, Reservas ${todasLasReservasRes.status}`)
            }

            turnosDelDia = await clasesRes.json()
            const todasLasReservas = await todasLasReservasRes.json()
            
            turnosDelDia.forEach(turno => {
                turno.reservados = todasLasReservas.filter(r => r.claseId === turno.id).length
            })

        } catch (error) {
            listaTurnosContainer.innerHTML = `<p>No se pudieron cargar los turnos.</p>`
        } finally {
            renderTurnos()
        }
    }

    const cargarMisReservas = async () => {
        try {
            const res = await fetch(`${API_URL}/reservas?dni=${userDNI}`)
            if (!res.ok) throw new Error("Error al cargar tus reservas.")
            misReservas = await res.json()
        } catch (error) {
            misReservasContainer.innerHTML = `<p>Error al cargar tus reservas.</p>`
        } finally {
            renderMisReservas()
            if (calendar && calendar.selectedDates[0]) {
                await cargarTurnosDelDia(calendar.selectedDates[0])
            }
        }
    }

    const renderTurnos = () => {
        listaTurnosContainer.innerHTML = ''
        if (turnosDelDia.length === 0) {
            if (turnosTitulo.textContent.includes('-')) {
                 listaTurnosContainer.innerHTML = '<p>No hay turnos disponibles para esta fecha.</p>'
            } else {
                 listaTurnosContainer.innerHTML = '<p>Selecciona una fecha del calendario para ver los turnos.</p>'
            }
            return
        }

        turnosDelDia.forEach(turno => {
            const yaReservadoPorMi = misReservas.some(reserva => reserva.claseId === turno.id)
            const cuposDisponibles = turno.cupo - (turno.reservados || 0)
            
            const div = document.createElement('div')
            div.className = 'turno-item'
            div.innerHTML = `
                <span>${turno.nombre} (Disponibles: ${cuposDisponibles})</span>
                <button class="reservar-btn" data-id="${turno.id}" ${yaReservadoPorMi || cuposDisponibles <= 0 ? 'disabled' : ''}>
                    ${yaReservadoPorMi ? 'Ya Reservado' : 'Reservar'}
                </button>
            `
            listaTurnosContainer.appendChild(div)
        })
    }


const renderMisReservas = () => {
        misReservasContainer.innerHTML = ''
        if (misReservas.length === 0) {
            misReservasContainer.innerHTML = '<p>No tenés ninguna reserva.</p>'
            return
        }

        const reservasOrdenadas = [...misReservas].sort((reservaA, reservaB) => new Date(reservaA.fecha) - new Date(reservaB.fecha))
        
        reservasOrdenadas.forEach(reserva => {
            const div = document.createElement('div')
            div.className = 'reserva-item'

            // Aca voy a convertir la fecha de la reserva a zona horaria UTC y le voy a sumar un día para que no me quede desfasada.
            // Esta solucion la busque porque al cargar los turnos del dia, me quedaba 1 dia atrasado, y creo que es por un problema de zona horaria.
            // No encontre otra manera de resolverlo.

            const fechaStringAPI = reserva.fecha
            
            const fechaUTC = new Date(fechaStringAPI + 'T00:00:00Z')
            
            fechaUTC.setUTCDate(fechaUTC.getUTCDate() + 1)

            const fechaMostrada = fechaUTC.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'UTC' 
            })
            
            div.innerHTML = `
                <span>${reserva.nombreClase} - ${fechaMostrada}</span>
                <button class="btn-cancelar" data-id="${reserva.id}">Cancelar</button>
            `
            misReservasContainer.appendChild(div)
        })
    }

    
    const reservarTurno = async (claseId) => {
        const turnoSeleccionado = turnosDelDia.find(t => t.id === claseId)

        const { value: formValues } = await Swal.fire({
            title: `Reserva para: ${turnoSeleccionado.nombre}`,
            text: 'Por favor, completa tus datos para confirmar la reserva.',
            html:
                '<input id="swal-input-nombre" class="swal2-input" placeholder="Nombre">' +
                '<input id="swal-input-apellido" class="swal2-input" placeholder="Apellido">' +
                '<input id="swal-input-celular" class="swal2-input" placeholder="Celular">' +
                '<input id="swal-input-mail" class="swal2-input" placeholder="Email">',
            focusConfirm: false,
            preConfirm: () => {
                const nombre = document.getElementById('swal-input-nombre').value
                const apellido = document.getElementById('swal-input-apellido').value
                if (!nombre || !apellido) {
                    Swal.showValidationMessage(`Nombre y Apellido son obligatorios`)
                }
                return {
                    nombreUsuario: nombre,
                    apellidoUsuario: apellido,
                    celularUsuario: document.getElementById('swal-input-celular').value,
                    mailUsuario: document.getElementById('swal-input-mail').value,
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Confirmar Reserva',
            cancelButtonText: 'Cancelar'
        })

        if (formValues) {
            const nuevaReserva = {
                claseId: turnoSeleccionado.id,
                dni: userDNI,
                fecha: turnoSeleccionado.fecha,
                nombreClase: turnoSeleccionado.nombre,
                ...formValues
            }

            try {
                const res = await fetch(`${API_URL}/reservas`, {
                    method: 'POST',
                    headers: {'content-type':'application/json'},
                    body: JSON.stringify(nuevaReserva)
                })
                if (!res.ok) {
                     const errorBody = await res.text()
                     throw new Error("La API rechazó la reserva.")
                }

                Swal.fire('¡Reservado!', 'Tu turno fue confirmado con éxito.', 'success')
                await cargarMisReservas()

            } catch(error) {
                Swal.fire('Error', 'No se pudo realizar la reserva.', 'error')
            }
        }
    }

    const cancelarReserva = async (reservaId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede revertir.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener'
        })

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/reservas/${reservaId}`, { method: 'DELETE' })
                if (!res.ok) throw new Error("La API no pudo cancelar la reserva.")
                
                Swal.fire('Cancelada', 'Tu reserva ha sido cancelada.', 'success')
                await cargarMisReservas()
            } catch(error) {
                Swal.fire('Error', 'No se pudo cancelar la reserva.', 'error')
            }
        }
    }

    // EVENTOS
    listaTurnosContainer.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('reservar-btn')) {
            const claseId = evento.target.dataset.id
            reservarTurno(claseId)
        }
    })

    misReservasContainer.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('btn-cancelar')) {
            const reservaId = evento.target.dataset.id
            cancelarReserva(reservaId)
        }
    })

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault()
        sessionStorage.removeItem('userDNI')
        window.location.href = 'login.html'
    })

    const init = () => {
        if (!calendarElement) {
            console.error("El elemento del calendario #calendar no se encontró en el DOM.")
            return
        }

        const calendarOptions = {
            type: 'default',
            settings: { 
                lang: 'es-ES', 
                visibility: { daysOutside: false }, 
                selection: { day: 'single' }
            },
            actions: { 
                clickDay(event, self) {
                    cargarTurnosDelDia(self.selectedDates[0])
                }
            }
        }
        calendar = new VanillaCalendar(calendarElement, calendarOptions)
        calendar.init()
        
        cargarMisReservas()
    }

    init()
})