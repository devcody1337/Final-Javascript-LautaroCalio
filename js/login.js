document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form')
    const dniInput = document.getElementById('dni-input')

    // LOCALSTORAGE DEL LOGIN
    if (sessionStorage.getItem('userDNI')) {
        window.location.href = 'turnero.html'
        return
    }

    // EVENTOS LOGIN
    loginForm.addEventListener('submit', (evento) => {
        evento.preventDefault()
        const dni = dniInput.value

        if (dni === '' || isNaN(dni) || dni.length !== 8) {
            
            Swal.fire({
                icon: 'error',
                title: 'DNI Inválido',
                text: 'Por favor, ingresa un DNI válido de 8 números.',
            })

        } else {
            sessionStorage.setItem('userDNI', dni)
            window.location.href = 'turnero.html'
        }
    })

    dniInput.addEventListener('input', () => {
        if (dniInput.value.length > 8) {
            dniInput.value = dniInput.value.slice(0, 8)
        }
    })
})