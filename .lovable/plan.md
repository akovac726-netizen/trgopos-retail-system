## Obseg dela

To je obsežna nadgradnja, ki spreminja arhitekturo podatkov (ločene zaloge), doda več novih tabel in implementira ~15 različnih funkcionalnih modulov. Razdelil sem v 7 sklopov.

---

### 1. Baza podatkov (migracija)

Nove tabele v Supabase:
- `locations` — poslovne enote (PE) + glavno skladišče (GL_SKL). Polja: name, type (pe|gl_skl), address, active.
- `location_stock` — zaloga po lokaciji: location_id, product_id, stock, min_stock. (Ločene zaloge PE od GL_SKL.)
- `dispatches` (odpremnice) — ko GL_SKL odpošlje naročilo PE: from_location, to_location, items[], status (pripravljeno|poslano|prejeto), created_at, related_order_id.
- `auth_codes_dynamic` — koda blagajne, ki se menja ob otvoritvi/vnosu partnerja: code, valid_from, reason, created_by.
- `cashier_closings_detail` — zaključki blagajn z razčlenitvijo po vrsti plačila: register_id, date, cash, visa, master, diners, amex, total, operator.
- `employee_documents` — slike/dokumenti zaposlenih: employee_id, type, file_url.
- `product_images` — slike artiklov: product_id, image_url, sort.
- `equipment` — oprema (skenerji, samoplačilske blagajne): name, type, location_id, serial, status.
- `students` — študenti (ločeno od employees): first_name, last_name, faculty, hourly_rate, location_id.
- razširitev `leave_requests`: dodaj `requested_by_id`, `assigned_approver_id` (FK na employees).

Vse z RLS politikami (public read/write — interni sistem brez Supabase auth).

---

### 2. POS — Glavni meni redesign

V `POSTerminalApp` / Glavni meni dodaj nov tab **Računi** PRED **Zaključek**, ki prikazuje točno layout iz `image.png`:
- Levo: dnevna evidenca izdanih računov (tabela: Št. računa, Datum, Blagajnik, Znesek, FuRS).
- Desno: "Iskanje računa" — polja Za dan + Račun št. + numerični keypad + Potrdi/Prekliči.
- Spodaj akcijski gumbi: Pregled računa, Tiskaj račun, Najdi račun, Izpiši fakturo, Kopiraj v nov, **Storniraj račun** (rdeč).
- Storno računov se beleži v ločeno evidenco — **NE** kot lastna raba/odpis.

**Nastavitve** v glavnem meniju: dostop omejen na profil **STANDBUY**; omogoča spremembo vrste blagajne, številke blagajne in odklep zaključene blagajne.

---

### 3. POS — Avtorizacijska koda

Koda blagajne (trenutno fiksna 80175) postane dinamična: zamenja se ob:
- vsaki otvoritvi poslovanja (jutranji "open business day"),
- vnosu novega partnerja.

Nova koda se generira (5-mestna), zapiše v `auth_codes_dynamic`, prikaže direktorju/admin profilu.

---

### 4. BackOffice — polna funkcionalnost vseh "v pripravi" modulov

Vsak placeholder ("Modul je pripravljen za polno implementacijo…") zamenjam s pravo UI in CRUD logiko, povezano s Supabase:

- **Diap. 33-35 Urnik**: Delovne ure (vnos), Urnik zaposlenih (tedenski razpored s tabelo PON–NED, sešteti dnevne ure), Evidence delovnega časa (filter obdobje + zaposleni + export PDF/Excel).
- **Diap. 36-37 Zaključevanje**: gumb "Zaključi blagajne" → potrdilno okno "Ali ste pripravljeni zaključiti? Da/Ne" → izvede zaključek aktivnih registrov.
- **Diap. 38-39 Pregled zaključkov**: tabela ključ dokumenta / datum / stranka / znesek / uporabnik + klik na vrstico odpre detajlni pregled (Način plačila, Operater, Naziv identa, Davek, Št. računa) z gumbom Natisni.
- **Diap. 40 Inventura**: Seznam inventur, Nova inventura, Ustvari inventuro (CRUD + lista artiklov s količinami).
- **Finančna poročila → SKUPNI PROMET**: za vsako blagajno vnos prometa po karticah (Visa, Master, Diners, Amex, Drugo) + Gotovina + samodejni seštevek; vsi prejšnji zaključki vidni v tabeli.
- **Dokumenti**: vsa bela vnosna polja → spustni meniji (artikli iz katalog, razlogi iz seznama, zaposleni iz seznama, partnerji iz seznama).
- **Naročila → Pripravi naročilo**: korak 1 izbira **Dobavitelji** → vključno z opcijo **GL. SKLADIŠČE** (za PE). Profil GL_SKL ne vidi GL_SKL kot opcije, mora izbrati pravega dobavitelja (obstoječ ali nov).
- **Otvoritvena orodja (7 korakov)**: vsak korak (Preveri konec ponudbe, Prevzemi začetek ponudbe, Izvleček prodajnih cen, Natisni etikete, Izvleček sprememb, Širjenje/Posodobitev blagajne) zares generira ustrezno PDF poročilo (jsPDF + autotable) in ga ponudi za prenos.
- **Cenovke**: izbira artiklov (multi-select tabela) + gumb "Pripravi cenovke" → generira PDF (layout zaenkrat preprost, dodelamo kasneje).

---

### 5. BackOffice — Artikli & Skladišče

- **Šifra artikla** (sku/code) postane urejeno polje za profil **Skladišče** (lahko ročno vnese/popravi).
- **Slike artiklov**: skladišče lahko naloži slike v `product_images` (Supabase Storage bucket `product-images`). Kartica artikla (vizitka) prikaže galerijo.
- **Ločene zaloge**: ob prikazu zaloge se filtrira po lokaciji uporabnika. Profil Skladišče vidi vse lokacije v dropdown filtru.
- **Workflow odpremnice**:
  1. PE pošlje naročilo → status `oddano` (`from_profile=PE`, `to_profile=GL_SKL`).
  2. Skladišče v BackOffice vidi prejeta naročila → klik "Ustvari odpremnico" → izbere artikle/količine → status `poslano`.
  3. PE v svojem BackOffice vidi prispelo odpremnico → "Potrdi prejem" → artikli se z `dispatches.items` vpišejo v `location_stock` (povečanje zaloge PE) in zmanjšajo zalogo GL_SKL.

---

### 6. TrgoBackEnd

- Zgornji zavihki: **Zaposleni | Študenti | Oprema** (skenerji + samoplačilske blagajne).
- Tabela vseh zaposlenih (vsi iz `employees`). Klik na vrstico → **Kartica zaposlenega** (modal/stran):
  - Osebni podatki, kontakt, EMŠO, IBAN, položaj, datum zaposlitve, dokumenti (slike), zgodovina dopustov.
- **Dopust workflow**:
  - Zaposleni v kartici klikne "Oddaj zahtevek za dopust".
  - V obrazcu obvezno polje **"Bo odobril:"** = dropdown vseh zaposlenih z vlogo direktor/manager/nadrejeni.
  - Zahtevek se shrani z `assigned_approver_id`.
  - V profilu izbranega odobritelja (Direktor) se v zavihku "Zahtevki za dopust" prikažejo čakajoči zahtevki z gumboma **Odobri / Zavrni**.
  - Status se posodobi v `leave_requests.status`.

---

### 7. Tehnične opombe

- Nove dependencyje: `jspdf`, `jspdf-autotable` (PDF generiranje) — če še niso instalirane.
- Storage bucket: `product-images` (public read), `employee-documents` (public read; lahko kasneje zaklenemo).
- Vse povezave skozi `@/integrations/supabase/client`.
- Stil: nadaljujem z obstoječim "bubbles" temnim dizajnom BackOffice (Tw Cen MT) — sidebar z spustnimi skupinami ostane, dodam smiselne podzavihke kot na slikah Diap. 33-40.
- Avtentikacija: ostane lokalni profilni model (brez Supabase Auth) — kot dosedaj.

---

### Vrstni red izvedbe

1. Migracija baze (vse nove tabele + RLS + storage bucketi).
2. POS: Računi tab + Nastavitve restrikcija + dinamična koda.
3. BackOffice: Skupni promet, Otvoritvena orodja PDF, Cenovke PDF.
4. BackOffice: Urnik (3 podzavihki), Zaključevanje, Pregled zaključkov, Inventura.
5. BackOffice: Dokumenti → spustni meniji, Naročila → GL_SKL workflow + odpremnice.
6. BackOffice: Artikli — šifra editable za skladišče, slike, ločene zaloge.
7. TrgoBackEnd: zaposleni/študenti/oprema + kartica zaposlenega + dopust workflow.

### Vprašanje

Obseg je velik (~10–15 novih komponent + migracija + 8 novih tabel). Lahko poženem **vse v eni iteraciji** (kot prej), ali pa razdelim na 2 dele (najprej baza + POS + BackOffice modul1-3, nato modul4-7). Glede na pretekle zahteve domnevam **vse hkrati** — če ne želiš tako, potrdi.