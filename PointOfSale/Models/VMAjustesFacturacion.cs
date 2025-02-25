﻿using PointOfSale.Model.Afip.Factura;
using static PointOfSale.Model.Enum;

namespace PointOfSale.Models
{
    public class VMAjustesFacturacion
    {
        public int IdAjustesFacturacion { get; set; }

        public string? IngresosBurutosNro { get; set; }
        public string? NombreTitular { get; set; }
        public string? DireccionFacturacion { get; set; }
        public DateTime? FechaInicioActividad { get; set; }

        public long? Cuit { get; set; }
        public int? PuntoVenta { get; set; }
        public CondicionIva? CondicionIva { get; set; }
        public string? CertificadoPassword { get; set; }
        public string? CertificadoNombre { get; set; }
        public DateTime? CertificadoFechaInicio { get; set; }
        public DateTime? CertificadoFechaCaducidad { get; set; }

        public int IdTienda { get; set; }

        public DateTime? ModificationDate { get; set; }
        public string? ModificationUser { get; set; }
        public bool IsProdEnvironment { get; set; }

        public VMX509Certificate2 vMX509Certificate2 { get; set; }

    }
}
