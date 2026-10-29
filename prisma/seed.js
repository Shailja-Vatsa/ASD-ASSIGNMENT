const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

async function seed() {
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await prisma.user.createManyAndReturn({
    data: users.map(({ username, email, fullname, bio, isPrivate, createdAt }) => ({
      username, email, fullname, bio, isPrivate,
      password: "password123",
      createdAt: new Date(createdAt),
    })),
  });

  const userMap = {};
  for (const u of createdUsers) userMap[u.username] = u.id;

  const createdPosts = await prisma.post.createManyAndReturn({
    data: posts.map(({ author, imageUrl, caption, location, createdAt }) => ({
      imageUrl, caption, location,
      authorId: userMap[author],
      createdAt: new Date(createdAt),
    })),
  });

  const postMap = {};
  for (const p of createdPosts) {
    const key = p.imageUrl.split("/")[6];
    postMap[key] = p.id;
  }

  const createdLikes = await prisma.like.createManyAndReturn({
    data: likes.map(({ user, post }) => ({
      userId: userMap[user],
      postId: postMap[post],
    })),
  });

  console.log(`🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.length} likes`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
