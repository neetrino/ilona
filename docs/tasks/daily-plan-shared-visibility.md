# Task: Daily Plan — բոլորը տեսնում են բոլորի պլանները

## Նպատակ

`Daily Plan` բաժնում **Teacher / Admin / Manager** role-ներով օգտվողները պետք է տեսնեն **բոլոր** teacher-ների Daily Plan-ները, ոչ միայն իրենցը։ Search-ով պետք է կարելի լինի գտնել այլ teacher-ի պլանները։

## Ընթացիկ վիճակ (կարճ)

- Frontend էջեր կան երեք role-ի համար.
  - `apps/web/src/app/[locale]/(teacher)/teacher/daily-plan/page.tsx`
  - `apps/web/src/app/[locale]/(admin)/admin/daily-plan/page.tsx`
  - `apps/web/src/app/[locale]/(admin)/manager/daily-plan/page.tsx`
- Shared UI. `DailyPlanListSection`, `DailyPlanCard` (քարտում արդեն երևում է teacher-ի անունը)
- API. `GET /daily-plans` հասանելի է `ADMIN`, `MANAGER`, `TEACHER`
- Query-ում կա `search` և `teacherId`, բայց `search`-ը հիմա փնտրում է topic/resource տեքստով, **ոչ teacher-ի անունով**

## Պահանջներ

### 1. Shared visibility (բոլոր role-ներ)

- Teacher, Admin, Manager — բոլորը մտնելով Daily Plan էջ՝ տեսնում են **բոլորի** պլանները։
- Սեփական պլանները և մյուսների պլանները պետք է երևան **առանձին տեղում** (երկու բաժին / երկու ցուցակ), օրինակ.
  - **My Daily Plans** — ընթացիկ user-ի պլանները (եթե user-ը teacher է / ունի teacher profile)
  - **Others’ Daily Plans** — մնացած բոլոր teacher-ների պլանները
- Admin / Manager-ի համար, եթե իրենք չունեն սեփական Daily Plan գրելու teacher identity, կարող է լինել միայն մեկ ընդհանուր ցուցակ («All Daily Plans») + teacher search/filter — բայց տրամաբանությունը պետք է մնա նույնը. **ամեն մեկը տեսնում է բոլորինը**։

### 2. Search by teacher

- Search input-ով երբ գրվում է teacher-ի անունը (first/last name), արդյունքում պետք է բերվեն **այդ teacher-ի** Daily Plan-ները։
- Ցանկալի է պահել նաև առկա content search-ը (topic/resource), բայց teacher name search-ը պարտադիր է։
- Օպցիոնալ (եթե հարմար է UI-ում). teacher dropdown / chip filter `teacherId`-ով՝ ավելի ճշգրիտ ընտրության համար։

### 3. Permissions (չփոխել ավելորդ)

- **Տեսնել** — բոլորը բոլորին։
- **Ստեղծել / խմբագրել / ջնջել** — մնում է առկա կանոններով (`canEdit` և այլն)։ Մյուսի պլանը view-only է, եթե իրավունք չկա։

## Իրականացման քայլեր

### Backend (`apps/api/src/modules/daily-plan`)

1. Հաստատել, որ `findAll`-ը role-ով չի սահմանափակում ցուցակը միայն սեփական `teacherId`-ով։
2. Ընդլայնել `search`-ը. ներառել teacher-ի `user.firstName` / `user.lastName` (insensitive contains)։
3. Անհրաժեշտության դեպքում ավելացնել query flag կամ երկու response group (օր. `mine` / `others`), **կամ** թողնել frontend-ին բաժանումը `currentTeacherId`-ով։
4. Պահել `teacherId` filter-ը exact filter-ի համար։

### Frontend (`apps/web/src/features/daily-plan` + էջեր)

1. Teacher / Admin / Manager էջերում ցույց տալ բոլոր պլանները։
2. UI-ում առանձնացնել.
   - իր պլանները
   - մյուսների պլանները
3. Search-ը միացնել backend-ի ընդլայնված search-ին (teacher name + content)։
4. Card/list-ում հստակ երևա author teacher-ը (արդեն կա `DailyPlanCard`-ում)։
5. i18n տեքստեր. section titles, search placeholder («Search by teacher or topic…»), empty states։

### QA checklist

- [ ] Teacher A տեսնում է Teacher B-ի plan-ները «Others» բաժնում
- [ ] Teacher B տեսնում է Teacher A-ի plan-ները
- [ ] Admin տեսնում է բոլորինը
- [ ] Manager տեսնում է բոլորինը
- [ ] Search by teacher name բերում է ճիշտ teacher-ի պլանները
- [ ] Ուրիշի plan-ը չի խմբագրվում/ջնջվում առանց իրավունքի
- [ ] Սեփական plan-ի create/edit/delete շարունակում է աշխատել

## Արդյունք (Definition of Done)

Daily Plan էջում Teacher, Admin և Manager բոլորը տեսնում են բոլոր teacher-ների պլանները՝ առանձին բաժիններով, և search-ով կարելի է գտնել որևէ teacher-ի պլանները։
