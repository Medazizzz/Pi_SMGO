db.users.deleteMany({});
db.users.insertMany([
  {
    username: "admin",
    password: "$2a$10$DCUi01.wLdI9rtDa9KswNuA.0aS5Go3vatThBlXH2VUUv8qnilO2S",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    status: "ACTIVE",
    enabled: true,
    locked: false
  },
  {
    username: "user",
    password: "$2a$10$DCUi01.wLdI9rtDa9KswNuA.0aS5Go3vatThBlXH2VUUv8qnilO2S",
    email: "user@example.com",
    firstName: "Regular",
    lastName: "User",
    role: "USER",
    status: "ACTIVE",
    enabled: true,
    locked: false
  }
]);
print("Users updated successfully!");
db.users.find().pretty();
