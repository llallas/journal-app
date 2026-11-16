const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.entry.deleteMany();

  await prisma.entry.createMany({
    data: [
      {
        title: "Midterm Week Survival Log",
        body: "Spent most of the afternoon at the library trying to connect my React frontend to the Express backend. CORS errors tripped me up for an hour, but getting that first GET request to return real database rows felt great.",
      },
      {
        title: "Sunday Coffee & Reset",
        body: "Grabbed an iced latte and walked the trail for a bit before starting homework. Trying to stay ahead on assignments this week so I am not rushing on Sunday night.",
      },
      {
        title: "Notes on Full-Stack Architecture",
        body: "Key reminder for deployment: React only runs in the browser, so it needs the VITE_API_URL environment variable to know where the live Express server lives. Also never commit the .env file to GitHub.",
      },
      {
        title: "Weekend Plans",
        body: "Need to finish styling the edit view for the journal app, clean up the CSS padding on mobile screens, and double-check that delete confirmation works on the live Render URL.",
      },
    ],
  });

  console.log("Database seeded with starter journal entries!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
