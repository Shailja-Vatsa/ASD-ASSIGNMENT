const svc = require("../services/users.service");

async function create(req, res) {
  const { username, email, fullname, bio } = req.body;
  if (!username || !email || !fullname)
    return res.status(400).json({ error: "username, email and fullname are required" });
  try {
    const user = await svc.createUser({ username, email, fullname, bio: bio ?? null });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === "P2002") return res.status(409).json({ error: "username or email already taken" });
    throw e;
  }
}

async function list(req, res) {
  const users = await svc.listUsers();
  res.status(200).json(users);
}

async function getOne(req, res) {
  const user = await svc.getUserById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

async function update(req, res) {
  const { fullname, bio, isPrivate } = req.body;
  try {
    const user = await svc.updateUser(Number(req.params.id), { fullname, bio, isPrivate });
    res.json(user);
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "User not found" });
    throw e;
  }
}

async function remove(req, res) {
  try {
    await svc.deleteUser(Number(req.params.id));
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "User not found" });
    throw e;
  }
}

module.exports = { create, list, getOne, update, remove };
