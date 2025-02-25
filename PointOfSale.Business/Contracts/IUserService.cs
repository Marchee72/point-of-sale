﻿using PointOfSale.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PointOfSale.Business.Contracts
{
    public interface IUserService
    {
        Task<List<User>> List();
        Task<User> Add(User entity);
        Task<User> Edit(User entity);
        Task<bool> Delete(int idUser);
        Task<(User? Usuario, string? Mensaje)> GetByCredentials(string email, string password);
        Task<User> GetById(int IdUser);

        Task<User> GetByIdWithRol(int IdUser);

        Task<List<User>> GetAllUsers();

        Task<bool> CheckFirstLogin(string email, string password);
        Task<bool> CheckSuperUser(int idUser);
    }
}
