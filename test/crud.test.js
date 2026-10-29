const assert = require("node:assert/strict");
const Module = require("node:module");
const { after, before, test } = require("node:test");

let users = [];
let posts = [];
let nextUserId = 1;
let nextPostId = 1;

function prismaError(code) {
  return Object.assign(new Error(code), { code });
}

const userService = {
  async createUser(data) {
    if (users.some((user) => user.username === data.username || user.email === data.email)) {
      throw prismaError("P2002");
    }
    const user = {
      id: nextUserId++,
      isPrivate: false,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    users.push(user);
    return user;
  },
  async listUsers() {
    return users;
  },
  async getUserById(id) {
    return users.find((user) => user.id === id) ?? null;
  },
  async updateUser(id, data) {
    const user = users.find((entry) => entry.id === id);
    if (!user) throw prismaError("P2025");
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) user[key] = value;
    }
    user.updatedAt = new Date();
    return user;
  },
  async deleteUser(id) {
    const index = users.findIndex((user) => user.id === id);
    if (index < 0) throw prismaError("P2025");
    users.splice(index, 1);
  },
};

const postService = {
  async createPost(data) {
    const post = {
      id: nextPostId++,
      authorId: null,
      caption: null,
      location: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    posts.push(post);
    return post;
  },
  async listPosts() {
    return posts;
  },
  async getPostById(id) {
    return posts.find((post) => post.id === id) ?? null;
  },
  async updatePost(id, data) {
    const post = posts.find((entry) => entry.id === id);
    if (!post) throw prismaError("P2025");
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) post[key] = value;
    }
    post.updatedAt = new Date();
    return post;
  },
  async deletePost(id) {
    const index = posts.findIndex((post) => post.id === id);
    if (index < 0) throw prismaError("P2025");
    posts.splice(index, 1);
  },
};

function mockModule(modulePath, exports) {
  const mocked = new Module(modulePath);
  mocked.filename = modulePath;
  mocked.loaded = true;
  mocked.exports = exports;
  require.cache[modulePath] = mocked;
}

mockModule(require.resolve("../src/services/users.service"), userService);
mockModule(require.resolve("../src/services/posts.service"), postService);
const app = require("../src/index");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("user CRUD routes match the assignment contract", async () => {
  users = [];
  nextUserId = 1;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.match(health.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await health.json(), { status: "OK" });

  let response = await fetch(`${baseUrl}/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "missing", email: "missing@example.com" }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "username, email and fullname are required" });

  response = await fetch(`${baseUrl}/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "riya_travels",
      email: "riya@example.com",
      fullname: "Riya Sharma",
      id: 999,
      password: "ignored",
    }),
  });
  assert.equal(response.status, 201);
  const createdUser = await response.json();
  assert.notEqual(createdUser.id, 999);
  assert.equal(createdUser.bio, null);
  assert.equal(createdUser.isPrivate, false);
  assert.equal(Object.hasOwn(createdUser, "password"), false);

  response = await fetch(`${baseUrl}/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "riya_travels", email: "other@example.com", fullname: "Copy Cat" }),
  });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "username or email already taken" });

  response = await fetch(`${baseUrl}/users`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));

  response = await fetch(`${baseUrl}/users/${createdUser.id}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).username, "riya_travels");

  response = await fetch(`${baseUrl}/users/999`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "User not found" });

  response = await fetch(`${baseUrl}/users/999`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullname: "Missing" }),
  });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "User not found" });

  response = await fetch(`${baseUrl}/users/999`, { method: "DELETE" });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "User not found" });

  response = await fetch(`${baseUrl}/users/${createdUser.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullname: "Riya S.", bio: "Travel", isPrivate: true, username: "changed", email: "changed@example.com" }),
  });
  assert.equal(response.status, 200);
  const updatedUser = await response.json();
  assert.equal(updatedUser.fullname, "Riya S.");
  assert.equal(updatedUser.bio, "Travel");
  assert.equal(updatedUser.isPrivate, true);
  assert.equal(updatedUser.username, "riya_travels");
  assert.equal(updatedUser.email, "riya@example.com");

  response = await fetch(`${baseUrl}/users/${createdUser.id}`, { method: "DELETE" });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  response = await fetch(`${baseUrl}/users/${createdUser.id}`);
  assert.equal(response.status, 404);
});

test("post CRUD routes match the assignment contract and extra routes are absent", async () => {
  posts = [];
  nextPostId = 1;

  let response = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caption: "No image" }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "imageUrl is required" });

  response = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://example.com/image.jpg", id: 999, authorId: 50 }),
  });
  assert.equal(response.status, 201);
  const createdPost = await response.json();
  assert.notEqual(createdPost.id, 999);
  assert.equal(createdPost.caption, null);

  response = await fetch(`${baseUrl}/posts`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));

  response = await fetch(`${baseUrl}/posts/${createdPost.id}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).imageUrl, "https://example.com/image.jpg");

  response = await fetch(`${baseUrl}/posts/999`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Post not found" });

  response = await fetch(`${baseUrl}/posts/999`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caption: "Missing" }),
  });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Post not found" });

  response = await fetch(`${baseUrl}/posts/999`, { method: "DELETE" });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Post not found" });

  response = await fetch(`${baseUrl}/posts/${createdPost.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caption: "Updated", location: "Mumbai", imageUrl: "ignored" }),
  });
  assert.equal(response.status, 200);
  const updatedPost = await response.json();
  assert.equal(updatedPost.caption, "Updated");
  assert.equal(updatedPost.location, "Mumbai");
  assert.equal(updatedPost.imageUrl, "https://example.com/image.jpg");

  response = await fetch(`${baseUrl}/posts/${createdPost.id}`, { method: "DELETE" });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  response = await fetch(`${baseUrl}/posts/${createdPost.id}`);
  assert.equal(response.status, 404);

  response = await fetch(`${baseUrl}/posts/${createdPost.id}/likes`);
  assert.equal(response.status, 404);
  response = await fetch(`${baseUrl}/users/999/posts`);
  assert.equal(response.status, 404);
});