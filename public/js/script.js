let myChartUsuarios;
let myChartResultados;
let myChartEstados;
let myChartRecetas;

document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Obtener datos de usuarios desde MySQL
        const responseUsers = await fetch("/api/users");
        const dataUsers = await responseUsers.json();

        let medicos = dataUsers.filter(user => user.id_Rol === 2).length;
        let pacientes = dataUsers.filter(user => user.id_Rol === 3).length;

        if (medicos > 0 || pacientes > 0) {
            createChartUsuarios(medicos, pacientes);
        }

      // Obtener datos de consultas desde MySQL
        const responseResultados = await fetch("/api/resultado");
        const dataResultados = await responseResultados.json();

        // Contar cuántos hay en cada categoría
        let aceptado = dataResultados.filter(consulta => consulta.idResultado === 1).length;
        let denegado = dataResultados.filter(consulta => consulta.idResultado === 2).length;
        let espera = dataResultados.filter(consulta => consulta.idResultado === null).length; // Si es NULL, es "En espera"

        if (aceptado > 0 || denegado > 0 || espera > 0) {
            createChartResultados(aceptado, denegado, espera);
        }


        // Obtener datos de estados de consultas desde MySQL
        const responseEstados = await fetch("/api/consultas");
        const dataEstados = await responseEstados.json();

        let estados = {
            "Selección de doctor": dataEstados.filter(c => c.idEstado === 1).length,
            "En espera de receta": dataEstados.filter(c => c.idEstado === 2).length,
            "Aceptación de receta": dataEstados.filter(c => c.idEstado === 3).length,
            "Receta recibida": dataEstados.filter(c => c.idEstado === 4).length,
            "Finalizada": dataEstados.filter(c => c.idEstado === 5).length
        };

        if (Object.values(estados).some(count => count > 0)) {
            createChartEstados(estados);
        }

        // Gráfica de Recetas por Mes
        const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        const response = await fetch("/api/recetasPorMes");
        const data = await response.json();

        console.log("Datos de la API recetasPorMes:", data);

        let cantidades = new Array(12).fill(0);

        data.forEach(item => {
            let mesIndex = parseInt(item.mes.split("-")[1], 10) - 1;
            cantidades[mesIndex] = item.cantidad;
        });

        createChartRecetasPorMes(nombresMeses, cantidades);
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
});



// Gráfica de Usuarios
function createChartUsuarios(medicos, pacientes) {
    const ctx = document.getElementById("myChart1").getContext("2d");

    if (myChartUsuarios) {
        myChartUsuarios.destroy();
    }

    myChartUsuarios = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Médicos", "Pacientes"],
            datasets: [{
                label: "Usuarios Registrados",
                data: [medicos, pacientes],
                backgroundColor: ['rgba(59, 104, 134, 0.8)', 'rgba(114, 208, 202, 0.8)'],
                borderColor: ['#1B2834', '#264150'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: '#1B2834', font: { size: 14, weight: 'bold' } } },
                title: { display: true, text: 'Distribución de Usuarios', color: '#1B2834', font: { size: 15 } }
            }
        }
    });
}

// Gráfica de Aceptación de Recetas
function createChartResultados(aceptado, denegado) {
    const ctx = document.getElementById("myChart3").getContext("2d");

    if (myChartResultados) {
        myChartResultados.destroy();
    }

    myChartResultados = new Chart(ctx, {
        type: "pie",  // Cambiado de "line" a "bar"
        data: {
            labels: ["Aceptado", "Denegado"],  // Etiquetas para las barras
            datasets: [{
                label: "Aceptación de recetas",
                data: [aceptado, denegado],  // Los valores de las barras
                backgroundColor: ['rgba(59, 104, 134, 0.8)', 'rgba(114, 208, 202, 0.8)'],  // Colores de las barras
                borderColor: ['#1B2834', '#264150'],  // Color del borde de las barras
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#1B2834', font: { size: 14, weight: 'bold' } } },
                title: { display: true, text: 'Aceptación de Recetas', color: '#1B2834', font: { size: 15 } }
            },
            scales: {
                y: {
                    beginAtZero: true  // Empieza el eje Y desde cero
                }
            }
        }
    });
}


// Gráfica de Estados de Consultas
function createChartEstados(estados) {
    const ctx = document.getElementById("myChart2").getContext("2d");

    if (myChartEstados) {
        myChartEstados.destroy();
    }

    myChartEstados = new Chart(ctx, {
        type: "line",
        data: {
            labels: Object.keys(estados),
            datasets: [{
                label: "Consultas por Estado",
                data: Object.values(estados),
                backgroundColor: [
                    'rgba(59, 104, 134, 0.8)',
                    'rgba(114, 208, 202, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(244, 67, 54, 0.8)'
                ],
                borderColor: ['#1B2834', '#264150', '#C49100', '#388E3C', '#D32F2F'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { color: '#264150' } }
            },
            plugins: {
                legend: { labels: { color: '#1B2834', font: { size: 14, weight: 'bold' } } },
            }
        }
    });
}
function createChartRecetasPorMes(meses, cantidades) {
    const canvas = document.getElementById("myChart4");

    if (!canvas) {
        console.error("No se encontró el elemento myChart4 en el HTML");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (myChartRecetas) {
        myChartRecetas.destroy();
    }

    // Definir los meses en español en orden
    const todosLosMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Crear un objeto con los datos recibidos
    let dataMap = {};

    meses.forEach((mes, index) => {
        // Convertir los números de mes a texto si vienen como "1", "2", etc.
        let mesTexto = isNaN(mes) ? mes : todosLosMeses[parseInt(mes) - 1];
        dataMap[mesTexto] = cantidades[index];
    });

    // Crear un array de cantidades, asegurando que todos los meses estén presentes
    let cantidadesCompletas = todosLosMeses.map(mes => dataMap[mes] || 0);

    myChartRecetas = new Chart(ctx, {
        type: "bar", // Mostrar como barras
        data: {
            labels: todosLosMeses,
            datasets: [{
                label: "Recetas por Mes",
                data: cantidadesCompletas,
                backgroundColor: 'rgba(59, 104, 134, 0.8)',
                borderColor: '#1B2834',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { color: '#264150' } }
            },
            plugins: {
                legend: { labels: { color: '#1B2834', font: { size: 14, weight: 'bold' } } },
                title: { display: true, text: 'Recetas Generadas por Mes', color: '#1B2834', font: { size: 15 } }
            }
        }
    });

    console.log("Gráfica de recetas por mes generada con éxito", cantidadesCompletas);
}

