﻿using PointOfSale.Model;
using static PointOfSale.Model.Enum;

namespace PointOfSale.Models
{
    public class VMGastos
    {
        public int IdGastos { get; set; }
        public int IdTipoGasto { get; set; }
        public decimal Importe { get; set; }
        public string? Comentario { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public string? RegistrationUser { get; set; }

        public string? TipoGastoString { get; set; }
        public string? GastoParticular { get; set; }
        public string? ImporteString { get; set; }
        public string? FechaString { get; set; }
        public DateTime? ModificationDate { get; set; }
        public string? ModificationUser { get; set; }
        public decimal? ImporteSinIva { get; set; }
        public decimal? Iva { get; set; }
        public decimal? IvaImporte { get; set; }
        public string? NroFactura { get; set; }
        public string? TipoFactura { get; set; }
        public string? FacturaCompleta { get; set; }
        public EstadoPago? EstadoPago { get; set; }
        public bool FacturaPendiente { get; set; }
        public string? GastoAsignado { get; set; }
    }
}
