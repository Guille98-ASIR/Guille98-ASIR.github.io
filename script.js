// Referencia a la tabla y su cabecera
const tabla = document.getElementById('tabla-json');
const thead = tabla.querySelector('thead tr');
const tbody = tabla.querySelector('tbody');

// Referencia a los filtros
const nameFilterInput = document.getElementById('name-filter');
const affiliationFilterSelect = document.getElementById('affiliation-filter');

let onePieceData = []; // Variable para almacenar los datos originales

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

// Función para llenar la tabla con los datos
function llenarTabla(datos) {
    // Limpiar la tabla antes de volver a llenarla
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (datos.length === 0) {
        console.log('No data to display');
        return;
    }

    // Crear las cabeceras dinámicamente
    const claves = Object.keys(datos[0]);
    claves.forEach(clave => {
        const th = document.createElement('th');
        th.textContent = clave;
        thead.appendChild(th);
    });

    // Llenar el cuerpo de la tabla
    datos.forEach(item => {
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
}

// Función para filtrar los datos
function filtrarDatos() {
    const nameFilterValue = nameFilterInput.value.toLowerCase();
    const affiliationFilterValue = affiliationFilterSelect.value;

    let datosFiltrados = onePieceData.filter(item => {
        const nombre = item.name.toLowerCase();
        const afiliacion = item.affiliation;

        const nameCondition = nombre.includes(nameFilterValue);
        const affiliationCondition = affiliationFilterValue === "" || afiliacion === affiliationFilterValue;

        return nameCondition && affiliationCondition;
    });

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
        llenarTabla(datosLimpios);

        // Obtener todas las afiliaciones únicas
        const uniqueAffiliations = [...new Set(datosLimpios.map(item => item.affiliation))];

        // Llenar el select de afiliaciones
        uniqueAffiliations.forEach(affiliation => {
            const option = document.createElement('option');
            option.value = affiliation;
            option.textContent = affiliation;
            affiliationFilterSelect.appendChild(option);
        });

        // Agregar event listeners a los filtros
        nameFilterInput.addEventListener('input', filtrarDatos);
        affiliationFilterSelect.addEventListener('change', filtrarDatos);
    })
    .catch(error => console.error('Error al cargar o procesar el JSON:', error));
