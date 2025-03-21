﻿using PointOfSale.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PointOfSale.Data.Repository
{
    public interface ISaleRepository : IGenericRepository<Sale>
    {
        Task<Sale> Register(Sale entity, Ajustes ajustes);
        Task<VentaWeb> RegisterWeb(VentaWeb entity);
        Task<string> GetLastSerialNumberSale(int? idTienda, string management);
        Task<Sale> CreatSaleFromVentaWeb(VentaWeb entity, Turno turno, Ajustes ajustes);

        Task<CorrelativeNumber> CreateSerialNumberSale(int idTienda);
    }
}
