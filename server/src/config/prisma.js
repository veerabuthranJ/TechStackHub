const memory = {
  users: [],
  contents: [],
};

const databaseConfigured = Boolean(process.env.DATABASE_URL);

if (databaseConfigured) {
  const { PrismaClient } = require('@prisma/client');
  module.exports = new PrismaClient();
} else {
  const createMemoryUser = (record) => ({
  ...record,
  createdAt: record.createdAt || new Date().toISOString(),
  updatedAt: record.updatedAt || new Date().toISOString(),
});

  const prisma = {
    user: {
      async findUnique({ where }) {
        if (where.email) {
          return memory.users.find((user) => user.email === where.email) || null;
        }
        if (where.id) {
          return memory.users.find((user) => user.id === where.id) || null;
        }
        return null;
      },
      async create({ data }) {
        const user = createMemoryUser({
          id: data.id || `user-${memory.users.length + 1}`,
          googleId: data.googleId,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl || null,
          role: data.role,
        });
        memory.users.push(user);
        return user;
      },
      async update({ where, data }) {
        const index = memory.users.findIndex((user) => user.id === where.id || user.email === where.email);
        if (index === -1) return null;
        memory.users[index] = { ...memory.users[index], ...data, updatedAt: new Date().toISOString() };
        return memory.users[index];
      },
    },
    content: {
      async findMany({ where = {} }) {
        return memory.contents.filter((content) => {
          if (where.title && !content.title.toLowerCase().includes(where.title.contains.toLowerCase())) return false;
          if (where.category && content.category !== where.category.equals) return false;
          if (where.type && content.type !== where.type.equals) return false;
          return true;
        });
      },
      async findUnique({ where }) {
        return memory.contents.find((content) => content.id === where.id) || null;
      },
      async create({ data }) {
        const content = {
          ...data,
          id: data.id || `content-${memory.contents.length + 1}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        memory.contents.push(content);
        return content;
      },
      async update({ where, data }) {
        const index = memory.contents.findIndex((content) => content.id === where.id);
        if (index === -1) return null;
        memory.contents[index] = { ...memory.contents[index], ...data, updatedAt: new Date().toISOString() };
        return memory.contents[index];
      },
      async delete({ where }) {
        const index = memory.contents.findIndex((content) => content.id === where.id);
        if (index === -1) return null;
        const [record] = memory.contents.splice(index, 1);
        return record;
      },
    },
  };

  module.exports = prisma;
}
