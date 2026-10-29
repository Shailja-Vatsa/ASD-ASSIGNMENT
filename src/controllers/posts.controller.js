const svc = require("../services/posts.service");

async function create(req, res) {
  const { imageUrl, caption, location } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

  const post = await svc.createPost({ imageUrl, caption: caption ?? null, location: location ?? null });
  res.status(201).json(post);
}

async function list(req, res) {
  const posts = await svc.listPosts();
  res.status(200).json(posts);
}

async function getOne(req, res) {
  const post = await svc.getPostById(Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
}

async function update(req, res) {
  const { caption, location } = req.body;
  try {
    const post = await svc.updatePost(Number(req.params.id), { caption, location });
    res.json(post);
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "Post not found" });
    throw e;
  }
}

async function remove(req, res) {
  try {
    await svc.deletePost(Number(req.params.id));
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "Post not found" });
    throw e;
  }
}

module.exports = { create, list, getOne, update, remove };
