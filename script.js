// Referencia a la tabla y su cabecera
const tabla = document.getElementById('tabla-json');
const thead = tabla.querySelector('thead tr');
const tbody = tabla.querySelector('tbody');

// Referencia a los filtros
const nameFilterInput = document.getElementById('name-filter');
const affiliationFilterSelect = document.getElementById('affiliation-filter');

// Referencia a los controles de paginación
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const itemsPerPageSelect = document.getElementById('items-per-page');

let onePieceData = []; // Variable para almacenar los datos originales
let datosFiltrados = []; // Variable para almacenar los datos filtrados
let currentPage = 1;
let itemsPerPage = 10; // Por defecto, 10 elementos por página

// Función para limpiar valores nulos o indefinidos
function limpiarJSON(datos) {
    return datos.map(item => {
        const nuevoItem = {};
        for (const clave in item) {
            if (typeof item[clave] === 'object' && item[clave] !== null) {
                nuevoItem[clave] = Array.isArray(item[clave])
                    ? item[clave].map(valor => valor === undefined || valor === null ? "" : valor)
                    : limpiarJSON([item[clave]])[0];
            } else {
                nuevoItem[clave] = item[clave] === undefined || item[clave] === null ? "" : item[clave];
            }
        }
        return nuevoItem;
    });
}

// Función para llenar la tabla con los datos paginados
function llenarTabla(datos) {
    // Limpiar la tabla antes de volver a llenarla
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (datos.length === 0) {
        console.log('No data to display');
        actualizarInfoPaginacion();
        return;
    }

    // Crear las cabeceras dinámicamente
    const claves = Object.keys(datos[0]);
    claves.forEach(clave => {
        const th = document.createElement('th');
        th.textContent = clave;
        thead.appendChild(th);
    });

    // Calcular índices para paginación
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, datos.length);
    const paginatedData = datos.slice(startIndex, endIndex);

    // Llenar el cuerpo de la tabla con los datos paginados
    paginatedData.forEach(item => {
        const fila = document.createElement('tr');
        claves.forEach(clave => {
            const celda = document.createElement('td');
            let valor = item[clave];

            if (clave === 'devil_fruit') {
                if (Array.isArray(valor)) {
                    let devilFruitText = valor.map(df => `Name: ${df.name || ''}, Type: ${df.type || ''}, Abilities: ${df.abilities || ''}`).join('<br>');
                    celda.innerHTML = devilFruitText;
                } else if (valor) {
                    celda.textContent = `Name: ${valor.name || ''}, Type: ${valor.type || ''}, Abilities: ${valor.abilities || ''}`;
                } else {
                    celda.textContent = '';
                }
            }
            else if (clave === 'haki' && valor) {
                let hakiText = '';
                if (valor.observation) hakiText += 'Observation, ';
                if (valor.armament) hakiText += 'Armament, ';
                if (valor.conquerors) hakiText += 'Conquerors, ';
                celda.textContent = hakiText.slice(0, -2);
            }
            else {
                celda.textContent = valor === null ? '' : valor;
            }

            fila.appendChild(celda);
        });
        tbody.appendChild(fila);
    });

    // Actualizar información de paginación
    actualizarInfoPaginacion();
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion() {
    const totalItems = datosFiltrados.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${totalItems} personajes)`;
    
    // Desactivar/activar botones de paginación según corresponda
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Función para cambiar de página
function cambiarPagina(direccion) {
    const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);
    
    if (direccion === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direccion === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    
    llenarTabla(datosFiltrados);
}

// Función para filtrar los datos
function filtrarDatos() {
    const nameFilterValue = nameFilterInput.value.toLowerCase();
    const affiliationFilterValue = affiliationFilterSelect.value;

    datosFiltrados = onePieceData.filter(item => {
        const nombre = item.name.toLowerCase();
        const afiliacion = item.affiliation;

        const nameCondition = nombre.includes(nameFilterValue);
        const affiliationCondition = affiliationFilterValue === "" || afiliacion === affiliationFilterValue;

        return nameCondition && affiliationCondition;
    });

    // Reiniciar a la primera página cuando se aplica un filtro
    currentPage = 1;
    llenarTabla(datosFiltrados);
}

// Función para cambiar el número de items por página
function cambiarItemsPorPagina() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    currentPage = 1; // Volver a la primera página
    llenarTabla(datosFiltrados);
}

// Cargar el archivo JSON externo
fetch('data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al cargar el archivo JSON');
        }
        return response.json();
    })
    .then(data => {
        const datosLimpios = limpiarJSON(data);
        onePieceData = datosLimpios; // Guardar los datos originales
        datosFiltrados = datosLimpios; // Inicialmente los datos filtrados son iguales a los originales
        
        // Obtener todas las afiliaciones únicas y ordenarlas alfabéticamente
        const uniqueAffiliations = [...new Set(datosLimpios
            .map(item => item.affiliation)
            .filter(affiliation => affiliation !== null && affiliation !== ""))]
            .sort();
        
        // Limpiar el select de afiliaciones antes de llenarlo
        affiliationFilterSelect.innerHTML = '<option value="">Todas las afiliaciones</option>';
        
        // Llenar el select de afiliaciones
        uniqueAffiliations.forEach(affiliation => {
            const option = document.createElement('option');
            option.value = affiliation;
            option.textContent = affiliation;
            affiliationFilterSelect.appendChild(option);
        });

        // Llenar la tabla inicialmente
        llenarTabla(datosLimpios);

        // Agregar event listeners a los filtros
        nameFilterInput.addEventListener('input', filtrarDatos);
        affiliationFilterSelect.addEventListener('change', filtrarDatos);
        
        // Agregar event listeners a los controles de paginación
        prevPageBtn.addEventListener('click', () => cambiarPagina('prev'));
        nextPageBtn.addEventListener('click', () => cambiarPagina('next'));
        itemsPerPageSelect.addEventListener('change', cambiarItemsPorPagina);
    })
    .catch(error => console.error('Error al cargar o procesar el JSON:', error));
