# Frontend API-forgalom mérése

Állapot: fejlesztési implementáció; az Oracle-fogadó és az éles bekötés még nincs kész.
A mérés alapértelmezetten kikapcsolt. Main összevonás nincs.

## Cél és adatút

A böngészőben induló valódi API-hívások külön mérését készítjük elő,
hogy a frontend, a Render backend és a Supabase aktivitását összevethessük.
Ez nem teljes Vercel access log, és nem látja a közvetlen backendhívásokat.

Üzleti út: böngésző -> Vercel /api -> Render -> Supabase.
Tervezett mérési út: böngészős összesítés -> Oracle HTTPS-fogadó -> Prometheus -> Grafana.
A fogadó még nem létezik ebben a frontendváltoztatásban.

## Bekapcsolás és visszaállítás

A src/monitoring/trafficConfig.js nyilvános konfigurációját Gitben lehet módosítani,
Vercel-felületi hozzáférés nélkül. A fogadó ellenőrzése után:

```js
export const trafficConfig = Object.freeze({
  enabled: true,
  endpoint: 'https://ELLENORZOTT-ORACLE-HOST/ELLENORZOTT-FOGADO-UTVONAL',
});
```

Ez példa, nem működő fogadócím. Addig enabled=false és üres endpoint marad.
Kikapcsolás: enabled=false, új build/deploy. Az üzleti API tovább működik.
Ha beállították őket, a buildidejű VITE_FRONTEND_TELEMETRY_ENABLED és
VITE_FRONTEND_TELEMETRY_URL felülírja a fájl értékeit. A VITE-változók nyilvánosak;
titkos kulcsot egyik beállításba sem szabad tenni.
Csak HTTPS-cím, felhasználónév, jelszó, query string és fragment nélkül használható.

A felhasználó szerint automatikus deploy van. A deployt indító ágak és a preview
viselkedése nincs igazolva; a fejlesztési ág nem jelent igazolt éles telepítést.
Az engedélyezés külön telepítési lépés a fogadó elkészülte után.

## Időzítés és lefedettség

- Böngészőlaponként egy 60 000 ms-os időzítő; az első küldés is egy perc után.
- Nincs lapbezáráskor vagy háttérbe kerüléskor indított külön küldés.
- A böngésző késleltetheti a háttérben futó időzítőt. A percenkénti beállítás
  nem garantál pontos falióra szerinti kézbesítést.
- A main.jsx egyszer indítja a gyűjtőt, a React komponenseken kívül.
  A fejlesztői HMR a régi időzítőt leállítja.
- A request()/apiFetch segéden átmenő fetch-hívásokat méri. A mock kód
  hálózat nélküli eredményeit, a segédet megkerülő fetch-eket és az oldal
  statikus erőforrásait nem számolja.
- A /health és /api/health hívások ki vannak zárva.
- Üres üzleti számlálókkal is megy életjel, amíg az adott lap fut.
  Az életjelek száma nem megbízható felhasználó- vagy sessionszám.

## Későbbi elemzéshez előkészített adatok

A schema_version=1 csomag tartalma:

| Mező | Jelentés |
| --- | --- |
| batch_id | Véletlen csomagazonosító az újraküldések kiszűréséhez; nem sessionazonosító |
| window_start_ms, window_end_ms | A számlálók böngészőóra szerinti időablaka |
| interval_ms | 60 000; a beállított küldési periódus |
| mock_api, mock_jobs | A build mock kapcsolóinak állapota; a lefedettség értelmezéséhez |
| inflight | Az adott lapon éppen függő mért fetch-ek száma, pillanatkép |
| starts | Indítások: route, method, count |
| results | Befejezések: route, method, outcome, status, count és időadatok |
| duration_limits_ms | A diszjunkt időtartamkosarak felső határai |
| delivery | Korábbi sikeres csomagok, hibás küldési kísérletek, eldobott csomagok és megfigyelések száma |

A fix route-csoportok: auth, jobs, cv, profile, preferences, me, other.
Az URL-ekből csak ezt az engedélyezett csoportot tartjuk meg.
Az HTTP-metódusok: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, OTHER.
Pontos HTTP-státusz 100–599 között; egyéb HTTP-státusz: other.
Külön outcome: http, network_error, aborted. Utóbbi kettő status=0;
ez nem HTTP 0 válasz és nem bizonyít backendhibát.

A timing=fetch_response_headers: a fetch indításától a válaszfejlécek
rendelkezésre állásáig tartó, performance.now()-val mért böngészős idő.
Nem tartalmazza a teljes választest letöltését és a JSON-feldolgozást;
nem kizárólag backend-feldolgozási idő. Hibánál a fetch elutasításáig mér.
Soronként: duration_sum_ms, duration_max_ms, duration_bins.
A kosarak határai: 100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000 ms,
majd egy utolsó, 60 másodperc feletti kosár. A kosarak diszjunktak;
Prometheus-hisztogramhoz a fogadón kumulatívvá kell alakítani őket.
Az egyórásnál nagyobb mért idő egy órára korlátozott.
Az átlagból és a kosarakból később lassulás és közelítő percentilis számolható.
Több lap maximumaiból átlagos vagy globális percentilis nem számolható.

Az indítás és a befejezés külön ablakba eshet. A start és result sorok
száma ezért nem feltétlenül egyezik; ezt az inflight is segít értelmezni.
Az inflight értékeket nem szabad a fogadón folytonosan összeadni.

## Korlátozott küldés és fogadószerződés

- Közvetlen POST, a mért segéd megkerülésével; nem termel önmagát mérő forgalmat.
- text/plain;charset=UTF-8 törzsben UTF-8 JSON; CORS mód, credentials=omit,
  referrerPolicy=no-referrer, redirect=error. Nincs auth token, cookie vagy referer.
- A fogadó sikeres átvételt 204-gyel jelez; egy általános HTML 200 nem siker.
- Nyolc másodperces küldési timeout; legfeljebb egy küldés van folyamatban.
- A csomag legfeljebb három kísérletet kap, kizárólag a következő percenkénti
  időzítéseknél. Ugyanaz a batch_id és ugyanaz a törzs kerül újraküldésre.
- Eközben az új mérések külön összesítőben maradnak. Siker vagy eldobás után
  a következő időzítés továbbítja őket. Így a tényleges ablak hosszabb is lehet.
- Nincs tartós böngészőtár, végtelen csomagsor vagy lapbezáráskor küldési garancia.
- Legfeljebb 128 eredménysor egy aktív összesítőben; az új, ezen felüli
  kombinációk dropped_observations számlálót növelnek. Az indítások külön megmaradnak.
- Legfeljebb 60 000 bájtos törzs; nagyobb csomag eldobva, számlálva.
- A delivery számlálók a lap megnyitása óta kumulatívak, pillanatképek;
  ezeket sem szabad minden jelentésnél összeadni. A fogadó saját beérkezési
  számlálókat is vezessen. Az utolsó elveszett csomag veszteségjelzése is elveszhet.

A fogadón szükséges: verzió- és sémaellenőrzés, érték- és méretkorlát,
engedélyezett origin, terhelési korlát, korlátozott idejű batch_id-duplikációszűrés,
a feldolgozás utáni 204 válasz, belső Prometheus-elérés.
A CORS nem hitelesítés; a böngészőből küldött adatok meghamisíthatók.
A fogadó és a proxy ne naplózzon IP-címet vagy nyers törzset.

## Adatértelmezés és adatvédelem

Nincs felhasználóazonosító, sessionazonosító, IP-cím, teljes útvonal,
query string, URL-paraméter, fejléc, token, kérés-/választörzs vagy hibaüzenet
a jelentésben. Az Oracle technikailag megkapja a hálózati kapcsolatot;
az IP-cím naplózását ott is külön ki kell kapcsolni/ellenőrizni.

A hiányzó telemetria nem nulla forgalom. Lapbezárás, blokkolás, offline állapot,
mock mód, cache, közvetlen backendhívás és eltérő időablak is okozhat eltérést.
A fogadó kiesése nem változtathatja meg az üzleti API-kérések eredményét.
A meglévő JSON-feldolgozás, 204-kezelés, ApiError és 401 kijelentkeztetés megmarad.
Kezdetben közös grafikonokat készítünk, összetett riasztást nem kapcsolunk be.

## Ellenőrzés

```bash
node --test tests/apiTraffic.test.js
npm run lint
npm run build
```

A tesztek ellenőrzik az opt-int, a 60 másodperces időzítőt, az adatvédelmet,
a számlálókat és kosarakat, a hibákat/megszakítást, a korlátozott memóriát,
az újraküldést, a timeoutot, a párhuzamos kéréseket és a meglévő HTTP-viselkedést.
Nem bizonyítják az Oracle-fogadást, a teljes adatút működését vagy az éles
frontend mért lefedettségét; ezek külön telepítési próbát igényelnek.
