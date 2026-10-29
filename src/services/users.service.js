const prisma = require("../db");

const userFields = {
  id: true,
  username: true,
  email: true,
  fullname: true,
  bio: true,
  isPrivate: true,
  createdAt: true,
  updatedAt: true,
};

async function createUser(data) {
  return prisma.user.create({ data, select: userFields });
}

async function listUsers() {
  return prisma.user.findMany({ select: userFields });
}

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: userFields });
}

async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data, select: userFields });
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };
