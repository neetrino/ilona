# Vercel-ում Environment Variables-ի կարգավորում (մանրամասն)

Սա այն քայլերն են, որ պետք է անես **Vercel**-ում, որպեսզի site-ը ճիշտ աշխատի production-ում և cold start cron-ը աշխատի։

---

## Նախապատրաստում

Պետք է իմանաս:

1. **Render backend-ի URL** – օրինակ `https://ilona-api.onrender.com` (առանց `/api` վերջում).  
   - Բացել Render Dashboard → քո NestJS service → **Settings** → **Environment** կամ վերևի **URL**.
   - API-ի base URL-ը սովորաբար այդ URL + `/api`, այսինքն `https://ilona-api.onrender.com/api`.

2. **CRON_SECRET** – պատահական երկար string: կստեղծես մի քայլով ցած։

---

## Քայլ 1: Բացել Vercel project-ի Settings

1. Մտիր [vercel.com](https://vercel.com) և login արա։
2. Dashboard-ում ընտրիր **քո project**-ը (Next.js-ը, Ilona web).
3. Վերևի tab-երից ընտրիր **Settings**.
4. Ձախ մենյուից ընտրիր **Environment Variables**.

---

## Քայլ 2: Ավելացնել NEXT_PUBLIC_API_URL

1. **Key** դաշտում գրիր (ճիշտ այսպես):  
   `NEXT_PUBLIC_API_URL`

2. **Value** դաշտում գրիր քո Render backend-ի URL-ը **վերջում `/api`-ով**:  
   Օրինակ՝  
   `https://ilona-api.onrender.com/api`  
   (փոխարինիր `ilona-api`-ն իր Render service name-ով, եթե այլ է)

3. **Environment**-ում նշիր որտեղ ուզում ես, որ աշխատի:
   - **Production** – պարտադիր (live site).
   - **Preview** – ցանկալի (preview deployments).
   - **Development** – optional (Vercel-ի dev-ի համար).

4. Սեղմիր **Save**.

Այս փոփոխականով frontend-ը (browser) և cron route-ը (`/api/cron/warmup`) կիմանան, թե որտեղ է API-ը։

---

## Քայլ 3: Ստեղծել և ավելացնել CRON_SECRET

### 3.1 Secret-ի ստեղծում

Մեկն այս երկուից:

**Տարբերակ A – Terminal (PowerShell / CMD):**

- Բացել terminal project-ի root-ում (կամ ցանկացած թղթապանակում) և գրել:
  ```bash
  openssl rand -hex 32
  ```
- Enter սեղմել: կտեսնես մի երկար string (64 character), օրինակ  
  `a1b2c3d4e5f6...`  
  Ամբողջ string-ը **copy** արա (բացատներ/նոր տողեր մի ավելացնել):

**Տարբերակ B – Առանց openssl:**

- Գնալ [randomkeygen.com](https://randomkeygen.com) (կամ նման site).
- Ընտրել "Code Igniter Encryption Keys" կամ "64 character hex" style key.
- Copy արա մի 64-character (կամ ավելի) hex string:

Օրինակ արժեք (մի օգտագործիր սա, ստեղծիր իր thine):  
`a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0`

### 3.2 Vercel-ում ավելացնել

1. **Environment Variables** էջում (նույն տեղը, որտեղ NEXT_PUBLIC_API_URL ավելացրիր) սեղմիր **Add New** (կամ **Add Another**).

2. **Key:**  
   `CRON_SECRET`

3. **Value:**  
   Paste արա այն պատահական string-ը, որ copy արել ես (առանց բացատների, մի տող):

4. **Environment:**  
   Նշիր **Production** (և ցանկության դեպքում **Preview**).

5. Սեղմիր **Save**.

Նշանակում: Vercel-ը ամեն 10 րոպե cron-ով կանչում է `/api/cron/warmup` և **ավտոմատ** այդ request-ի մեջ ավելացնում է `Authorization: Bearer <CRON_SECRET>`: Մեր route-ը ստուգում է, որ header-ը ճիշտ լինի, այդպես միայն Vercel Cron-ը կարող է հաջող կանչ անել:

---

## Քայլ 4: Redeploy (անհրաժեշտության դեպքում)

- Environment variable-ներ ավելացնելուց հետո **նոր deploy** պետք է, որ արժեքները կիրառվեն:
- Vercel-ը հաճախ ինքը նոր deploy է սկսում; եթե չես տեսնում, **Deployments** tab-ում **Redeploy** արա վերջին deployment-ի վրա (⋯ → Redeploy):

---

## Ստուգում

1. **Site:** Բացել production URL (օր. `https://your-app.vercel.app`), login/API-ով էջեր բացել – request-երը պետք է գնան Render backend:
2. **Cron:** 10 րոպե սպասել, Render Dashboard → Logs: պետք է տեսնես `GET /warmup` (կամ `/api/warmup`) request-եր ամեն ~10 րոպե:
3. **CRON_SECRET:** Browser-ում բացել `https://your-app.vercel.app/api/cron/warmup` – պետք է ստանաս **401 Unauthorized** (որովհետև browser-ը Bearer token չի ուղարկում): Դա նշանակում է, որ endpoint-ը պաշտպանված է:

---

## Ամփոփ աղյուսակ (Vercel Environment Variables)

| Key | Value | Նշանակություն |
|-----|--------|-----------------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` | Frontend + cron-ը գիտեն backend-ի հասցեն |
| `CRON_SECRET` | պատահական 64-char string (openssl rand -hex 32) | Միայն Vercel Cron-ը կարող է կանչել /api/cron/warmup |

Եթե **BACKEND_URL**-ը չես դնում, խնդիր չկա – cron route-ը կօգտագործի `NEXT_PUBLIC_API_URL`-ը:
