import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 4000),
  dbUrl: process.env.DATABASE_URL, // single connection string
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES || '7d',
  },
};
