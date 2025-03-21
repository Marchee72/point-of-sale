﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointOfSale.Business.Contracts;
using PointOfSale.Business.Utilities;
using PointOfSale.Data.Repository;
using PointOfSale.Model;
using PointOfSale.Model.Afip.Factura;
using PointOfSale.Model.Input;
using PointOfSale.Model.Output;
using System.Globalization;
using static iText.IO.Util.IntHashtable;
using static PointOfSale.Model.Enum;

namespace PointOfSale.Business.Services
{
    public class SaleService : ISaleService
    {
        private readonly IGenericRepository<Product> _repositoryProduct;
        private readonly IGenericRepository<Cliente> _repositoryCliente;
        private readonly IGenericRepository<ListaPrecio> _repositoryListaPrecio;
        private readonly IGenericRepository<FacturaEmitida> _repositoryFacturaEmitida;
        private readonly ISaleRepository _repositorySale;
        private readonly ITypeDocumentSaleService _rTypeNumber;
        private readonly IProductService _rProduct;
        private readonly ITurnoService _turnoService;
        private readonly IAfipService _afipService;
        private readonly INotificationService _notificationService;
        private readonly IClienteService _clienteService;
        private readonly IAjusteService _ajustesService;
        private readonly ITicketService _ticketService;

        public SaleService(
            IGenericRepository<Product> repositoryProduct,
            ISaleRepository repositorySale,
            IGenericRepository<Cliente> repositoryCliente,
            ITypeDocumentSaleService rTypeNumber,
            IProductService rProduct,
            ITurnoService turnoService,
            IGenericRepository<ListaPrecio> repositoryListaPrecio,
            IAfipService afipService,
            IGenericRepository<FacturaEmitida> repositoryFacturaEmitida,
            INotificationService notificationService,
            IClienteService clienteService,
            IAjusteService ajusteService,
            ITicketService ticketService)
        {
            _repositoryProduct = repositoryProduct;
            _repositorySale = repositorySale;
            _repositoryCliente = repositoryCliente;
            _rTypeNumber = rTypeNumber;
            _rProduct = rProduct;
            _turnoService = turnoService;
            _repositoryListaPrecio = repositoryListaPrecio;
            _afipService = afipService;
            _repositoryFacturaEmitida = repositoryFacturaEmitida;
            _notificationService = notificationService;
            _clienteService = clienteService;
            _ticketService = ticketService;
            _ajustesService = ajusteService;
        }


        public async Task<List<ListaPrecio>> GetProductsSearchAndIdLista(string search, ListaDePrecio listaPrecios)
        {
            var listaProductos = new List<ListaPrecio>();

            if (listaPrecios == ListaDePrecio.Web)
            {
                var queryProductosWeb = _repositoryProduct.QuerySimple();
                queryProductosWeb = queryProductosWeb.Where(_ => _.IsActive);

                if (search.Contains(' '))
                {
                    var split = search.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var term in split)
                    {
                        var temp = term;
                        queryProductosWeb = queryProductosWeb.Where(p => p.Description.Contains(temp));
                    }
                }
                else
                {
                    queryProductosWeb = queryProductosWeb.Where(p =>
                        p.CodigoBarras.Any(cb => cb.Codigo.Equals(search)) || p.Description.Contains(search));
                }

                var lisProductosWeb = await queryProductosWeb
                    .Include(_ => _.IdCategoryNavigation)
                    .Include(p => p.CodigoBarras)
                    .ToListAsync();

                listaProductos = lisProductosWeb.Select(_ => new ListaPrecio()
                {
                    IdProducto = _.IdProduct,
                    Lista = ListaDePrecio.Web,
                    PorcentajeProfit = 0,
                    Precio = _.PriceWeb.HasValue ? _.PriceWeb.Value : _.Price.Value,
                    Producto = _
                }).ToList();
            }
            else
            {
                var queryListaPrecio = _repositoryListaPrecio.QuerySimple();
                queryListaPrecio = queryListaPrecio.Where(p => p.Lista == listaPrecios && p.Producto.IsActive);

                if (search.Contains(' '))
                {
                    var split = search.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var term in split)
                    {
                        var temp = term;
                        queryListaPrecio = queryListaPrecio.Where(p => p.Producto.Description.Contains(temp));
                    }
                }
                else
                {
                    queryListaPrecio = queryListaPrecio.Where(p =>
                        p.Producto.CodigoBarras.Any(cb => cb.Codigo.Equals(search)) || p.Producto.Description.Contains(search));
                }

                listaProductos = await queryListaPrecio
                    .Include(_ => _.Producto)
                    .ThenInclude(_ => _.IdCategoryNavigation)
                    .Include(_ => _.Producto)
                    .ThenInclude(p => p.CodigoBarras)
                    .ToListAsync();
            }

            return listaProductos;
        }

        public async Task<List<ListaPrecio>> GetProductsSearchAndIdListaWithTags(string search, ListaDePrecio listaPrecios)
        {
            IQueryable<ListaPrecio> queryListaPrecio;

            // Si la búsqueda tiene espacios, dividir términos y crear predicado
            if (search.Contains(' '))
            {
                var split = search.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                var predicate = PredicateBuilder.True<Product>();
                foreach (var term in split)
                {
                    var temp = term;
                    predicate = predicate.And(p => p.Description.Contains(temp));
                }

                // Obtener los productos que coinciden con el predicado
                var idsProdsQuery = await _repositoryProduct.Query(predicate);
                var idsProds = idsProdsQuery.Select(p => p.IdProduct).ToList();

                // Filtrar lista de precios según los productos obtenidos
                queryListaPrecio = await _repositoryListaPrecio.Query(p =>
                    p.Lista == listaPrecios &&
                    p.Producto.IsActive == true &&
                    idsProds.Contains(p.IdProducto));
            }
            else
            {
                // Filtrar por búsqueda directa si no hay espacios
                queryListaPrecio = await _repositoryListaPrecio.Query(p =>
                    p.Lista == listaPrecios &&
                    p.Producto.IsActive == true &&
                    (p.Producto.CodigoBarras.Any(cb => cb.Codigo.Equals(search)) ||
                     p.Producto.Description.Contains(search)));
            }

            // Incluir las relaciones necesarias
            return await queryListaPrecio
                .Include(lp => lp.Producto)
                    .ThenInclude(p => p.IdCategoryNavigation)
                .Include(lp => lp.Producto)
                    .ThenInclude(p => p.CodigoBarras)
                .Include(lp => lp.Producto)
                    .ThenInclude(p => p.ProductTags)
                        .ThenInclude(pt => pt.Tag)
                .ToListAsync();
        }


        public async Task<List<Cliente>> GetClientsByFactura(string search)
        {
            IQueryable<Cliente> query = await _repositoryCliente.Query(p =>
           string.Concat(p.Cuil, p.Nombre, p.Direccion).Contains(search));

            return query.Include(_ => _.ClienteMovimientos).ToList();
        }

        public async Task<List<Cliente>> GetClients(string search)
        {
            IQueryable<Cliente> query = await _repositoryCliente.Query(p => p.IsActive &&
           string.Concat(p.Cuil, p.Nombre).Contains(search));

            return query.Include(_ => _.ClienteMovimientos).ToList();
        }

        public async Task<RegisterSaleOutput> RegisterSale(Sale model, RegistrationSaleInput saleInput)
        {
            var modelResponde = new RegisterSaleOutput();
            Sale sale_created = null;
            try
            {
                var ajustesTask = _ajustesService.GetAjustes(model.IdTienda);
                var lastNumberTask = GetLastSerialNumberSale(model.IdTienda);

                await Task.WhenAll(ajustesTask, lastNumberTask);

                var ajustes = await ajustesTask;
                var lastNumber = await lastNumberTask;

                var paso = false;

                modelResponde.SaleNumber = lastNumber;
                modelResponde.NombreImpresora = saleInput.ImprimirTicket && !string.IsNullOrEmpty(ajustes.NombreImpresora) ? ajustes.NombreImpresora : null;

                foreach (var m in saleInput.MultiplesFormaDePago)
                {
                    var newVMSale = new Sale
                    {
                        Total = m.Total,
                        IdTypeDocumentSale = m.FormaDePago,
                        IdTurno = model.IdTurno,
                        IdTienda = model.IdTienda,
                        RegistrationUser = model.RegistrationUser,
                        SaleNumber = lastNumber,
                        IsWeb = false,
                        Observaciones = model.Observaciones
                    };

                    if (!paso)
                    {
                        newVMSale.DetailSales = model.DetailSales;
                        paso = true;
                    }

                    sale_created = await _repositorySale.Register(newVMSale, ajustes);

                    sale_created.IdClienteMovimiento = await _clienteService.RegistrarionClient(newVMSale.Total.Value, model.RegistrationUser, model.IdTienda, sale_created.IdSale, saleInput.TipoMovimiento, saleInput.ClientId);

                    FacturaEmitida facturaEmitida = null;
                    try
                    {
                        if (ajustes.FacturaElectronica.HasValue && ajustes.FacturaElectronica.Value)
                        {
                            facturaEmitida = await _afipService.FacturarVenta(sale_created, ajustes, saleInput.CuilFactura, saleInput.IdClienteFactura);

                            if (facturaEmitida != null && facturaEmitida.Resultado != "A")
                            {
                                modelResponde.Errores = facturaEmitida.Observaciones;
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        modelResponde.ErrorFacturacion = e.Message;
                    }

                    if (!string.IsNullOrEmpty(modelResponde.Errores))
                    {
                        var notific = new Notifications(sale_created);
                        await _notificationService.Save(notific);
                    }

                    if (saleInput.ImprimirTicket && !string.IsNullOrEmpty(ajustes.NombreImpresora))
                    {
                        var ticket = await RegistrationTicketPrinting(ajustes, sale_created, facturaEmitida);
                        if (ticket != null)
                        {
                            modelResponde.Ticket += ticket.Ticket;
                            modelResponde.ImagesTicket.AddRange(ticket.ImagesTicket);
                        }
                    }

                    if (saleInput.MultiplesFormaDePago.Count == 1)
                    {
                        modelResponde.IdSale = sale_created.IdSale;
                        //modelResponde.TipoVenta = "F" + sale_created.TypeDocumentSaleNavigation.TipoFactura.ToString();
                    }
                    else
                    {
                        modelResponde.IdSaleMultiple += $"{sale_created.IdSale},";
                        //modelResponde.TipoVenta += $"F{sale_created.TypeDocumentSaleNavigation.TipoFactura.ToString()},";
                    }
                }

            }
            catch (Exception ex)
            {
                var mensaje = sale_created != null ? "La venta se ha registrado, pero ha habido un error: \n" : "La venta NO SE ha registrado, ha habido un error: \n";
                modelResponde.Errores = mensaje + ex.ToString();
            }
            return modelResponde;
        }

        private async Task<TicketModel?> RegistrationTicketPrinting(Ajustes ajustes, Sale saleCreated, FacturaEmitida? facturaEmitida)
        {
            if (string.IsNullOrEmpty(ajustes.NombreImpresora))
            {
                return null;
            }

            var ticket = await _ticketService.TicketSale(saleCreated, ajustes, facturaEmitida);
            return ticket;
        }

        public async Task<string> GetLastSerialNumberSale(int idTienda)
        {
            return await _repositorySale.GetLastSerialNumberSale(idTienda, "Sale");
        }

        public async Task<List<Sale>> SaleHistory(string saleNumber, string startDate, string endDate, string presupuestos)
        {
            IQueryable<Sale> query = await _repositorySale.Query(); // Eliminado el await innecesario
            startDate = startDate ?? "";
            endDate = endDate ?? "";

            IQueryable<Sale> result;

            if (!string.IsNullOrEmpty(startDate) && !string.IsNullOrEmpty(endDate))
            {
                DateTime start_date = DateTime.ParseExact(startDate, "dd/MM/yyyy", new CultureInfo("es-PE"));
                DateTime end_date = DateTime.ParseExact(endDate, "dd/MM/yyyy", new CultureInfo("es-PE"));

                result = query.Where(v =>
                    v.RegistrationDate.Value.Date >= start_date.Date &&
                    v.RegistrationDate.Value.Date <= end_date.Date
                )
                .OrderByDescending(_ => _.IdSale)
                .Include(tdv => tdv.TypeDocumentSaleNavigation)
                .Include(dv => dv.DetailSales);

                switch (presupuestos)
                {
                    case "noIncluir":
                        result = result.Where(_ => _.TypeDocumentSaleNavigation.TipoFactura != TipoFactura.Presu);
                        break;
                    case "solamente":
                        result = result.Where(_ => _.TypeDocumentSaleNavigation.TipoFactura == TipoFactura.Presu);
                        break;
                }
            }
            else
            {
                result = query.Where(v => v.SaleNumber.EndsWith(saleNumber))
                .OrderByDescending(_ => _.IdSale)
                .Include(tdv => tdv.TypeDocumentSaleNavigation)
                .Include(dv => dv.DetailSales);
            }

            return await result.ToListAsync(); // Usar ToListAsync para evitar bloquear el hilo
        }

        public async Task<List<Sale>> HistoryTurnoActual(int idTurno)
        {
            IQueryable<Sale> query = await _repositorySale.Query();

            var result = query.Where(v => v.IdTurno == idTurno)
            .OrderByDescending(_ => _.IdSale)
            .Include(tdv => tdv.TypeDocumentSaleNavigation)
            .Include(dv => dv.DetailSales);


            return await result.ToListAsync();
        }

        public async Task<Sale> Detail(string SaleNumber)
        {
            IQueryable<Sale> query = await _repositorySale.Query(v => v.SaleNumber == SaleNumber);

            return query
               .Include(tdv => tdv.TypeDocumentSaleNavigation)
               .Include(dv => dv.DetailSales)
               .First();
        }

        public async Task<Sale> Edit(Sale entity)
        {
            Sale sale_found = await _repositorySale.Get(c => c.IdSale == entity.IdSale);

            sale_found.IdClienteMovimiento = entity.IdClienteMovimiento;

            bool response = await _repositorySale.Edit(entity);

            if (!response)
                throw new TaskCanceledException("Venta no se pudo cambiar.");

            return sale_found;
        }

        public async Task<Sale> AnularSale(int idSale, string registrationUser)
        {
            Sale sale_found = await _repositorySale.Get(c => c.IdSale == idSale);

            sale_found.IsDelete = true;

            bool response = await _repositorySale.Edit(sale_found);

            var facruturasQuery = await _repositoryFacturaEmitida.Query(v => v.IdSale == idSale);
            var facturas = facruturasQuery.ToList();

            foreach (var f in facturas.Where(_ => _.Resultado == "A"))
            {
                await _afipService.NotaCredito(f.IdFacturaEmitida, registrationUser);
            }

            if (!response)
                throw new TaskCanceledException("Venta no se pudo eliminar.");

            return sale_found;
        }

        public async Task<bool> GenerarVentas(int idTienda)
        {

            var tiposVentas = await _rTypeNumber.List();
            var productos = await _rProduct.ListActive();
            var turno = await _turnoService.GetTurnoActual(idTienda);
            //if(turno is null) await _turnoService.Add(new Turno(idTienda, ))
            var random = new Random();
            var cantTipoVentas = tiposVentas.Count;
            var cantproductos = productos.Count;

            if (cantproductos < 4)
            {
                return false;
            }

            try
            {
                for (int i = 0; i < 400; i++) /*1200*/
                {
                    var dia = RandomDayMes();

                    var sale = new Sale();
                    sale.RegistrationDate = dia;
                    await CrearVentaGenerada(idTienda, tiposVentas, productos, turno, random, cantTipoVentas, cantproductos, sale);
                }

                for (int i = 0; i < 50; i++) // ayer y hoy
                {
                    var dia = RandomDayDias();

                    var sale = new Sale();
                    sale.RegistrationDate = dia;
                    await CrearVentaGenerada(idTienda, tiposVentas, productos, turno, random, cantTipoVentas, cantproductos, sale);
                }

                return true;
            }
            catch
            {
                return false;
                throw;
            }
        }

        private async Task CrearVentaGenerada(int idTienda, List<TypeDocumentSale> tiposVentas, List<Product> productos, Turno turno, Random random, int cantTipoVentas, int cantproductos, Sale sale)
        {
            sale.IdTypeDocumentSale = tiposVentas[random.Next(0, cantTipoVentas - 1)].IdTypeDocumentSale;
            sale.IdTienda = idTienda;
            sale.IdTurno = turno.IdTurno;
            sale.IsWeb = false;

            var catProdVenta = random.Next(0, 4);

            var listDet = new List<DetailSale>();

            for (int a = 0; a < catProdVenta; a++)
            {
                var detalle = new DetailSale();
                var p = productos[random.Next(0, cantproductos - 1)];
                if (!listDet.Any(_ => _.IdProduct == p.IdProduct))
                {
                    detalle.IdProduct = p.IdProduct;
                    detalle.CategoryProducty = p.IdCategoryNavigation.Description;
                    detalle.DescriptionProduct = p.Description;
                    detalle.Price = p.Price;
                    detalle.Quantity = random.Next(0, 4);
                    detalle.Total = detalle.Price * detalle.Quantity;
                    listDet.Add(detalle);
                }
            }

            if (listDet.Count() == 0)
            {
                catProdVenta = random.Next(0, 4);

                var detalle = new DetailSale();
                var p = productos[random.Next(0, cantproductos - 1)];
                if (!listDet.Any(_ => _.IdProduct == p.IdProduct))
                {
                    detalle.IdProduct = p.IdProduct;
                    detalle.CategoryProducty = p.IdCategoryNavigation.Description;
                    detalle.DescriptionProduct = p.Description;
                    detalle.Price = p.Price;
                    detalle.Quantity = random.Next(0, 4);
                    detalle.Total = detalle.Price * detalle.Quantity;
                    listDet.Add(detalle);
                }
            }

            sale.Total = listDet.Sum(d => d.Total);
            sale.DetailSales = listDet;
            sale.RegistrationUser = "sarasas";

            if (sale.Total > 0)
                await _repositorySale.Add(sale);
        }

        public DateTime RandomDayMes()
        {
            var diaHoy = TimeHelper.GetArgentinaTime();
            var inicioMes = TimeHelper.GetArgentinaTime().Day - 1;
            var diaInicio = diaHoy.AddDays(-inicioMes).AddMonths(-1);

            var gen = new Random();
            int range = (DateTime.Today - diaInicio).Days;

            var day = diaInicio.AddDays(gen.Next(range)).Date;

            var random = new Random();
            var horas = random.Next(0, 13) + 8;
            var minutos = random.Next(0, 60);

            return day.AddHours(horas).AddMinutes(minutos);
        }
        public DateTime RandomDayDias()
        {
            var diaInicio = TimeHelper.GetArgentinaTime().AddDays(-1);

            var gen = new Random();
            int range = (DateTime.Today - diaInicio).Days;

            var day = diaInicio.AddDays(gen.Next(2)).Date;

            var random = new Random();
            var horas = random.Next(0, 13) + 8;
            var minutos = random.Next(0, 60);

            return day.AddHours(horas).AddMinutes(minutos);
        }

        public async Task<Sale> GetSale(int idSale)
        {
            var query = await _repositorySale.Query(v => v.IdSale == idSale);

            return query.Include(dv => dv.DetailSales).FirstOrDefault();
        }

        public async Task<Sale> Edit(int idSale, int formaPago)
        {
            try
            {
                var sale = await _repositorySale.Get(c => c.IdSale == idSale);

                sale.RegistrationDate = TimeHelper.GetArgentinaTime();
                sale.IdTypeDocumentSale = formaPago;

                bool response = await _repositorySale.Edit(sale);

                if (!response)
                    throw new TaskCanceledException("Sale no se pudo cambiar.");

                return sale;
            }
            catch
            {
                throw;
            }
        }

        public async Task<CorrelativeNumber> CreateSerialNumberSale(int idTienda)
        {
            return await _repositorySale.CreateSerialNumberSale(idTienda);
        }

    }

}

