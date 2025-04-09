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
        preloader: document.getElementById('preloader'),
        modoToggle: document.getElementById('modo-toggle'),
        gameTitle: document.querySelector('.game-title'),
        gifCaption: document.getElementById('gif-caption')
    };

    // Inicializar el modo oscuro si estaba activo
    if (modoOscuro) {
        document.body.classList.add('modo-oscuro');
        elementos.modoToggle.textContent = '☀️';
    }

    // Evento para cambiar entre modo claro y oscuro
    elementos.modoToggle.addEventListener('click', () => {
        document.body.classList.toggle('modo-oscuro');
        modoOscuro = document.body.classList.contains('modo-oscuro');
        localStorage.setItem('modoOscuro', modoOscuro);
        elementos.modoToggle.textContent = modoOscuro ? '☀️' : '🌙';
        
        // Actualizar ARIA label para mejorar accesibilidad
        elementos.modoToggle.setAttribute('aria-label', 
            modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    });

    // Simular tiempo de carga para el preloader
    setTimeout(() => {
        cargarJuegos();
    }, 2500); // Mostrar el preloader por 2.5 segundos

    // Cargar datos iniciales
    function cargarJuegos() {
        fetch('juegos-n64.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta de la red');
                }
                return response.json();
            })
            .then(data => {
                juegosOriginales = data.juegos;
                juegosFiltrados = [...juegosOriginales];
                renderTabla();
                
                // Actualizar contador de juegos en la sección de intro
                const totalJuegos = juegosOriginales.length;
                const introElement = document.querySelector('.intro p');
                if (introElement) {
                    const intro = introElement.textContent;
                    introElement.textContent = intro.replace('300 títulos', `${totalJuegos} títulos`);
                }
                
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
                // Mostrar mensaje de error amigable en la página
                const mensajeError = document.createElement('div');
                mensajeError.className = 'error-mensaje';
                mensajeError.innerHTML = `
                    <h2>¡Ups! Algo salió mal</h2>
                    <p>No pudimos cargar el catálogo de juegos. Por favor, intenta recargar la página.</p>
                `;
                document.querySelector('.contenedor-central').prepend(mensajeError);
                
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
        
        // Feedback para lectores de pantalla
        const resultados = juegosFiltrados.length;
        const mensajeResultados = `${resultados} juegos encontrados para tu búsqueda`;
        anunciarALectoresDePatalla(mensajeResultados);
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
            // Anunciar página actual para lectores de pantalla
            anunciarALectoresDePatalla(`Página ${paginaActual} de ${totalPaginas()}`);
        }
    });

    elementos.nextBtn.addEventListener('click', () => {
        if(paginaActual < totalPaginas()) {
            paginaActual++;
            renderTabla();
            // Ocultar ficha de juego al cambiar de página
            elementos.fichaJuego.style.display = 'none';
            // Anunciar página actual para lectores de pantalla
            anunciarALectoresDePatalla(`Página ${paginaActual} de ${totalPaginas()}`);
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

        if (paginados.length === 0) {
            // Mostrar mensaje cuando no hay resultados
            const filaVacia = elementos.tabla.insertRow();
            const celdaMensaje = filaVacia.insertCell();
            celdaMensaje.colSpan = 4;
            celdaMensaje.textContent = "No se encontraron juegos que coincidan con tu búsqueda";
            celdaMensaje.style.textAlign = "center";
            celdaMensaje.style.padding = "20px";
        } else {
            paginados.forEach(juego => {
                const fila = elementos.tabla.insertRow();
                fila.style.cursor = 'pointer';
                
                // Agregar información de accesibilidad
                fila.setAttribute('role', 'row');
                fila.setAttribute('aria-label', `${juego.titulo}, ${juego.anio}, ${juego.genero}, ${juego.desarrollador}`);

                // Crear celdas para cada valor excepto ID
                const celdaTitulo = fila.insertCell();
                celdaTitulo.textContent = juego.titulo;
                celdaTitulo.setAttribute('role', 'cell');
                
                const celdaAnio = fila.insertCell();
                celdaAnio.textContent = juego.anio;
                celdaAnio.setAttribute('role', 'cell');
                
                const celdaGenero = fila.insertCell();
                celdaGenero.textContent = juego.genero;
                celdaGenero.setAttribute('role', 'cell');
                
                const celdaDesarrollador = fila.insertCell();
                celdaDesarrollador.textContent = juego.desarrollador;
                celdaDesarrollador.setAttribute('role', 'cell');

                // Añadir evento de clic a toda la fila
                fila.addEventListener('click', () => {
                    mostrarFichaJuego(juego);
                });
                
                // Accesibilidad: permitir seleccionar con teclado
                fila.setAttribute('tabindex', '0');
                fila.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        mostrarFichaJuego(juego);
                    }
                });
            });
        }

        actualizarPaginacion();
    }

    function actualizarPaginacion() {
        const totalPag = totalPaginas();
        elementos.contador.textContent = `Página ${paginaActual} de ${totalPag}`;

        elementos.prevBtn.disabled = paginaActual === 1;
        elementos.nextBtn.disabled = paginaActual === totalPag || juegosFiltrados.length === 0;

        elementos.paginacion.style.display = filasPorPagina === 0 || juegosFiltrados.length === 0 ? 'none' : 'flex';
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
        document.getElementById('ficha-idioma').textContent = juego.idioma || 'No especificado';
        document.getElementById('ficha-desarrollador').textContent = juego.desarrollador;
        
        // Actualizar el título del juego en el caption de la imagen
        if (elementos.gameTitle) {
            elementos.gameTitle.textContent = juego.titulo;
        }
        
        // Cargar GIF según el juego seleccionado
        const gifJuego = document.getElementById('gif-juego');
        gifJuego.src = `img/${juego.id}.gif`;
        gifJuego.alt = `Gameplay de ${juego.titulo} para Nintendo 64`;
        
        // Mejorar accesibilidad - anunciar que se ha mostrado la ficha
        anunciarALectoresDePatalla(`Mostrando ficha de ${juego.titulo}`);
        
        // Hacer scroll suave hacia la ficha
        fichaJuego.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Función auxiliar para anunciar mensajes a lectores de pantalla
    function anunciarALectoresDePatalla(mensaje) {
        // Crear un elemento de anuncio ARIA-live
        let anunciador = document.getElementById('anunciador-sr');
        if (!anunciador) {
            anunciador = document.createElement('div');
            anunciador.id = 'anunciador-sr';
            anunciador.setAttribute('aria-live', 'polite');
            anunciador.classList.add('sr-only');
            document.body.appendChild(anunciador);
        }
        
        // Actualizar el mensaje
        anunciador.textContent = mensaje;
        
        // Limpiar después de un tiempo para evitar anuncios duplicados
        setTimeout(() => {
            anunciador.textContent = '';
        }, 3000);
    }
    
    // Configurar eventos para esquema JSON-LD dinámico
    function actualizarSchema() {
        // Verificar si existe el schema original
        const schemaScript = document.querySelector('script[type="application/ld+json"]');
        if (!schemaScript || !juegosOriginales.length) return;
        
        try {
            // Parsear el schema existente
            const schema = JSON.parse(schemaScript.textContent);
            
            // Actualizar los elementos de la lista con los primeros 5 juegos
            if (schema.mainEntity && schema.mainEntity['@type'] === 'ItemList') {
                const itemListElement = juegosOriginales.slice(0, 5).map((juego, index) => {
                    return {
                        '@type': 'ListItem',
                        'position': index + 1,
                        'name': juego.titulo,
                        'url': `https://tudominio.com/catalogo-n64/${juego.id}`
                    };
                });
                
                schema.mainEntity.itemListElement = itemListElement;
                
                // Actualizar el script con el schema modificado
                schemaScript.textContent = JSON.stringify(schema);
            }
        } catch (error) {
            console.error('Error al actualizar el schema JSON-LD:', error);
        }
    }
    
    // Registrar Service Worker si está disponible (para PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registrado correctamente', registration);
            }).catch(error => {
                console.log('Error al registrar el Service Worker:', error);
            });
        });
    }
});
