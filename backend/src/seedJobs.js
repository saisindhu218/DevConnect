// backend/src/seedJobs.js
const Job = require("./models/Job");

async function seedJobs(users) {
  try {
    console.log("💼 Seeding jobs...");

    await Job.deleteMany();

    const jobs = [
      {
        title: "React Developer",
        company: "Google",
        location: "Hyderabad, India",
        salary: "₹20–30 LPA",
        type: "Full-time",
        tags: ["React", "TypeScript", "Next.js"],
        applyUrl: "https://careers.google.com/jobs/results/",
        posted: "2 days ago",
        createdBy: users[0]._id,
      },
      {
        title: "Backend Engineer",
        company: "Netflix",
        location: "Remote",
        salary: "$140k–$180k",
        type: "Full-time",
        tags: ["Node.js", "AWS", "Microservices"],
        applyUrl: "https://jobs.netflix.com/",
        posted: "1 week ago",
        createdBy: users[1]._id,
      },
    ];

    await Job.insertMany(jobs);
    console.log("✅ Jobs seeded");
  } catch (err) {
    console.error("❌ Error seeding jobs:", err);
  }
}

module.exports = seedJobs;
