document.addEventListener('DOMContentLoaded', () => {
    let juegosOriginales = [];
    let juegosFiltrados = [];
    let paginaActual = 1;
    let filasPorPagina = 10;
    let modoOscuro = localStorage.getItem('modoOscuro') === 'true';

    const elementos = {
        tabla: document.querySelector('#tabla-juegos tbody'),
        buscador: document.getElementById('buscador'),
        filasPagina: document.getElementById('filas-pagina'),
        paginacion: document.getElementById('paginacion'),
        prevBtn: document.getElementById('prev'),
        nextBtn: document.getElementById('next'),
        contador: document.getElementById('contador-pagina'),
        fichaJuego: document.getElementById('ficha-juego'),
        fichaGif: document.getElementById('ficha-gif'),
        preloader: document.getElementById('preloader'),
        modoToggle: document.getElementById('modo-toggle'),
        modoIcon: document.getElementById('modo-icon')
    };

    // Inicializar el modo oscuro según el valor guardado
    if (modoOscuro) {
        document.body.classList.add('modo-oscuro');
        elementos.modoIcon.textContent = '☀️';
    }

    // Evento para cambiar entre modo claro y oscuro
    elementos.modoToggle.addEventListener('click', () => {
        document.body.classList.toggle('modo-oscuro');
        modoOscuro = document.body.classList.contains('modo-oscuro');
        localStorage.setItem('modoOscuro', modoOscuro);
        
        // Cambiar el icono según el modo
        elementos.modoIcon.textContent = modoOscuro ? '☀️' : '🌙';
    });

    // Simular tiempo de carga para el preloader
    setTimeout(() => {
        cargarJuegos();
    }, 2500); // Mostrar el preloader por 2.5 segundos

    // Cargar datos iniciales
    function cargarJuegos() {
        fetch('juegos-n64.json')
            .then(response => response.json())
            .then(data => {
                juegosOriginales = data.juegos;
                juegosFiltrados = [...juegosOriginales];
                renderTabla();
                
                // Ocultar preloader con una transición suave
                setTimeout(() => {
                    elementos.preloader.style.opacity = '0';
                    setTimeout(() => {
                        elementos.preloader.style.display = 'none';
                    }, 500);
                }, 500);
            })
            .catch(error => {
                console.error('Error al cargar el JSON:', error);
                // Ocultar preloader incluso si hay error
                elementos.preloader.style.opacity = '0';
                setTimeout(() => {
                    elementos.preloader.style.display = 'none';
                }, 500);
            });
    }

    // Sistema de búsqueda
    elementos.buscador.addEventListener('input', () => {
        paginaActual = 1;
        filtrarJuegos();
        renderTabla();
        // Ocultar ficha de juego al buscar
        elementos.fichaJuego.style.display = 'none';
    });

    // Cambiar número de filas
    elementos.filasPagina.addEventListener('change', (e) => {
        filasPorPagina = parseInt(e.target.value);
        paginaActual = 1;
        renderTabla();
        // Ocultar ficha de juego al cambiar el número de filas
        elementos.fichaJuego.style.display = 'none';
    });

    // Paginación
    elementos.prevBtn.addEventListener('click', () => {
        if(paginaActual > 1) {
            paginaActual--;
            renderTabla();
            // Ocultar ficha de juego al cambiar de página
            elementos.fichaJuego.style.display = 'none';
        }
    });

    elementos.nextBtn.addEventListener('click', () => {
        if(paginaActual < totalPaginas()) {
            paginaActual++;
            renderTabla();
            // Ocultar ficha de juego al cambiar de página
            elementos.fichaJuego.style.display = 'none';
        }
    });

    // Funciones principales
    function filtrarJuegos() {
        const termino = elementos.buscador.value.toLowerCase();
        juegosFiltrados = juegosOriginales.filter(juego => {
            return Object.values(juego).some(valor => 
                String(valor).toLowerCase().includes(termino)
            );
        });
    }

    function renderTabla() {
        elementos.tabla.innerHTML = '';
        
        const inicio = (paginaActual - 1) * filasPorPagina;
        const fin = filasPorPagina === 0 ? juegosFiltrados.length : inicio + filasPorPagina;
        const paginados = juegosFiltrados.slice(inicio, fin);

        paginados.forEach(juego => {
            const fila = elementos.tabla.insertRow();
            fila.style.cursor = 'pointer';

            // Crear celdas para cada valor excepto ID
            const celdaTitulo = fila.insertCell();
            celdaTitulo.textContent = juego.titulo;
            
            const celdaAnio = fila.insertCell();
            celdaAnio.textContent = juego.anio;
            
            const celdaGenero = fila.insertCell();
            celdaGenero.textContent = juego.genero;
            
            const celdaDesarrollador = fila.insertCell();
            celdaDesarrollador.textContent = juego.desarrollador;

            // Añadir evento de clic a toda la fila
            fila.addEventListener('click', () => {
                mostrarFichaJuego(juego);
            });
        });

        actualizarPaginacion();
    }

    function actualizarPaginacion() {
        const totalPag = totalPaginas();
        elementos.contador.textContent = `Página ${paginaActual} de ${totalPag}`;

        elementos.prevBtn.disabled = paginaActual === 1;
        elementos.nextBtn.disabled = paginaActual === totalPag;

        elementos.paginacion.style.display = filasPorPagina === 0 ? 'none' : 'flex';
    }

    function totalPaginas() {
        return filasPorPagina === 0 ? 1 : Math.ceil(juegosFiltrados.length / filasPorPagina);
    }

   function mostrarFichaJuego(juego) {
    const fichaJuego = document.getElementById('ficha-juego');
    fichaJuego.style.display = 'block';
    fichaJuego.querySelector('h2').textContent = juego.titulo;
    document.getElementById('ficha-anio').textContent = juego.anio;
    document.getElementById('ficha-genero').textContent = juego.genero;
    document.getElementById('ficha-idioma').textContent = juego.idioma;
    document.getElementById('ficha-desarrollador').textContent = juego.desarrollador;
    
    // Cargar GIF según el juego seleccionado
    // Esto asume que tienes GIFs con nombres que corresponden a los IDs de los juegos
    document.getElementById('gif-juego').src = `/img/${juego.id}.gif`;
    
    // Hacer scroll suave hacia la ficha
    fichaJuego.scrollIntoView({ behavior: 'smooth' });
}
});
