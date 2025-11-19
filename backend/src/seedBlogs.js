// backend/src/seedBlogs.js
const Blog = require("./models/Blog");

async function seedBlogs(users) {
  try {
    console.log("📚 Seeding blogs...");

    await Blog.deleteMany();

    const content1 =
      "DevConnect is a platform that helps developers connect, share knowledge, and grow together.";
    const content2 =
      "React and TypeScript together provide a powerful way to build scalable frontends.";

    const blogs = [
      {
        title: "Why I Started Using DevConnect",
        content: content1,
        excerpt:
          content1.length > 180 ? content1.slice(0, 180) + "..." : content1,
        author: users[0].username,
        authorId: users[0]._id,
        views: 5,
      },
      {
        title: "My Journey with React + TS",
        content: content2,
        excerpt:
          content2.length > 180 ? content2.slice(0, 180) + "..." : content2,
        author: users[1].username,
        authorId: users[1]._id,
        views: 2,
      },
    ];

    await Blog.insertMany(blogs);
    console.log("✅ Blogs seeded");
  } catch (err) {
    console.error("❌ Error seeding blogs:", err);
  }
}

module.exports = seedBlogs;
