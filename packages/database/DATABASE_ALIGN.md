# Database-ը կոդի ընթացիկ վիճակի հետ հավասարեցնելը

## 1. Խորհուրդ տրվող (development, երբ տվյալները կարելի է ջնջել)

Նախ `packages/database` թղթապանակում ես, ապա:

```bash
pnpm run db:reset
```

Սա կջնջի ամբողջ DB-ն, կստեղծի նորից և կթողարկի **բոլոր** migration-ները, որ կան `prisma/migrations`-ում։ Արդյունքում DB-ն 100% կհամապատասխանի ընթացիկ migration ֆայլերին։

**Ուշադրություն:** Բոլոր տվյալները կկորչեն (seed կարող ես հետո `pnpm run db:seed` աշխատացնել, եթե կոնֆիգում կա)։

---

## 2. Երբ migration արդեն կիրառված էր DB-ում, բայց կոդից հանել ես (orphan migration)

Եթե Prisma-ն բողոքում է, որ ինչ-որ migration արդեն կիրառված է, բայց համապատասխան migration ֆայլը repo-ում այլևս չկա, ապա պետք է `_prisma_migrations` աղյուսակից ջնջել այդ migration-ի գրառումը։

1. Բացիր `prisma/migrations/rollback_orphan_migrations.sql`։
2. Չեղարկված `DELETE`-ը բաց (uncomment) արա այն migration name-ի համար, որը orphan է։
3. Այդ SQL-ը աշխատացրու իր DB-ի վրա (psql, Prisma Studio, կամ այլ client)։

Տվյալները մնում են — փոխվում է միայն Prisma-ի «թե որ migration-ները արդեն կիրառված են» ցանկը։

---

## 3. Production

Production-ում **մի** արա `db:reset` (տվյալները կկորչեն)։  
Եթե production DB-ում orphan migration գրառում կա, օգտագործիր միայն 2-րդ variant-ը (DELETE from _prisma_migrations)։
