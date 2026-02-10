# Network Access Guide (WiFi/Local Network)

Այս ուղեցույցը բացատրում է, թե ինչպես օգտագործել հավելվածը IP հասցեով, որպեսզի նույն WiFi-ի վրա գտնվող այլ սարքերից կարողանաք մուտք ունենալ:

## Quick Start

1. **Ստացեք ձեր IP հասցեն:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
   - Օրինակ: `192.168.1.100`

2. **Restart արեք servers-ները:**
   ```bash
   # Terminal 1 - API Server
   cd apps/api
   npm run start:dev
   
   # Terminal 2 - Next.js Server
   cd apps/web
   npm run dev
   ```

3. **Մուտք գործեք IP հասցեով:**
   - Բացեք browser-ում: `http://192.168.1.100:3000`
   - Frontend-ը ավտոմատ կկապվի `http://192.168.1.100:4000/api`-ին

## Configuration

### Automatic Detection (Recommended)

Հավելվածը ավտոմատ detect է անում API URL-ը ըստ current host-ի:
- Եթե մուտք եք գործում `http://192.168.1.100:3000`, API-ն կլինի `http://192.168.1.100:4000/api`
- Environment variables-ները պարտադիր չեն

### Manual Configuration (Optional)

Եթե ցանկանում եք explicit configuration, ստեղծեք `.env.local` files:

**`apps/web/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:4000/api
```

**`apps/api/.env.local`:**
```env
CORS_ORIGIN=http://localhost:3000,http://192.168.1.100:3000
```

## Features

✅ **Automatic API URL Detection** - Frontend-ը ավտոմատ որոշում է API URL-ը  
✅ **CORS Enabled** - Development-ում բոլոր origin-ները թույլատրված են  
✅ **Network Listening** - Servers-ները listen են անում բոլոր network interface-ների վրա  
✅ **WebSocket Support** - WebSocket-ները նույնպես ավտոմատ detect են անում host-ը

## Troubleshooting

### Cannot access from other devices

1. Ստուգեք, որ երկու servers-ները աշխատում են:
   - API: `http://192.168.1.100:4000/api`
   - Frontend: `http://192.168.1.100:3000`

2. Ստուգեք firewall-ը:
   - Windows: Allow ports 3000 and 4000 in Windows Firewall
   - Mac: System Preferences > Security > Firewall

3. Ստուգեք, որ devices-ները նույն WiFi-ի վրա են

### CORS errors

Development-ում CORS-ը ավտոմատ allow է անում բոլոր origin-ները: Եթե դեռ error-ներ եք ստանում, ստուգեք:
- API server-ը աշխատում է
- `NODE_ENV`-ը `development` է

## Production

Production-ում պետք է:
1. Set `NODE_ENV=production`
2. Configure `CORS_ORIGIN` with specific allowed origins
3. Use HTTPS for security










