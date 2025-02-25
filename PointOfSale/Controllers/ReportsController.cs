﻿using AutoMapper;
using AutoMapper.Configuration.Annotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NuGet.Packaging;
using NuGet.Protocol;
using PointOfSale.Business.Contracts;
using PointOfSale.Model;
using PointOfSale.Model.Output;
using PointOfSale.Models;
using PointOfSale.Utilities.Response;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using static PointOfSale.Model.Enum;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace PointOfSale.Controllers
{
    [Authorize]
    public class ReportsController : BaseController
    {
        private readonly IMapper _mapper;
        private readonly IProductService _productService;
        private readonly IIvaService _ivaService;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(IMapper mapper, IProductService productService, IIvaService ivaService, ILogger<ReportsController> logger)
        {
            _mapper = mapper;
            _productService = productService;
            _ivaService = ivaService;
            _logger = logger;
        }
        public IActionResult ProductsReport()
        {
            ValidarAutorizacion(new Roles[] { Roles.Administrador, Roles.Empleado, Roles.Encargado });
            return ValidateSesionViewOrLogin();
        }

        /// <summary>
        /// Recupera productos para DataTable de reportes
        /// </summary>
        /// <param name="idCategoria"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetProductsReport(string idCategoria, string startDate, string endDate)
        {
            if (idCategoria == null && startDate == null && endDate == null)
            {
                ValidarAutorizacion(new Roles[] { Roles.Administrador, Roles.Empleado, Roles.Encargado });
                return ValidateSesionViewOrLogin();
            }

            var user = ValidarAutorizacion([Roles.Administrador, Roles.Encargado]);

            var prodsDictionary = await _productService.ProductsTopByCategory(idCategoria, startDate, endDate, user.IdTienda);
            var idsProducts = prodsDictionary.Select(_ => _.Key).ToList();
            var products = await _productService.GetProductsByIds(idsProducts);
            var stocks = await _productService.GetStockByProductsByIds(idsProducts, user.IdTienda);
            var listVMSalesReport = new List<VMProductReport>();

            foreach (var p in prodsDictionary)
            {
                var vmSR = new VMProductReport();
                var product = products.First(_ => _.IdProduct == p.Key);
                var listaPrecio = product.ListaPrecios;
                var stock = stocks.FirstOrDefault(_ => _.IdProducto == p.Key);

                vmSR.ProductName = product.Description;
                vmSR.Categoria = product.IdCategoryNavigation.Description;
                vmSR.Precio1 = $"$ {listaPrecio[0].Precio.ToString()}";
                vmSR.Precio2 = $"$ {listaPrecio[1].Precio.ToString()}";
                vmSR.Precio3 = $"$ {listaPrecio[2].Precio.ToString()}";
                vmSR.Cantidad = p.Value;
                vmSR.TipoVenta = product.TipoVenta.ToString();
                vmSR.Costo = "$ " + product.CostPrice.ToString();
                vmSR.Proveedor = product.Proveedor != null ? product.Proveedor.Nombre : string.Empty;
                vmSR.Stock = stock != null ? stock.StockActual.ToString() : "-";

                listVMSalesReport.Add(vmSR);
            }
            return StatusCode(StatusCodes.Status200OK, new { data = listVMSalesReport.OrderBy(_ => _.ProductName) });
        }

        public IActionResult PreciosReport()
        {
            ValidarAutorizacion(new Roles[] { Roles.Administrador, Roles.Empleado, Roles.Encargado });
            return ValidateSesionViewOrLogin();
        }

        /// <summary>
        /// Recupera productos con precios para DataTable de reportes
        /// </summary>
        /// <param name="idCategoria"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetPreciosReport(string idCategoria, string? modificationDate)
        {
            var user = ValidarAutorizacion([Roles.Administrador, Roles.Encargado, Roles.Empleado]);

            var products = await _productService.ProdctuosPreciosByCategory(idCategoria, modificationDate, user.ListaPrecios);
            var productsMapper = _mapper.Map<List<VMProductReport>>(products);

            return StatusCode(StatusCodes.Status200OK, new { data = productsMapper });
        }

        public IActionResult IvaReport()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetFechasReporteIva()
        {
            var gResponse = new GenericResponse<List<DatesFilterIvaReportOutput>>();

            try
            {
                var user = ValidarAutorizacion([Roles.Administrador]);

                gResponse.Object = _ivaService.GetDatesFilterList(user.IdTienda);
                gResponse.State = true;
                return StatusCode(StatusCodes.Status200OK, gResponse);
            }
            catch (Exception ex)
            {
                return HandleException(ex, "Error al recuperar fechas para iva report.", _logger, null);
            }
        }

        public IActionResult LibroIva()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetIvaReport(TipoIvaReport idTipoIva, string date)
        {
            var user = ValidarAutorizacion([Roles.Administrador]);
            GenericResponse<List<VMLibroIvaTotalOutput>> gResponse = new GenericResponse<List<VMLibroIvaTotalOutput>>();

            var splitDate = date.Split('-');
            var start_date = new DateTime(Convert.ToInt32(splitDate[1]), Convert.ToInt32(splitDate[0]), 1);

            DateTime end_date = start_date.AddMonths(1).AddMinutes(-1);

            var list = new List<VMLibroIvaTotalOutput>();
            try
            {
                switch (idTipoIva)
                {
                    case TipoIvaReport.Compra:
                        list = await HandleCompra(user.IdTienda, start_date, end_date);
                        break;
                    case TipoIvaReport.Venta:
                        list = await HandleVenta(user.IdTienda, start_date, end_date);
                        break;
                    case TipoIvaReport.Servicios:
                        list = await HandleServicios(user.IdTienda, start_date, end_date);
                        break;
                }

                gResponse.State = true;
                gResponse.Object = list;
                return StatusCode(StatusCodes.Status200OK, gResponse);
            }
            catch (Exception ex)
            {
                return HandleException(ex, "Error al recuperar iva report.", _logger, null, ("idTipoIva", idTipoIva), ("date", date));
            }
        }

        private async Task<List<VMLibroIvaTotalOutput>> HandleCompra(int idTienda, DateTime start_date, DateTime end_date)
        {
            var listMod = await _ivaService.GetMovProveedoresImports(idTienda, start_date, end_date);

            var list0 = listMod.Where(_ => _.Iva == Convert.ToDecimal(0));
            var listaServ0 = new VMLibroIvaTotalOutput
            {
                Nombre = "proveedores_0",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(list0),
                TotalFacurado = list0.Any() ? list0.Sum(_ => _.Importe) : 0,
                TotalIva = list0.Any() ? list0.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = list0.Any() ? list0.Sum(_ => _.ImporteSinIva) : 0
            };

            var list105 = listMod.Where(_ => _.Iva == Convert.ToDecimal(10.5));
            var listaServ105 = new VMLibroIvaTotalOutput
            {
                Nombre = "proveedores_10.5",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(list105),
                TotalFacurado = list105.Any() ? list105.Sum(_ => _.Importe) : 0,
                TotalIva = list105.Any() ? list105.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = list105.Any() ? list105.Sum(_ => _.ImporteSinIva) : 0
            };

            var list21 = listMod.Where(_ => _.Iva == 21);
            var listaServ21 = new VMLibroIvaTotalOutput
            {
                Nombre = "proveedores_21",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(list21),
                TotalFacurado = list21.Any() ? list21.Sum(_ => _.Importe) : 0,
                TotalIva = list21.Any() ? list21.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = list21.Any() ? list21.Sum(_ => _.ImporteSinIva) : 0
            };

            return new List<VMLibroIvaTotalOutput>() { listaServ0, listaServ105, listaServ21 };
        }

        private async Task<List<VMLibroIvaTotalOutput>> HandleVenta(int idTienda, DateTime start_date, DateTime end_date)
        {
            var listSale = await _ivaService.GetSaleImports(idTienda, start_date, end_date);

            var tiposFactura = System.Enum.GetValues(typeof(TipoFactura)).Cast<TipoFactura>();

            var ventasPorTipoFactura = new List<VMLibroIvaTotalOutput>();

            foreach (var tipoFactura in tiposFactura.Where(_ => _ != TipoFactura.Presu))
            {
                var listaVenta = ConstructVentaListByTipoFactura(listSale, tipoFactura);
                ventasPorTipoFactura.Add(listaVenta);
            }

            return ventasPorTipoFactura;
        }
        private VMLibroIvaTotalOutput ConstructVentaListByTipoFactura(IEnumerable<Sale> listSale, TipoFactura tipoFactura)
        {
            var iva = Convert.ToDecimal("1.21");
            var ventasByTipoFactura2 = listSale.Where(_ => _.TypeDocumentSaleNavigation == null).ToList();

            var ventasByTipoFactura = listSale.Where(_ => _.TypeDocumentSaleNavigation.TipoFactura == tipoFactura).ToList();
            var bruto = ventasByTipoFactura.Any() ? ventasByTipoFactura.Sum(_ => _.Total).Value : 0;
            var totalIva = Math.Round(bruto / iva, 2);
            var totalSinIva = bruto - totalIva;

            if (tipoFactura == TipoFactura.C || tipoFactura == TipoFactura.X)
            {
                totalIva = 0;
                bruto = 0;
            }

            return new VMLibroIvaTotalOutput
            {
                Nombre = "ventas_21",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(ventasByTipoFactura),
                TotalFacurado = Math.Round(bruto, 2),
                TotalIva = Math.Round(totalIva, 2),
                TotalSinIva = Math.Round(totalSinIva, 2)
            };
        }

        private async Task<List<VMLibroIvaTotalOutput>> HandleServicios(int idTienda, DateTime start_date, DateTime end_date)
        {
            var listGastos = await _ivaService.GetGastosImports(idTienda, start_date, end_date);

            var listaMultiple = BuildListaServicios(listGastos);
            var listaGastos = BuildListaGastos(listGastos);

            listaMultiple.AddRange(listaGastos);

            return listaMultiple;
        }

        private List<VMLibroIvaTotalOutput> BuildListaServicios(IEnumerable<Gastos> listGastos)
        {
            var serv = listGastos.Where(_ => _.TipoDeGasto.GastoParticular == TipoDeGastoEnum.Servicios);

            var list21 = serv.Where(_ => _.Iva == 21);
            var listaServ21 = new VMLibroIvaTotalOutput
            {
                Nombre = "servicios_21",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(list21),
                TotalFacurado = list21.Any() ? list21.Sum(_ => _.Importe) : 0,
                TotalIva = list21.Any() ? list21.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = list21.Any() ? list21.Sum(_ => _.ImporteSinIva) : 0
            };

            var list27 = serv.Where(_ => _.Iva == 27);
            var listaServ27 = new VMLibroIvaTotalOutput
            {
                Nombre = "servicios_27",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(list27),
                TotalFacurado = list27.Any() ? list27.Sum(_ => _.Importe) : 0,
                TotalIva = list27.Any() ? list27.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = list27.Any() ? list27.Sum(_ => _.ImporteSinIva) : 0
            };

            return new List<VMLibroIvaTotalOutput>() { listaServ21, listaServ27 };
        }

        private List<VMLibroIvaTotalOutput> BuildListaGastos(IEnumerable<Gastos> listGastos)
        {
            var gast = listGastos.Where(_ => _.TipoDeGasto.GastoParticular == TipoDeGastoEnum.Variable || _.TipoDeGasto.GastoParticular == TipoDeGastoEnum.Fijo);

            var gast21 = gast.Where(_ => _.Iva == 21);
            var listaGastos21 = new VMLibroIvaTotalOutput
            {
                Nombre = "gastos_21",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(gast21),
                TotalFacurado = gast21.Any() ? gast21.Sum(_ => _.Importe) : 0,
                TotalIva = gast21.Any() ? gast21.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = gast21.Any() ? gast21.Sum(_ => _.ImporteSinIva) : 0
            };

            var gast0 = gast.Where(_ => _.Iva == 0);
            var listaGastos0 = new VMLibroIvaTotalOutput
            {
                Nombre = "gastos_0",
                IvaRows = _mapper.Map<List<VMIvaRowOutput>>(gast0),
                TotalFacurado = gast0.Any() ? gast0.Sum(_ => _.Importe) : 0,
                TotalIva = gast0.Any() ? gast0.Sum(_ => _.IvaImporte) : 0,
                TotalSinIva = gast0.Any() ? gast0.Sum(_ => _.ImporteSinIva) : 0
            };
            return new List<VMLibroIvaTotalOutput>() { listaGastos21, listaGastos0 };
        }

    }
}
