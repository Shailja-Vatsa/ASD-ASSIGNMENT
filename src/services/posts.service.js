const prisma = require("../db");

async function createPost(data) {
  return prisma.post.create({ data });
}

async function listPosts() {
  return prisma.post.findMany();
}

async function getPostById(id) {
  return prisma.post.findUnique({ where: { id } });
}

async function updatePost(id, data) {
  return prisma.post.update({ where: { id }, data });
}

async function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}

module.exports = { createPost, listPosts, getPostById, updatePost, deletePost };
