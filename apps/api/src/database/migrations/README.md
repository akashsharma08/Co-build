# Database migrations

Generated TypeORM migrations are stored here. From the repository root:

```bash
pnpm --filter api migration:generate src/database/migrations/DescriptiveName
pnpm --filter api migration:run
```

Never enable `synchronize` outside disposable local experiments. Schema changes should
be represented by reviewed migrations.
