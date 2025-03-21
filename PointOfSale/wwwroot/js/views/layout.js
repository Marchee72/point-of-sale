﻿let razonesList;

const BASIC_MODEL_MOVIMIENTIO_CAJA = {
    idMovimientoCaja: 0,
    comentario: '',
    registrationDate: null,
    registrationUser: '',
    idRazonMovimientoCaja: 0,
    importe: 0
}
$(document).ready(function () {

    $('#modalDataAbrirTurno').modal({
        backdrop: 'static',
        keyboard: false
    });


    $("#limpiarNotificaciones").on("click", function () {

        fetch(`/Notification/LimpiarTodoNotificacion`, {
            method: "PUT",
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
            .then(response => {
                return response.json();
            }).then(responseJson => {
                if (responseJson.state) {
                    $(".dropdown-menu .dropdown-header").remove();
                    $("#listaNotificaciones").remove();

                } else {
                    swal("Lo sentimos", responseJson.message, "error");
                }

            }).catch((error) => {
            })
    })


    $(".notificacion").on("click", function () {
        if ($(this).attr('accion') != '') {

            fetch(`/Notification/UpdateNotificacion?idNotificacion=${$(this)[0].id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json;charset=utf-8' }
            })
                .then(response => {
                    return response.json();
                }).then(responseJson => {
                    if (responseJson.state) {
                        window.location.href = responseJson.object.accion;

                    } else {
                        swal("Lo sentimos", responseJson.message, "error");
                    }

                }).catch((error) => {
                })
        }
    })

    $("#btnChangePV").on("click", function () {

        fetch("/Tienda/GetTienda")
            .then(response => {
                return response.json();
            }).then(responseJson => {

                if (responseJson.data.length > 0) {
                    $("#modalCambioTienda").modal("show");
                    let idActual = 0;
                    responseJson.data.forEach((item) => {
                        let actual = '';
                        if (item.tiendaActual) {
                            idActual = item.idTienda;
                            actual = ' (Actual)';
                        }
                        $("#cboTiendas").append(
                            $("<option>").val(item.idTienda).text(item.nombre + ' ' + actual)
                        )
                    });
                    $("#cboTiendas").val(idActual);
                }
            })
    })

    $("#btnCambiarTienda").on("click", function () {

        $("#modalCambioTienda").LoadingOverlay("show")

        var idTienda = $("#cboTiendas").val();
        fetch(`/Tienda/ChangeTienda?idTienda=${idTienda}`, {
            method: "DELETE"
        }).then(response => {
            return response.json();
        }).then(responseJson => {
            if (responseJson.state) {
                location.reload()

            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
        })
            .catch((error) => {
            })
    })

    $('[data-toggle="tooltip"]').tooltip();

});

$(document).on('input', '.txtCantBillete', function () {
    const idParts = $(this).attr('id').split('_');
    const columnPrefix = idParts[1];
    const index = idParts[2];
    const cantidad = $(this).val();
    const valorNominal = $(this).data('valor');
    const total = cantidad * valorNominal;

    $(`#txtSumaBillete_${columnPrefix}_${index}`).val(`$${total}`);
    calcularTotal();
});

function calcularTotal() {
    let totalSum = 0;
    $('.txtCantBillete').each(function () {
        const cantidad = parseInt($(this).val(), 10);
        const valorNominal = parseInt($(this).data('valor'), 10);
        totalSum += cantidad * valorNominal;
    });
    $('#totalSumBilletes').val(`${totalSum}`);
}

$("#btnAbrirCerrarTurno").on("click", function () {
    showLoading();

    fetch(`/Turno/GetTurnoActual`, {
        method: "GET"
    })
        .then(response => {
            $("div.container-fluid").LoadingOverlay("hide")
            return response.json();
        }).then(responseJson => {

            if (responseJson.state) {

                if (responseJson.object.turno == null) {
                    openModalDataAbrirTurno();
                }
                else {
                    let resultado = responseJson.object.turno;

                    $("#txtIdTurnoLayout").val(resultado.idTurno);

                    let fechaInicio = moment(resultado.fechaInicio);
                    let argentinaTime = '';

                    if (typeof moment !== 'undefined' && typeof moment.tz !== 'undefined') {
                        argentinaTime = moment().tz('America/Argentina/Buenos_Aires');
                    }
                    let fechaFin = resultado.FechaFin != null
                        ? moment(resultado.FechaFin)
                        : argentinaTime;


                    if (fechaInicio.isValid()) {
                        let fechaFormatted = fechaInicio.format('DD/MM/YYYY');
                        let horaInicioFormatted = fechaInicio.format('HH:mm');

                        $("#txtInicioTurnoCierre").val(fechaFormatted);
                        $("#txtHoraInicioTurnoCierre").val(horaInicioFormatted);
                    }

                    if (fechaFin != '' && fechaFin.isValid()) {
                        let horaFinFormatted = fechaFin.format('HH:mm');

                        $("#txtCierraTurnoCierre").val(horaFinFormatted);
                    }

                    if (resultado.observacionesApertura != '') {
                        $("#txtObservacionesApertura").val(resultado.observacionesApertura);
                        $('#divObservacionesApertura').css('display', '');
                    }
                    else {
                        $('#divObservacionesApertura').css('display', 'none');
                    }
                    $("#modalDataCerrarTurno").modal("show");

                    $("#btnValidarFinalizarTurno").show();
                    let contenedor = $("#contMetodosPagoLayout");

                    let turnoValidado = resultado.totalCierreCajaSistema != 0 || resultado.totalCierreCajaReal != 0;

                    renderVentasPorTipoVenta(contenedor, resultado.ventasPorTipoVenta, resultado.totalInicioCaja, turnoValidado, responseJson.object.totalMovimientosCaja);

                    if (turnoValidado) {
                        contenedor.append($('<hr style="margin-top: 0px;">'));

                        //crearFilaTotalesTurno(contenedor, "TOTAL Sistema", resultado.totalCierreCajaSistema, true, "txtTotalSumado");
                        //crearFilaTotalesTurno(contenedor, "TOTAL Usuario", resultado.totalCierreCajaReal, true, "txtTotalSumado");

                        $("#btnValidarFinalizarTurno").hide();
                        $("#btnFinalizarTurno").show();
                        $("#divSwitchCierreCaja").show();
                        $("#btnBilletes").hide()
                        mostrarErroresTurno(resultado.erroresCierreCaja);
                    }

                }

            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
            removeLoading();
        })
        .catch((error) => {
            $("div.container-fluid").LoadingOverlay("hide")
        });

})



$("#btnAbrirMovimientoCaja").on("click", function () {
    cargarRazones();
    disablesMovimientoCajaModal(false);

    $("#modalMovimientoCaja").modal("show");
});

function cargarRazones() {
    showLoading();
    fetch("/MovimientoCaja/GetRazonMovimientoCajaActivas")
        .then(response => {
            return response.json();
        }).then(responseJson => {

            if (responseJson.state) {
                if (responseJson.object.length > 0) {
                    razonesList = responseJson.object;

                    $("#cboTipoRazonMovimiento").trigger("change");
                }
            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
            removeLoading();
        });
}

$("#cboTipoRazonMovimiento").on("change", function () {
    filterRazones();
});

function filterRazones() {
    let selectedTipo = $("#cboTipoRazonMovimiento").val();
    $("#cboRazonMovimiento").empty();

    razonesList.forEach((item) => {
        if (item.tipo == selectedTipo) {
            $("#cboRazonMovimiento").append(
                $("<option>").val(item.idRazonMovimientoCaja).text(item.descripcion)
            );
        }
    });
}

$("#btnSaveMovimientoCaja").on("click", function () {
    const inputs = $("input.input-validate-movimientoCaja").serializeArray();
    const inputs_without_value = inputs.filter((item) => item.value.trim() == "")

    if (inputs_without_value.length > 0) {
        const msg = `Debe completar los campos : "${inputs_without_value[0].name}"`;
        toastr.warning(msg, "");
        $(`input[name="${inputs_without_value[0].name}"]`).focus();
        return;
    }

    if ($("#txtComentarioMovimientoCaja").val().length < 5) {
        toastr.warning("La descripción debe ser mayor a 5 caracteres", "");
        return
    }

    let importe = parseFloat($("#txtImporteMovimientoCaja").val());
    if ($("#cboTipoRazonMovimiento").val() == "0" && importe > 0) {
        importe = importe * -1;
    }

    const model = structuredClone(BASIC_MODEL_MOVIMIENTIO_CAJA);
    model["idRazonMovimientoCaja"] = parseInt($("#cboRazonMovimiento").val());
    model["importe"] = importe;
    model["comentario"] = $("#txtComentarioMovimientoCaja").val();

    $("#modalMovimientoCaja").find("div.modal-content").LoadingOverlay("show")

    fetch("/MovimientoCaja/CreateMovimientoCaja", {
        method: "POST",
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(model)
    }).then(response => {
        $("#modalMovimientoCaja").find("div.modal-content").LoadingOverlay("hide")
        return response.json();
    }).then(responseJson => {

        if (responseJson.state) {

            $("#modalMovimientoCaja").modal("hide");

            $("#txtImporteMovimientoCaja").val('');
            $("#txtComentarioMovimientoCaja").val('');
        } else {
            swal("Lo sentimos", responseJson.message, "error");
        }
    }).catch((error) => {
        $("#modalMovimientoCaja").find("div.modal-content").LoadingOverlay("hide")
    })
})
function disablesMovimientoCajaModal(type) {
    $('#btnSaveMovimientoCaja').css('display', type ? 'none' : '');
    $('#divFechaUsuarioMovimientoCaja').css('display', type ? '' : 'none');

    $('#cboTipoRazonMovimiento').prop('disabled', type);
    $('#cboRazonMovimiento').prop('disabled', type);
    $('#txtImporteMovimientoCaja').prop('disabled', type);
    $('#txtComentarioMovimientoCaja').prop('disabled', type);

}

function horaActual() {
    let dateTimeModifHoy = new Date();

    let options = {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    let formatter = new Intl.DateTimeFormat('es-AR', options);
    let dateTimeArgentina = formatter.format(dateTimeModifHoy);

    return dateTimeArgentina;
}

function openModalDataAbrirTurno() {
    let dateTimeArgentina = moment().tz('America/Argentina/Buenos_Aires');

    // Mostrar el modal
    $("#modalDataAbrirTurno").modal("show");

    $('#modalDataAbrirTurno').on('shown.bs.modal', function () {
        $("#txtInicioTurnoAbrir").val(dateTimeArgentina.format('DD/MM/YYYY'));
        $("#txtHoraInicioTurnoAbrir").val(dateTimeArgentina.format('HH:mm'));
    });
}



function renderVentasPorTipoVenta(contenedor, ventasPorTipoVenta, importeInicioCaja, turnoCerrado, totalMovimientosCaja = null) {
    let total = renderVentasPorTipoVenta_OLIVA(contenedor, ventasPorTipoVenta, importeInicioCaja, turnoCerrado, totalMovimientosCaja);
    return total;
}

function renderVentasPorTipoVenta_OLIVA(contenedor, ventasPorTipoVenta, importeInicioCaja, turnoCerrado, totalMovimientosCaja = null) {
    contenedor.empty();

    crearFilaTotalesTurno(contenedor, "TOTAL INICIO CAJA", importeInicioCaja, true, "txtInicioCajaCierre");

    if (totalMovimientosCaja != null && totalMovimientosCaja != 0) {
        crearFilaTotalesTurno(contenedor, "MOV. DE CAJA", totalMovimientosCaja, true, 'txtMovimientoCaja');
    }

    contenedor.append($('<hr style="margin-top: 0px;">'));

    let total = 0;
    ventasPorTipoVenta.forEach(function (venta) {
        total += parseFloat(venta.total);
        let id = 'txt' + venta.descripcion;
        let totalVenta = turnoCerrado ? venta.total : '';

        crearFilaTotalesTurno(contenedor, venta.descripcion, totalVenta, turnoCerrado, id);
    });

    return total;
}

function renderVentasPorTipoVenta_NORMAL(contenedor, ventasPorTipoVenta, importeInicioCaja, turnoCerrado, totalMovimientosCaja = null) {

    crearFilaTotalesTurno(contenedor, "TOTAL INICIO CAJA", importeInicioCaja, true, "txtInicioCajaCierre");

    if (totalMovimientosCaja != null && totalMovimientosCaja != 0) {
        crearFilaTotalesTurno(contenedor, "MOV. DE CAJA", totalMovimientosCaja, true, 'txtMovimientoCaja');
    }

    let total = 0;
    ventasPorTipoVenta.forEach(function (venta) {
        total += parseFloat(venta.total);

        let id = 'txt' + venta.descripcion;
        crearFilaTotalesTurno(contenedor, venta.descripcion, venta.total, true, id);
    });

    $("#btnValidarFinalizarTurno").hide();
    $("#btnFinalizarTurno").show();
    $("#divSwitchCierreCaja").show();
    return total;
}

function crearFilaTotalesTurno(contenedor, descripcion, total, disabled, inputId = null) {
    let formGroup = $('<div>', { class: 'form-group row align-items-center', style: 'margin-bottom:2px' });

    let label = $('<label>', {
        class: 'col-sm-7 col-form-label',
        text: descripcion + ":",
        style: 'font-size: 20px; padding-right: 0px; padding-top: 0px;'
    });

    let inputDiv = $('<div>', { class: 'col-sm-5', style: 'padding-right: 0px; padding-left: 0px;' });


    let inputGroup = $('<div>', { class: 'input-group input-group-sm', style: 'margin-top: 0px;' });

    let inputGroupPrepend = $('<div>', { class: 'input-group-prepend' });

    let span = $('<span>', {
        class: 'input-group-text',
        text: '$'
    });

    let classInput = 'form-control form-control-sm';

    if (total == '' && total != '0') {
        classInput += ' validate-importe';
    }

    let inputAttributes = {
        type: 'number',
        step: 'any',
        class: classInput,
        min: '0',
        value: total,
        disabled: disabled,
        style: 'text-align: end;'
        //,change: function () { actualizarTotal(); }
    };

    if (inputId != '') {
        inputAttributes.id = inputId;
    }

    let input = $('<input>', inputAttributes);

    inputGroupPrepend.append(span);
    inputGroup.append(inputGroupPrepend).append(input);

    if (descripcion.toLowerCase() == "efectivo") {
        let inputGroupAppend = $('<div>', { class: 'input-group-append' });

        let button = $('<button>', {
            id: 'btnBilletes',
            type: 'button',
            class: 'btn btn-outline-success mdi mdi-cash',
            style: 'padding: 0 10px;',
            title: 'Contar billetes',
            'data-toggle': 'tooltip',
            click: function () {
                $('#modalBilletes').modal('show');
            }
        });

        inputGroupAppend.append(button);
        inputGroup.append(inputGroupAppend);
    }

    inputDiv.append(inputGroup);
    formGroup.append(label).append(inputDiv);
    contenedor.append(formGroup);
}

function actualizarTotal() {
    let total = 0;
    $('#contMetodosPagoLayout input[type="number"]').each(function () {
        if ($(this).attr('id') != 'txtTotalSumado') {
            let value = parseFloat($(this).val()) || 0;
            total += value;
        }

    });
    $('#txtTotalSumado').val(total.toFixed(0));
}

$("#btnAbrirTurno").on("click", function () {
    let desc = $("#txtObservacionesInicioCajaCierre").val();
    let importeInicioTurno = $("#txtInicioCajaAbrir").val();

    let modelTurno = {
        observacionesApertura: desc,
        TotalInicioCaja: parseFloat(importeInicioTurno != '' ? importeInicioTurno : 0),
    };
    $("#modalDataAbrirTurno").find("div.modal-content").LoadingOverlay("show")

    fetch("/Turno/AbrirTurno", {
        method: "POST",
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(modelTurno)
    }).then(response => {
        $("#modalDataAbrirTurno").find("div.modal-content").LoadingOverlay("hide")
        return response.json();
    }).then(responseJson => {
        if (responseJson.state) {

            $("#modalDataAbrirTurno").modal("hide");
            location.reload();

        } else {
            swal("Lo sentimos", responseJson.message, "error");
        }
    }).catch((error) => {
        $("#modalDataAbrirTurno").find("div.modal-content").LoadingOverlay("hide")
    })
})

$("#btnValidarFinalizarTurno").on("click", function () {

    let listaVentas = obtenerValoresInputsCerrarTurno();
    if (listaVentas == null) {
        return;
    }

    let modelTurno = {
        observacionesCierre: $("#txtObservacionesCierre").val(),
        idTurno: parseInt($("#txtIdTurnoLayout").val()),
        ventasPorTipoVenta: listaVentas
    };

    $("#modalDataCerrarTurno").find("div.modal-content").LoadingOverlay("show")

    fetch("/Turno/ValidarCierreTurno", {
        method: "POST",
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(modelTurno)
    }).then(response => {
        $("#modalDataCerrarTurno").find("div.modal-content").LoadingOverlay("hide")
        return response.json();
    }).then(responseJson => {
        if (responseJson.state) {
            mostrarErroresTurno(responseJson.object.erroresCierreCaja);

            $("#btnValidarFinalizarTurno").hide();
            $("#btnFinalizarTurno").show();
            $("#divSwitchCierreCaja").show();
            $("#btnBilletes").hide()

            $('#contMetodosPagoLayout input[type="number"]').each(function () {
                $(this).prop('disabled', true);
            });

            let contenedor = $("#contMetodosPagoLayout");
            contenedor.append($('<hr style="margin-top: 0px;">'));
            //crearFilaTotalesTurno(contenedor, "TOTAL Sistema", responseJson.object.totalCierreCajaSistema, true, "txtTotalSumado");
            //crearFilaTotalesTurno(contenedor, "TOTAL Usuario", responseJson.object.totalCierreCajaReal, true, "txtTotalSumado");

        } else {
            swal("Lo sentimos", responseJson.message, "error");
        }
    }).catch((error) => {
        $("#modalDataCerrarTurno").find("div.modal-content").LoadingOverlay("hide")
    })
})

function mostrarErroresTurno(errores) {
    if (errores == '') {
        $("#txtError").text('');
        const divError = document.getElementById("divError");
        divError.classList.remove('d-flex');
        divError.style.display = 'none';
    }
    else {
        $("#txtError").html(errores);
        const divError = document.getElementById("divError");
        divError.classList.add('d-flex');
        divError.style.display = '';
        errorCerrarTurno = true;
    }
}

let errorCerrarTurno = false;

$("#btnFinalizarTurno").on("click", function () {

    let listaVentas = obtenerValoresInputsCerrarTurno();
    if (listaVentas == null) {
        return;
    }

    let impirmirCierreCaja = document.getElementById('switchCierreCaja').checked;

    let modelTurno = {
        observacionesCierre: $("#txtObservacionesCierre").val(),
        idTurno: parseInt($("#txtIdTurnoLayout").val()),
        ventasPorTipoVenta: listaVentas,
        impirmirCierreCaja: impirmirCierreCaja
    };

    if (errorCerrarTurno) {
        if ($("#txtObservacionesCierre").val().length < 5) {
            toastr.warning("Al tener diferencias, debe agregar una observacion al cierre", "");
            return
        }
    }

    $("#modalDataCerrarTurno").find("div.modal-content").LoadingOverlay("show")

    fetch("/Turno/CerrarTurno", {
        method: "POST",
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(modelTurno)
    }).then(response => {
        $("#modalDataCerrarTurno").find("div.modal-content").LoadingOverlay("hide")
        return response.json();
    }).then(responseJson => {
        if (responseJson.state) {

            $("#modalDataCerrarTurno").modal("hide");
            if (impirmirCierreCaja && responseJson.object.nombreImpresora != '') {

                swal("Exitoso!", "Imprimiendo cierre de turno!", "success");
                printTicket(responseJson.object.ticket, responseJson.object.nombreImpresora, responseJson.object.imagesTicket);
            }

            location.reload();

        } else {
            swal("Lo sentimos", responseJson.message, "error");
        }
    }).catch((error) => {
        $("#modalDataCerrarTurno").find("div.modal-content").LoadingOverlay("hide")
    })

})

$('#modalDataCerrarTurno').on('hidden.bs.modal', function () {
    $("#txtError").text('');
    const divError = document.getElementById("divError");
    divError.classList.remove('d-flex');
    divError.style.display = 'none';
    document.getElementById("btnFinalizarTurno").style.display = 'none';
    document.getElementById("divSwitchCierreCaja").style.display = 'none';

    errorCerrarTurno = false;
    $("#txtObservacionesCierre").prop("disabled", false);
});


function obtenerValoresInputsCerrarTurno() {

    const inputs = $("input.validate-importe").map(function () {
        return $(this).val();  // Obtener el valor de cada input
    }).get();  // Convertir a un array

    const inputs_without_value = inputs.filter(value => value.trim() == "");

    if (inputs_without_value.length > 0) {
        const msg = `Debe completar todos los medios de pagos`;
        toastr.warning(msg, "");
        return null;
    }

    let valores = [];

    $('#contMetodosPagoLayout input[type="number"]').each(function () {
        let inputId = $(this).attr('id');
        let label = inputId.substring(3);
        let valor = parseFloat($(this).val()) || 0;

        if (valor != 0) {
            let ventaPorTipo = {
                Descripcion: label,
                Total: valor
            };

            valores.push(ventaPorTipo);
        }
    });

    return valores;
}

function abrirTurnoDesdeViewTurnos(idTurno) {
    showLoading();

    fetch(`/Turno/GetTurno?idTurno=` + idTurno, {
        method: "GET"
    })
        .then(response => {
            $("div.container-fluid").LoadingOverlay("hide")
            return response.json();
        }).then(responseJson => {
            if (responseJson.state) {

                let result = responseJson.object.turno;

                $("#txtIdTurnoLayout").val(result.idTurno);

                let fechaInicio = moment(result.fechaInicio);
                let fechaFin = result.fechaFin
                    ? moment(result.fechaFin)
                    : '';

                if (fechaInicio.isValid()) {
                    let fechaFormatted = fechaInicio.format('DD/MM/YYYY');
                    let horaInicioFormatted = fechaInicio.format('HH:mm');

                    $("#txtInicioTurnoCierre").val(fechaFormatted);
                    $("#txtHoraInicioTurnoCierre").val(horaInicioFormatted);
                }

                if (fechaFin != '') {
                    let horaFinFormatted = fechaFin.format('HH:mm');

                    $("#txtCierraTurnoCierre").val(horaFinFormatted);
                }

                if (result.observacionesApertura != '') {
                    $("#txtObservacionesApertura").val(result.observacionesApertura);
                    $('#divObservacionesApertura').css('display', '');
                }
                else {
                    $('#divObservacionesApertura').css('display', 'none');
                }
                $("#txtObservacionesCierre").val(result.observacionesCierre);
                $("#txtObservacionesCierre").prop("disabled", true);
                $("#btnFinalizarTurno").hide();
                $("#divSwitchCierreCaja").hide();

                $("#btnValidarFinalizarTurno").hide();
                $("#modalDataCerrarTurno").modal("show");

                let contenedor = $("#contMetodosPagoLayout");

                let total = renderVentasPorTipoVenta(contenedor, result.ventasPorTipoVenta, result.totalInicioCaja, true);

                contenedor.append($('<hr style="margin-top: 0px;">'));
                crearFilaTotalesTurno(contenedor, "TOTAL", total, true, "txtTotalSumado");


            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
            removeLoading();
        })
        .catch((error) => {
            $("div.container-fluid").LoadingOverlay("hide")
        });
}

function generarDatos() {
    showLoading();

    fetch(`/Access/GenerarDatos`, {
        method: "POST"

    }).then(responseJson => {

        removeLoading();
        if (responseJson.status == 200) {
            swal("Exitoso!", "Datos cerados", "success");

        } else {
            swal("Lo sentimos", "", "error");
        }
    })
        .catch((error) => {
            $("div.container-fluid").LoadingOverlay("hide")
        });

}

function showLoading() {
    if (document.getElementById("divLoadingFrame") != null) {
        return;
    }
    var style = document.createElement("style");
    style.id = "styleLoadingWindow";
    style.innerHTML = `
        .loading-frame {
            position: fixed;
            background-color: rgba(80, 80, 80, 0.3);
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 4;
        }

        .loading-track {
            height: 50px;
            display: inline-block;
            position: absolute;
            top: calc(50% - 50px);
            left: 50%;
        }

        .loading-dot {
            height: 5px;
            width: 5px;
            background-color: white;
            border-radius: 100%;
            opacity: 0;
        }

        .loading-dot-animated {
            animation-name: loading-dot-animated;
            animation-direction: alternate;
            animation-duration: .75s;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
        }

        @keyframes loading-dot-animated {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }
    `
    document.body.appendChild(style);
    var frame = document.createElement("div");
    frame.id = "divLoadingFrame";
    frame.classList.add("loading-frame");
    for (var i = 0; i < 10; i++) {
        var track = document.createElement("div");
        track.classList.add("loading-track");
        var dot = document.createElement("div");
        dot.classList.add("loading-dot");
        track.style.transform = "rotate(" + String(i * 36) + "deg)";
        track.appendChild(dot);
        frame.appendChild(track);
    }
    document.body.appendChild(frame);
    var wait = 0;
    var dots = document.getElementsByClassName("loading-dot");
    for (var i = 0; i < dots.length; i++) {
        window.setTimeout(function (dot) {
            dot.classList.add("loading-dot-animated");
        }, wait, dots[i]);
        wait += 150;
    }
};

function removeLoading() {
    var loadingFrame = document.getElementById("divLoadingFrame");
    if (loadingFrame) document.body.removeChild(loadingFrame);
    var loadingWin = document.getElementById("styleLoadingWindow");
    if (loadingWin) document.body.removeChild(loadingWin);
};

function setupPasswordToggle($passwordInput, $toggleButton) {
    $toggleButton.on('mousedown', function () {
        $passwordInput.attr('type', 'text');
    });

    $toggleButton.on('mouseup mouseleave', function () {
        $passwordInput.attr('type', 'password');
    });

    // Evitar que el botón reciba el foco
    $toggleButton.on('click', function (e) {
        e.preventDefault();
    });
}

function formatCuil(value) {
    value = value.replace(/\D/g, '');
    let formattedValue = '';

    if (value.length > 0) formattedValue += value.substring(0, 2);
    if (value.length > 2) formattedValue += '-' + value.substring(2, 10);
    if (value.length > 10) formattedValue += '-' + value.substring(10, 11);

    return formattedValue;
}

function validateCuilCuit() {
    let cuilValue = $('#txtCuilCliente').val().replace(/\D/g, '');
    return cuilValue.length == 11;
}

function validateDni() {
    let dniValue = $('#txtCuilCliente').val().replace(/\D/g, '');
    return dniValue.length == 8;
}

$("#bntBilletes").on("click", function () {
    $("#modalBilletes").modal("show");
})

$("#btnGuardarBilletes").on("click", function () {
    let totalBilletes = $("#totalSumBilletes").val();

    $("#txtEfectivo").val(parseInt(totalBilletes));

    actualizarTotal();  // Recalcular el total

    $("#modalBilletes").modal("hide");

})
