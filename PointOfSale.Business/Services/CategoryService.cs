﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using PointOfSale.Business.Contracts;
using PointOfSale.Business.Utilities;
using PointOfSale.Data.Repository;
using PointOfSale.Model;

namespace PointOfSale.Business.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IGenericRepository<Category> _repository;
        private readonly IAuditoriaService _auditoriaService;

        public CategoryService(IGenericRepository<Category> repository, IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _auditoriaService = auditoriaService;
        }

        public async Task<Category> Get(int idCategory)
        {
            return await _repository.Get(p => p.IdCategory == idCategory);

        }

        public async Task<List<Category>> GetMultiple(int[] idCategorys)
        {
            var catList = new List<Category>();
            foreach (var c in idCategorys)
            {
                catList.Add(await _repository.Get(p => p.IdCategory == c));
            }
            return catList;
        }

        public async Task<List<Category>> List()
        {
            IQueryable<Category> query = await _repository.Query();
            return query.OrderBy(_ => _.Description).ToList();
        }

        public async Task<List<Category>> ListActive()
        {
            IQueryable<Category> query = await _repository.Query(_ => _.IsActive.HasValue ? _.IsActive.Value : false);
            return query.OrderBy(_ => _.Description).ToList();
        }
        public async Task<Category> Add(Category entity)
        {
            Category category_created = await _repository.Add(entity);
            if (category_created.IdCategory == 0)
                throw new TaskCanceledException("Categoria no se pudo crear.");

            return category_created;
        }

        public async Task<Category> Edit(Category entity)
        {
            Category category_found = await _repository.Get(c => c.IdCategory == entity.IdCategory);

            //_auditoriaService.SaveAuditoria(category_found, entity);

            category_found.Description = entity.Description;
            category_found.IsActive = entity.IsActive;
            category_found.ModificationDate = TimeHelper.GetArgentinaTime();
            category_found.ModificationUser = entity.ModificationUser;

            bool response = await _repository.Edit(category_found);

            if (!response)
                throw new TaskCanceledException("Categoria no se pudo cambiar.");

            return category_found;
        }

        public async Task<bool> Delete(int idCategory)
        {
            Category category_found = await _repository.Get(c => c.IdCategory == idCategory);

            if (category_found == null)
                throw new TaskCanceledException("La categoria no existe");


            bool response = await _repository.Delete(category_found);

            return response;
        }

        public async Task<List<Category>> GetCategoriesSearch(string search)
        {
            IQueryable<Category> query = await _repository.Query(p =>
                       p.IsActive == true && p.Description.Contains(search));

            var s = query.OrderBy(_ => _.Description).ToList();
            return s;

        }
    }
}
