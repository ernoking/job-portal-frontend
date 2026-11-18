# Frontend monitoring teszt SSH-alagúton

A külön vite.monitoring-test.config.mjs az Oracle-on klónozott frontend
tesztelésére készült. A normál Vite/Vercel konfigurációt nem helyettesíti.
Node.js 24 és a package-lock.json szerinti függőségek szükségesek.

## Előkészítés

A monitoringrepo dokumentációja tartalmazza a fogadó, Prometheus, Grafana
és az ideiglenes localhost CORS-engedély beállítását:
[Oracle SSH-teszt](https://github.com/Csabi179/ai-job-portal-monitoring/blob/feat/service-comparison/docs/FRONTEND_SSH_TEST.md).

A fogadó ideiglenesen engedje pontosan a http://localhost:5173 eredetet,
a meglévő https://www.matchwise.tech mellett. Wildcard nem szükséges.
A fejlesztői szerver 127.0.0.1:5173 címen figyel; nyilvános portot nem nyitunk.
A külön config a /api hívásokat a Render backendhez továbbítja.
A szokásos vite.config.js proxycélja localhost:3000, amely az Oracle-on
a Grafana lenne, ezért ehhez a teszthez a külön configot használjuk.

## Indítás

A frontend gyökerében:

```bash
npm ci
npm run test:telemetry
npm run lint

env VITE_FRONTEND_TELEMETRY_ENABLED=true \
  VITE_FRONTEND_TELEMETRY_URL=https://grafana-r0cecq.duckdns.org/matchwise-telemetry/v1 \
  VITE_USE_MOCK_API=false VITE_USE_MOCK_JOBS=false \
  npm run dev -- --config vite.monitoring-test.config.mjs
```

A változók csak ennek a folyamatnak szólnak. A trafficConfig.js továbbra is
enabled=false és üres endpoint értékkel marad a forrásban.

A saját gépen a szokásos SSH-kapcsolat opciói közé, a célgép elé:
-N -o ExitOnForwardFailure=yes -L 127.0.0.1:5173:127.0.0.1:5173.
A meglévő privátkulcs- és hostbeállításokat tartsd meg; kulcsot nem másolunk.
A saját böngészőben pontosan http://localhost:5173 legyen.

## Ellenőrzés

Az első telemetria egy perc után várható, majd körülbelül percenként újabb POST.
A böngésző háttérben késleltetheti az időzítőt. A fogadó sikeres válasza 204.
Először a Network nézetben a starts/results listákat nézd, majd
az Oracle Prometheus és a Service Comparison dashboard számlálóit/görbéit.

A 2026-11-18-i teszt igazolta:
- 10 frontendteszt, lint és production build sikeres;
- SSH-s oldalbetöltés és ismétlődő 204-es telemetriaküldés;
- 60 másodperces csomagban auth POST és cv GET HTTP 200 események;
- frontend kérésszám, fejlécig mért átlag/becsült P95 a Grafanában;
- backend API-ráta/P95, valamint Supabase tranzakció- és PostgREST-sor kontextus.

Ez a saját Oracle/Vite tesztút, nem a Vercel routing vagy az éles frontend
mérésének igazolása. A mode=real valódi hálózati hívást jelent, nem
bizonyítja, hogy éles felhasználótól származik. A teszt időablakát jegyezd fel.
A frontend és backend számai nem feltétlenül egyeznek a lefedettség,
gyűjtési késés, eltérő indítások/befejezések és kezdeti idősorok miatt.
A böngészős idő a válaszfejlécekig tart; a P95 kosarakból becsült.
Az éles aktiválás és main merge külön felhasználói döntés.

## Leállítás

Ctrl+C a Vite és az SSH-alagút termináljában.
Az Oracle-on a monitoringguide szerint távolítsd el kizárólag a teszthez
telepített 50-local-browser-test.conf drop-int, majd daemon-reload/restart.
A fogadó memóriabeli számlálói újraindításkor nullázódnak, a korábbi
Prometheus-minták megmaradnak. A tesztoldal zárása után elmaradó
frontendjelentések a leállított tesztnek megfelelő állapotot jelentenek.
