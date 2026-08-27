import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: ['.env', '../../.env'] });

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ??
    'postgresql://cobuild:cobuild@localhost:5433/cobuild',
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
