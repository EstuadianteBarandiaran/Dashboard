// Función para mostrar notificaciones consistentes
function showAlert(title, text, icon, confirmText = 'Aceptar') {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonText: confirmText,
        customClass: {
            popup: 'mi-alerta',  
            title: 'mi-titulo',
            confirmButton: 'mi-boton'
        },
        buttonsStyling: false
    });
}

// Configuración inicial cuando el DOM esté listo
$(document).ready(function() {
    /* ========== FORMULARIO DE SUGERENCIA ========== */
    const $sugerenciaForm = $('#sugerenciaForm');
    if ($sugerenciaForm.length) {
        $sugerenciaForm.on('submit', function(event) {
            event.preventDefault();
            
            let isValid = true;
            let hasEmptyField = false;

            $('#Motivo, #Descripcion').each(function() {
                const value = $(this).val().trim();
                const $errorMsg = $(this).next('.error-message');
                
                if (value === '') {
                    $(this).addClass('invalid');
                    $errorMsg.show();
                    hasEmptyField = true;
                    isValid = false;
                } else {
                    $(this).removeClass('invalid');
                    $errorMsg.hide();
                }
            });

            if (hasEmptyField) {
                $('#formErrorAlert').show();
                $('#formSuccessAlert').hide();
            } else {
                $('#formErrorAlert').hide();
                $('#formSuccessAlert').show();
            }

            if (isValid) {
                showAlert(
                    "¡Sugerencia enviada!", 
                    "Tu sugerencia ha sido registrada con éxito.",
                    "success"
                ).then(() => {
                    $sugerenciaForm[0].reset();
                });
            }
        });
    }

    /* ========== FORMULARIO DE NOTIFICACIÓN ========== */
    $(document).ready(function() {
        $('#notificarForm').submit(async function(event) {
            event.preventDefault();
            const loadingAlert = Swal.fire({
                title: 'Procesando...',
                html: 'Estamos aceptando la receta médica',
                 customClass: {
                            popup: 'mi-alerta',  
                             title: 'mi-titulo', 
                             confirmButton: 'mi-boton'
                         },
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
    
            if (!$('#doctorId').val()) {
                await showAlert('Error', 'Por favor seleccione un doctor', 'error');
                return;
            }
    
            const data = {
                idC: $('#idC').val(),
                idHistorialClinico: $('#idHistorialClinico').val(),
                doctorId: $('#doctorId').val()
            };
    
            try {
                const response = await fetch('/notificar-doctor', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
    
                const text = await response.text();
                console.log("Respuesta del servidor:", text);
    
                const result = JSON.parse(text);  // Intentar convertir la respuesta en JSON
                await loadingAlert.close();
                if (result.success) {
                    await showAlert('Éxito', result.message, 'success');
                    $('#notificarModal').modal('hide');
    
                    if (result.redirectTo) {
                        window.location.href = result.redirectTo;
                    }
                } else {
                    throw new Error(result.message || 'Error desconocido');
                }
            } catch (error) {
                console.error("Error en la solicitud:", error);
                await showAlert('Error', 'Hubo un problema: ' + error.message, 'error');
            }
        });
    });
    
    // Función para mostrar alertas con SweetAlert
    function showAlert(title, text, icon) {
        return Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'mi-alerta',
                title: 'mi-titulo',
                confirmButton: 'mi-boton'
            }
        });
    }

    /* ========== FORMULARIO DE ACEPTAR RECETA DE USUARIO PACIENTE ========== */
    // Versión corregida usando solo jQuery
    $(document).ready(function() {
        $('#FormatoAceptar').on('submit', async function(event) {
            event.preventDefault();
            
            // Mostrar carga mientras se procesa
            const loadingAlert = Swal.fire({
                title: 'Procesando...',
                html: 'Estamos aceptando la receta médica',
                 customClass: {
                            popup: 'mi-alerta',  
                             title: 'mi-titulo',
                             confirmButton: 'mi-boton'
                         },
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
    
            try {
                const data = {
                    idCC: $('#idCC').val()
                };
    
                const response = await fetch('/AceptarReceta', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
    
                const result = await response.json();
                
                // Cerrar alerta de carga
                await loadingAlert.close();
    
                if (result.success) {
                    await showAlert(
                        '¡Receta Aceptada!', 
                        'La receta ha sido aceptada correctamente',
                        'success'
                    );
                    
                    // Cerrar el modal
                    $('#aceptarRecetaModal').modal('hide');
                    
                    // Redirigir si es necesario
                    if (result.redirectTo) {
                        window.location.href = result.redirectTo;
                    } else {
                        // Recargar la página para ver cambios
                        window.location.reload();
                    }
                } else {
                    await showAlert(
                        'Atención',
                        result.message || 'No se pudo completar la acción',
                        'warning'
                    );
                }
            } catch (error) {
                await loadingAlert.close();
                await showAlert(
                    'Error',
                    'Hubo un problema al aceptar la receta: ' + error.message,
                    'error'
                );
                console.error('Error al aceptar receta:', error);
            }
        });
    
    
    });
    
    /* ========== REGISTRO DE USUARIO ========== */
    const $registrarForm = $('#registrar');
    if ($registrarForm.length) {
        $registrarForm.on('submit', function(event) {
            event.preventDefault();
            
            $.ajax({
                type: 'POST',
                url: '/registrar',
                data: $(this).serialize(),
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        showAlert("¡Éxito!", response.message, "success")
                            .then(() => window.location.href = '/CRUDUsuarios');
                    } else {
                        showAlert("Error", response.message, "error");
                    }
                },
                error: function(xhr) {
                    const errorMsg = xhr.responseJSON?.message || "Error de conexión";
                    showAlert("Error", errorMsg, "error");
                }
            });
        });
    }

    /* ========== MANEJO DE RECETAS ========== */
    const setupRecetaButtons = () => {
        const $buttons = $('.btnVerReceta');
        if ($buttons.length) {
            $buttons.on('click', function() {
                const $modal = $('#modalReceta');
                if ($modal.length) {
                    $('#Motivo').text($(this).data('motivo') || "No especificado");
                    $('#idC').val($(this).data('idc'));
                    $modal.modal('show');
                }
            });
        }
    };

    /* ========== SATISFACCIÓN DE RECETA ========== */
    const $recetaAceptadaForm = $('#RecetaAceptada');
    if ($recetaAceptadaForm.length) {
        $recetaAceptadaForm.on('submit', async function(event) {
            event.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                valor: formData.get('valor'),
                idC: formData.get('idC'),
                idEstado: formData.get('idEstado')
            };

            if (!data.valor || !data.idC || !data.idEstado) {
                await showAlert('Error', 'Complete todos los campos', 'error');
                return;
            }

            try {
                const response = await fetch('/ResultadoSatisfaccion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
    
                const result = await response.json();
    
                if (result.success) {
                    await Swal.fire({
                        title: "¡Receta aceptada!",
                        text: "La receta médica ha sido aceptada con éxito.",
                        icon: "success",
                        confirmButtonText: "Entendido",
                        customClass: {
                            popup: 'mi-alerta',  
                             title: 'mi-titulo',
                             confirmButton: 'mi-boton'
                         },
                    });
                    
                    window.location.href = result.redirectTo;
                } else {
                    Swal.fire({
                        title: "Error",
                        text: result.message,
                        icon: "error",
                        confirmButtonText: "Intentar de nuevo",
                        customClass: {
                            popup: 'mi-alerta',  
                             title: 'mi-titulo',
                             confirmButton: 'mi-boton'
                         }
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: "Error",
                    text: "Hubo un problema al procesar la solicitud.",
                    icon: "error",
                    confirmButtonText: "Entendido",
                    customClass: {
                        popup: 'mi-alerta',  
                         title: 'mi-titulo',
                         confirmButton: 'mi-boton'
                     }
                });
            }
        });
    }
    

    // Inicialización
    setupRecetaButtons();
});

/* ========== ENVÍO DE RECETA DEL MEDICO AL ADMIN(Vanilla JS) ========== */
document.addEventListener("DOMContentLoaded", function () {
    const recetaForm = document.getElementById("recetaForm");
    const modalElement = document.getElementById("recetaModal");
    const modal = new bootstrap.Modal(modalElement);

    // Función para abrir el modal y asignar los valores de ID
    document.querySelectorAll(".open-modal").forEach(btn => {
        btn.addEventListener("click", function () {
            document.getElementById("idC").value = this.getAttribute("data-idC");
            document.getElementById("idH").value = this.getAttribute("data-idH");
        });
    });

    // Manejar el envío del formulario
    recetaForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evitar la recarga de la página

        const formData = new FormData(recetaForm);
        const data = {
            idC: formData.get("idC"),
            idH: formData.get("idH"),
            Diagnostico: formData.get("Diagnostico"),
            Tratamiento: formData.get("Tratamiento"),
        };

        try {
            // Enviar datos al servidor
            const response = await fetch("/enviarReceta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                await showAlert("¡Receta Aceptada!", "La receta ha sido aceptada correctamente.", "success");
                
                // Cerrar el modal después de que se acepte la receta
                modal.hide();
                window.location.href = '/indexMedico';
                

                // Limpiar el formulario
                recetaForm.reset();

                // Recargar la página después de un corto tiempo
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                await showAlert("Error", result.message || "Hubo un problema al enviar la receta.", "error");
            }
        } catch (error) {
            console.error("Error al enviar la receta:", error);
            await showAlert("Error", "Hubo un problema de conexión con el servidor.", "error");
        }
    });
});


$('#saveChanges').click(function() {
    const userId = $('#editUserId').val();
    const userData = {
        Nombres: $('#editName').val(),
        Apellido: $('#editLastName').val(),
        Correo: $('#editEmail').val(),
        fecha_nacimiento: $('#editBirthDate').val(),
        Genero: $('#editGender').val()
    };

    Swal.fire({
        title: "¿Deseas guardar los cambios?",
        text: "Esta acción actualizará la información del usuario",
        icon: "question",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        denyButtonText: "No guardar",
        customClass: {
            popup: 'mi-alerta',
            title: 'mi-titulo',
            confirmButton: 'mi-boton'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/api/users/${userId}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(userData),
                success: function(response) {
                    if (response.success) {
                        // Actualizar la fila correspondiente
                        const row = $(`tr[data-id="${userId}"]`);
                        if (row.length) {
                            row.find('td:nth-child(2)').text(`${userData.Nombres} ${userData.Apellido}`);
                            row.find('td:nth-child(3)').text(userData.Correo);
                            row.find('td:nth-child(4)').text(userData.fecha_nacimiento);
                            row.find('td:nth-child(5)').text(userData.Genero);
                        }

                        $('#editUserModal').modal('hide');
                        $('#editUserForm')[0].reset(); // Resetear el formulario de edición
                        
                        Swal.fire({
                            title: "Cambios guardados",
                            text: "La información se ha actualizado",
                            icon: "success",
                            customClass: {
                                popup: 'mi-alerta',
                                title: 'mi-titulo',
                                confirmButton: 'mi-boton'
                            }
                        });
                    } else {
                        Swal.fire("Error", "No se pudo actualizar: " + response.message, "error");
                    }
                },
                error: function() {
                    Swal.fire("Error", "No se pudo conectar con el servidor", "error");
                }
            });
        } else if (result.isDenied) {
            Swal.fire({
                title: "Cambios no guardados",
                text: "La información no se ha actualizado",
                icon: "info",
                customClass: {
                    popup: 'mi-alerta',
                    title: 'mi-titulo',
                    confirmButton: 'mi-boton'
                }
            });
        }
    });
});

$(document).on('click', '.delete-btn', function() {
    const selectedUserId = $(this).data('id');
    const selectedUserRole = $(this).data('role');

    // Mostrar alerta de confirmación con SweetAlert
    Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        customClass: {
            popup: 'mi-alerta',
            title: 'mi-titulo',
            confirmButton: 'mi-boton'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Si el usuario confirma, proceder con la eliminación
            $.ajax({
                url: `/api/users/${selectedUserId}`,
                type: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        // Eliminar la fila de la tabla sin recargar toda la tabla
                        $(`tr[data-id="${selectedUserId}"]`).remove();

                        // Mostrar mensaje de éxito con SweetAlert
                        Swal.fire({
                            title: "Eliminado",
                            text: "El usuario ha sido eliminado.",
                            icon: "success",
                            customClass: {
                                popup: 'mi-alerta',
                                title: 'mi-titulo',
                                confirmButton: 'mi-boton'
                            }
                        });
                        
                        // Opcional: Recargar la tabla si es necesario
                        if (selectedUserRole == 2) {
                            loadDoctors();
                        } else if (selectedUserRole == 3) {
                            loadPatients();
                        }
                    } else {
                        Swal.fire("Error", "No se pudo eliminar: " + response.message, "error");
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Error en la solicitud AJAX:", error);
                    Swal.fire("Error", "No se pudo conectar con el servidor", "error");
                }
            });
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("ConsultaP").addEventListener("submit", function (event) {
      event.preventDefault();
      
      // Obtener los datos del formulario
      const formData = {
        motivo: document.querySelector('[name="motivo"]').value,
        sintomas: document.querySelector('[name="sintomas"]').value,
        alergias: document.querySelector('[name="alergias"]').value,
        cirugias: document.querySelector('[name="cirugias"]').value,
        hospitalizaciones: document.querySelector('[name="hospitalizaciones"]').value,
        tabaco: document.querySelector('[name="tabaco"]').value,
        alcohol: document.querySelector('[name="alcohol"]').value,
        direccion: document.querySelector('[name="direccion"]').value
      };
  
      Swal.fire({
        title: "¡Consulta enviada!",
        text: "Tu consulta ha sido enviada con éxito.",
        icon: "success",
        confirmButtonText: "Entendido",
        customClass: {
          popup: 'mi-alerta',  
          title: 'mi-titulo',
          confirmButton: 'mi-boton'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Enviar los datos mediante fetch
          fetch('/ConsultaRegistro', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              window.location.href = data.redirectTo;
            }
          })
          .catch(error => {
            console.error('Error:', error);
          });
        }
      });
    });
  });