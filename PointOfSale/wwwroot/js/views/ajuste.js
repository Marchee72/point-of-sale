﻿const BASIC_MODEL_AJUSTE = {
    idAjuste: 0,
    modificationDate: null,
    modificationUser: null,
    codigoSeguridad: "",
    imprimirDefault: false,
    controlStock: false,
    encabezado1: "",
    encabezado2: "",
    encabezado3: "",
    pie1: "",
    pie2: "",
    pie3: "",
    nombreImpresora: "",
    minimoIdentificarConsumidor: 0,
    facturaElectronica: false,
    controlEmpleado: false,
    notificarEmailCierreTurno: false,
    emailsReceptores: "",
    emailEmisorCierreTurno: "",
    passwordEmailEmisorCierreTurno: "",
}

const BASIC_MODEL_AJUSTE_WEB = {
    idAjusteWeb: 0,
    montoEnvioGratis: 0,
    aumentoWeb: 0,
    whatsapp: "",
    lunes: "",
    martes: "",
    miercoles: "",
    jueves: "",
    viernes: "",
    sabado: "",
    domingo: "",
    feriado: "",
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    habilitarWeb: true,
    nombreComodin1: "",
    nombreComodin2: "",
    nombreComodin3: "",
    habilitarComodin1: false,
    habilitarComodin2: false,
    habilitarComodin3: false
}


const BASIC_MODEL_AJUSTES_FACTURACION = {
    idAjustesFacturacion: 0,
    logo: "",
    cuit: 0,
    condicionIva: null,
    puntoVenta: 0,
    certificadoFechaInicio: null,
    certificadoFechaCaducidad: null,
    certificadoPassword: "",
    certificadoNombre: "",
    nombreTitular: "",
    ingresosBurutosNro: "",
    direccionFacturacion: "",
    isProdEnvironment: false
}


let isHealthyAjustes = false;
$(document).ready(function () {
    showLoading();

    fetch("/Ajustes/GetAjuste")
        .then(response => {
            return response.json();
        }).then(responseJson => {
            if (responseJson.state) {

                let model = responseJson.object;

                $("#txtId").val(model.idAjuste);

                $("#txtCodigoSeguridad").val(model.codigoSeguridad);
                $("#txtEncabezado1").val(model.encabezado1);
                $("#txtEncabezado2").val(model.encabezado2);
                $("#txtEncabezado3").val(model.encabezado3);
                $("#txtPie1").val(model.pie1);
                $("#txtPie2").val(model.pie2);
                $("#txtPie3").val(model.pie3);
                $("#txtMinimoIdentificarConsumidor").val(model.minimoIdentificarConsumidor);
                $("#cboNombreImpresora").val(model.nombreImpresora);
                loadTableFromEmailsString(model.emailsReceptoresCierreTurno);
                $("#txtEmailCierreTurno").val(model.emailEmisorCierreTurno);
                $("#txtEmailPassword").val(model.passwordEmailEmisorCierreTurno);
                document.getElementById('switchImprimirDefault').checked = model.imprimirDefault;
                document.getElementById('switchControlStock').checked = model.controlStock;
                document.getElementById('switchFacturaElectronica').checked = model.facturaElectronica;
                document.getElementById('switchControlEmpleado').checked = model.controlEmpleado;
                document.getElementById('switchCierreTurno').checked = model.notificarEmailCierreTurno;


                if (model.modificationUser == null)
                    document.getElementById("divModif").style.display = 'none';
                else {
                    document.getElementById("divModif").style.display = '';
                    let dateTimeModif = new Date(model.modificationDate);

                    $("#txtModificado").val(dateTimeModif.toLocaleString());
                    $("#txtModificadoUsuario").val(model.modificationUser);
                }
            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
        })

    fetch("/Ajustes/GetAjusteWeb")
        .then(response => {
            return response.json();
        }).then(responseJson => {
            if (responseJson.state) {

                let model = responseJson.object;

                $("#txtNombreTienda").val(model.nombre);
                $("#txtDireccion").val(model.direccion);
                $("#txtEnvioGratis").val(model.montoEnvioGratis);
                $("#txtAumento").val(model.aumentoWeb);
                $("#txtWhatsApp").val(model.whatsapp);
                $("#txtLunes").val(model.lunes);
                $("#txtMartes").val(model.martes);
                $("#txtMiercoles").val(model.miercoles);
                $("#txtJueves").val(model.jueves);
                $("#txtViernes").val(model.viernes);
                $("#txtSabado").val(model.sabado);
                $("#txtDomingo").val(model.domingo);
                $("#txtFeriados").val(model.feriado);
                $("#txtFacebook").val(model.facebook);
                $("#txtInstagram").val(model.instagram);
                $("#txtTikTok").val(model.tiktok);
                $("#txtTwitter").val(model.twitter);
                $("#txtYouTube").val(model.youtube);

                document.getElementById('switchHabilitarWeb').checked = model.habilitarWeb;

                document.getElementById('switchHabilitarComodin1').checked = model.habilitarComodin1;
                document.getElementById('switchHabilitarComodin2').checked = model.habilitarComodin2;
                document.getElementById('switchHabilitarComodin3').checked = model.habilitarComodin3;
                $("#txtComodin1").val(model.nombreComodin1);
                $("#txtComodin2").val(model.nombreComodin2);
                $("#txtComodin3").val(model.nombreComodin3);

            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
        })

    fetch(`/Ajustes/GetAjustesFacturacion`)
        .then(response => {
            return response.json();
        }).then(responseJson => {
            if (responseJson.state) {
                let model = responseJson.object;

                $("#txtIdAjustesFacturacion").val(model.idAjustesFacturacion);

                $("#cboCondicionIva").val(model.condicionIva);
                $("#txtPuntoVentaCertificado").val(model.puntoVenta);
                $("#txtContraseñaCertificado").val(model.certificadoPassword);

                $("#txtFechaIniCert").val(formatDateToDDMMYYYY(model.certificadoFechaInicio));
                $("#txtFechaCadCert").val(formatDateToDDMMYYYY(model.certificadoFechaCaducidad));
                $("#txtCuilCertificado").val(model.cuit);
                $("#txtNombreArchivo").val(model.certificadoNombre);

                $("#txtNombreTitular").val(model.nombreTitular);
                $("#txtIIBB").val(model.ingresosBurutosNro);
                $("#txtDireccionFacturacion").val(model.direccionFacturacion);

                document.getElementById('switchIsProdEnvironment').checked = model.isProdEnvironment;

                if (model.fechaInicioActividad != null) {
                    let fecha = model.fechaInicioActividad.split('T')[0];
                    $("#txtInicioActividad").val(fecha);
                }

                removeLoading();
            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
        })

    setupPasswordToggle($('#txtCodigoSeguridad'), $('#togglePassword'));
    setupPasswordToggle($('#txtContraseñaCertificado'), $('#togglePasswordCert'));
    setupPasswordToggle($('#txtEmailPassword'), $('#toggleEmailPassword'));

    healthcheck();

})

$("#txtAddEmailsReceptores").on("click", function () {
    let email = $("#txtEmailReceptor").val();

    if (email !== "") {

        let newRow = rowTableFromEmails(email);

        $("#tbEmailsReceptores tbody").append(newRow);

        $("#txtEmailReceptor").val("");
    } else {
        alert("Por favor ingrese un email válido.");
    }
});

$("#tbEmailsReceptores").on("click", ".delete-row", function () {
    $(this).closest("tr").remove();
});

function getEmailsFromTable() {
    let emails = [];

    $("#tbEmailsReceptores tbody tr").each(function () {
        let email = $(this).find("td:first").text();
        emails.push(email);
    });

    return emails.join(";");
}

function loadTableFromEmailsString(emailsString) {
    $("#tbEmailsReceptores tbody").empty();

    if (emailsString != null && emailsString != '') {
        let emailsArray = emailsString.split(";");

        emailsArray.forEach(function (email) {
            let newRow = rowTableFromEmails(email);

            $("#tbEmailsReceptores tbody").append(newRow);
        });
    }

}

function rowTableFromEmails(email) {
    return "<tr class='small-row'>" +
        "<td class='small-cell'>" + email + "</td>" +
        "<td class='fixed-width'><button class='btn btn-danger btn-sm delete-row'>" +
        "<span class='mdi mdi-delete'></span></button></td></tr>";
}


$("#btnCargarCertificado").on("click", function () {

    let password = $("#txtContraseñaCertificado").val();

    if (password.trim() == "") {
        const msg = `Debe completar la contraseña para poder cargar la informacion del certificado.`;
        toastr.warning(msg, "");
        return;
    }

    const inputCertificado = document.getElementById('fileCertificado');

    if (inputCertificado.files.length == 0) {
        const msg = `Debe buscar un certificado.`;
        toastr.warning(msg, "");
        return;
    }

    const formData = new FormData();
    formData.append('Certificado', inputCertificado.files[0]);
    formData.append('password', password);

    showLoading();

    fetch("/Ajustes/UpdateCertificateInformation", {
        method: "PUT",
        body: formData
    }).then(response => {
        removeLoading();
        return response.json();
    }).then(responseJson => {
        if (responseJson.state) {
            let model = responseJson.object;

            $("#txtFechaIniCert").val(formatDateToDDMMYYYY(model.certificadoFechaInicio));
            $("#txtFechaCadCert").val(formatDateToDDMMYYYY(model.certificadoFechaCaducidad));
            $("#txtCuilCertificado").val(model.cuit);
            $("#txtNombreArchivo").val(model.certificadoNombre);

            swal("Exitoso!", "Certificado cargado", "success");
        } else {
            swal("Lo sentimos", responseJson.message, "error");
        }
    }).catch((error) => {
    })

})

$("#btnSave").on("click", function () {


    let checkboxSwitchFacturaElectronica = document.getElementById('switchFacturaElectronica');

    if (checkboxSwitchFacturaElectronica.checked) {

        const inputs = $("input.input-validate-facturacion").serializeArray();
        const inputs_without_value = inputs.filter((item) => item.value.trim() == "")

        if (inputs_without_value.length > 0) {
            const msg = `Si selecciona FACTURA ELECTRONICA, debe completar todos los campos de la sección Facturacion.`;
            toastr.warning(msg, "");
            return;
        }
    }

    let email = $('#txtEmailCierreTurno').val();

    if (email!= '' && !email.endsWith('@gmail.com')) {

        const msg = `El correo del emisor de Cierre de Turno, debe ser de Gmail.`;
        toastr.warning(msg, "");
        return;
    }

    const modelWeb = structuredClone(BASIC_MODEL_AJUSTE_WEB);
    modelWeb["montoEnvioGratis"] = $("#txtEnvioGratis").val();
    modelWeb["aumentoWeb"] = $("#txtAumento").val();
    modelWeb["whatsapp"] = $("#txtWhatsApp").val();
    modelWeb["lunes"] = $("#txtLunes").val();
    modelWeb["martes"] = $("#txtMartes").val();
    modelWeb["miercoles"] = $("#txtMiercoles").val();
    modelWeb["jueves"] = $("#txtJueves").val();
    modelWeb["viernes"] = $("#txtViernes").val();
    modelWeb["sabado"] = $("#txtSabado").val();
    modelWeb["domingo"] = $("#txtDomingo").val();
    modelWeb["feriado"] = $("#txtFeriados").val();
    modelWeb["facebook"] = $("#txtFacebook").val();
    modelWeb["instagram"] = $("#txtInstagram").val();
    modelWeb["tiktok"] = $("#txtTikTok").val();
    modelWeb["twitter"] = $("#txtTwitter").val();
    modelWeb["youtube"] = $("#txtYouTube").val();
    modelWeb["nombre"] = $("#txtNombreTienda").val();
    modelWeb["direccion"] = $("#txtDireccion").val();

    let checkboxSwitchHabilitarWeb = document.getElementById('switchHabilitarWeb');
    modelWeb["habilitarWeb"] = checkboxSwitchHabilitarWeb.checked;

    modelWeb["nombreComodin1"] = $("#txtComodin1").val();
    modelWeb["nombreComodin2"] = $("#txtComodin2").val();
    modelWeb["nombreComodin3"] = $("#txtComodin3").val();

    let habilitarComodin1 = document.getElementById('switchHabilitarComodin1');
    modelWeb["habilitarComodin1"] = habilitarComodin1.checked;
    let habilitarComodin2 = document.getElementById('switchHabilitarComodin2');
    modelWeb["habilitarComodin2"] = habilitarComodin2.checked;
    let habilitarComodin3 = document.getElementById('switchHabilitarComodin3');
    modelWeb["habilitarComodin3"] = habilitarComodin3.checked;

    const model = structuredClone(BASIC_MODEL_AJUSTE);
    model["idAjuste"] = parseInt($("#txtId").val());

    let checkboxSwitchImprimirDefault = document.getElementById('switchImprimirDefault');
    model["imprimirDefault"] = checkboxSwitchImprimirDefault.checked;

    let checkboxSwitchControlStock = document.getElementById('switchControlStock');
    model["controlStock"] = checkboxSwitchControlStock.checked;

    let checkboxSwitchControlEmpleados = document.getElementById('switchControlEmpleado');
    model["controlEmpleado"] = checkboxSwitchControlEmpleados.checked;

    let checkboxSwitchCierreTurno = document.getElementById('switchCierreTurno');
    model["notificarEmailCierreTurno"] = checkboxSwitchCierreTurno.checked;

    let emailsReceptores = getEmailsFromTable();
    model["emailEmisorCierreTurno"] = $("#txtEmailCierreTurno").val();
    model["passwordEmailEmisorCierreTurno"] = $("#txtEmailPassword").val();
    model["emailsReceptoresCierreTurno"] = emailsReceptores;
    model["codigoSeguridad"] = $("#txtCodigoSeguridad").val();
    model["encabezado1"] = $("#txtEncabezado1").val();
    model["encabezado2"] = $("#txtEncabezado2").val();
    model["encabezado3"] = $("#txtEncabezado3").val();
    model["pie1"] = $("#txtPie1").val();
    model["pie2"] = $("#txtPie2").val();
    model["pie3"] = $("#txtPie3").val();
    model["minimoIdentificarConsumidor"] = $("#txtMinimoIdentificarConsumidor").val();
    model["nombreImpresora"] = $("#cboNombreImpresora").val();

    model["facturaElectronica"] = checkboxSwitchFacturaElectronica.checked;

    const modelFacturacion = structuredClone(BASIC_MODEL_AJUSTES_FACTURACION);
    modelFacturacion["idAjustesFacturacion"] = parseInt($("#txtIdAjustesFacturacion").val());

    modelFacturacion["puntoVenta"] = parseInt($("#txtPuntoVentaCertificado").val());
    modelFacturacion["condicionIva"] = parseInt($("#cboCondicionIva").val());
    modelFacturacion["nombreTitular"] = $("#txtNombreTitular").val();
    modelFacturacion["ingresosBurutosNro"] = $("#txtIIBB").val();
    modelFacturacion["direccionFacturacion"] = $("#txtDireccionFacturacion").val();
    modelFacturacion["fechaInicioActividad"] = $("#txtInicioActividad").val();
    modelFacturacion["certificadoPassword"] = $("#txtContraseñaCertificado").val();

    let checkboxSwitchIsProdEnvironment = document.getElementById('switchIsProdEnvironment');
    modelFacturacion["isProdEnvironment"] = checkboxSwitchIsProdEnvironment.checked;

    const inputCertificado = document.getElementById('fileCertificado');

    const formData = new FormData();
    formData.append('modelWeb', JSON.stringify(modelWeb));
    formData.append('modelFacturacion', JSON.stringify(modelFacturacion));
    formData.append('modelAjustes', JSON.stringify(model));
    formData.append('Certificado', inputCertificado.files[0]);

    showLoading();

    fetch("/Ajustes/UpdateAjuste", {
        method: "PUT",
        body: formData
    }).then(response => {
        removeLoading();
        return response.json();
    }).then(responseJson => {
        if (responseJson.state) {

            swal("Exitoso!", "Ajustes fué modificado", "success");
            location.reload()

        } else {
            swal("Lo sentimos", responseJson.message, "error");
        }
    }).catch((error) => {
    })


})
async function healthcheck() {
    isHealthyAjustes = await getHealthcheck();

    if (isHealthyAjustes) {
        getPrintersTienda();
        document.getElementById("lblErrorPrintService").style.display = 'none';
    } else {
        document.getElementById("lblErrorPrintService").style.display = '';
    }
}

async function getPrintersTienda() {
    try {
        let printers = await getPrinters();

        printers.forEach(printer => {
            $("#cboNombreImpresora").append(
                $("<option>").val(printer).text(printer)
            );
        });

    } catch (error) {
        console.error('Error fetching printers:', error);
    }
}

function formatDateToDDMMYYYY(isoDate) {
    if (isoDate == null) {
        return "";
    }

    const date = new Date(isoDate);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

$("#btnPruebaTicket").on("click", function () {
    showLoading()
    fetch(`/Ajustes/PrintTicketTests`,)
        .then(response => {
            return response.json();
        }).then(responseJson => {
            removeLoading();
            if (responseJson.state) {
                swal("Exitoso!", "El ticket de prueba se está imprimiendo", "success");

                if (isHealthyAjustes &&
                    responseJson.object.nombreImpresora != null
                    && responseJson.object.nombreImpresora != ''
                    && responseJson.object.ticket != null
                    && responseJson.object.ticket != '') {

                    printTicket(responseJson.object.ticket, responseJson.object.nombreImpresora, responseJson.object.imagesTicket);
                }

            } else {
                swal("Lo sentimos", responseJson.message, "error");
            }
        })
})