# Prenova BackOffice programa

Glede na obseg dela (cca. 5000+ vrstic kode + nove tabele) razdelim implementacijo v 4 zaporedne korake. Po vsakem koraku lahko preverite rezultat.

## 1. Profil TRGOVINA — nov dizajn po Diapozitivu 2

Popolna preoblikovanje home strani profila TRGOVINA tako, da posnema vizualno postavitev z diapozitiva:

- **Zgornji menijski trak** (na celotnem zaslonu): spustni meniji
  - Datoteka, Pogled, Operacije, Poročila, Nastavitve, Pomoč
- **Gridna postavitev gumbov** (4 stolpci) v točno enakem vrstnem redu kot na sliki:
  - Stolpec 1: TrgoBackEnd · (prazno) · (prazno) · Urniki · Klikni-izbiraj naroč. · Reclami qualita
  - Stolpec 2: Otvoritev (zelena) · Zapiranje (oranžna/rdeča) · Dokumenti · Naročila · Kavcije (siva, disabled) · Prodaja Gift Card · Sef · F. Izberi Popust · Neprodano vodič za naročilo (cyan)
  - Stolpec 3: Finančno poročilo · Ponudbe-Akcije · Fakture · Prevzemi · Prejem blag. direk. dob. · Prodaja telefonskih vred. (disabled) · NEW!! Planogramma (rumeno) · K. Izberi Popust
  - Stolpec 4: Inventura · Artikli · Nalepke · Prenos blaga med oddelki · Izhod (modri velik gumb)
- Vsak gumb odpre ustrezni modul (vse stare funkcije ohranjene + povezane)
- Tipografija Tw Cen MT, temna tema BackOffice ostaja

## 2. TrgoBackEnd → Kartice zaposlenih

Ob kliku na **TrgoBackEnd** se odpre nov modul s karticami zaposlenih:
- Lista zaposlenih iz `staff` tabele (kartice s sliko, imenom, vlogo, statusom)
- Klik na kartico → detajl: osebni podatki, dokumenti, dopusti, ure, plača
- Možnost dodajanja/urejanja zaposlenega

## 3. Dva nova profila + popravki obstoječih

### Novi profili (z začasnimi prijavnimi podatki, urejanje preko 00087):

**PRODAJA** (`prodaja@trgovina.si` / `prodaja2026`)
Sidebar: Stranke · Povpraševanja · Ponudbe · Računi · Prodajni koledar · Poročila · Zaloga (read) · Pravice

**KADROVSKA** (`kadrovska@trgovina.si` / `kadr2026`)
Sidebar: Zaposleni · Pogodbe · Dopusti · Bolniške · Delovni čas · Izobraževanja · Ocenjevanja · Plače · Poročila · Pravice

### Popravljeni profili:

**NABAVA**: Naročilnice · Prejeti računi · Povpraševanja · Analitika nabave · Integracija skladišča · Pravice
**RAČUNOVODSTVO**: Izdani/Prejeti računi · Plačila · Glavna knjiga · DDV · Plače · Finančna poročila · Banka · Pravice
**SKLADIŠČE**: Zaloga · Prevzemi · Izdaje · Inventura · Premiki · Loti · Poročila · Integracija prodaje · Pravice
**DIREKTOR**: vsi moduli vseh profilov združeni

### Upravljanje prijavnih podatkov
Nov modul **Uporabniki** v Direktor/00087 profilu — uredi geslo, e-mail, vlogo za vsak profil.

## 4. Implementacija novih/popravljenih modulov

- **Akcije** — promocije s časovnico, popusti na artikle/skupine, izvoz na POS
- **Cenovke** — izbira artiklov + dejansko generiranje PDF (jspdf)
- **Dokumenti** — vsi pod-moduli funkcionalni (Računi izdani/prejeti, Dobavnice, Prevzemnice, Odpremnice, Stornoji)
- **Koda artikla = Šifra artikla** — poenotenje: en SKU stolpec, iskanje po njem v vseh modulih (POS iskanje, Prevzemnica, Inventura, Artikli)

## Tehnične podrobnosti

- **DB migracija**: nove tabele `customers`, `inquiries`, `quotations`, `sales_calendar`, `contracts`, `leave_requests` (extend), `time_records`, `trainings`, `evaluations`, `salaries`, `purchase_orders`, `accounting_entries`, `vat_reports`, `bank_imports`, `warehouse_movements`, `lots`, `promotions`, `price_tags`. Vse z RLS (public read/write — interna aplikacija brez auth.uid).
- **Profili v `profiles` tabeli**: dodaj `prodaja` in `kadrovska` z `is_active=true`.
- **Iskanje po SKU**: posodobi `ProductSearchDialog` in `BlagajnaTab` da iščeta še po `sku`.
- **Routing**: nove komponente `ProdajaProfile.tsx`, `KadrovskaProfile.tsx`, `EmployeeCardsModule.tsx`, `AkcijeModule.tsx`, `CenovkeModule.tsx`, `DokumentiHub.tsx`. Refaktor `BackOfficeDashboard.tsx` na manjše profile-komponente.
- **PDF**: `jspdf` že nameščen, uporabim za Cenovke/Ponudbe/Računi.

## Vrstni red izvedbe

Ker je obseg velik in en odgovor ne more vsega narediti naenkrat, predlagam **sledeč vrstni red v zaporednih sporočilih**:

1. **To sporočilo**: DB migracija (vse nove tabele) + poenotenje SKU/Koda + nova TRGOVINA home stran po Diapozitivu 2 + TrgoBackEnd kartice zaposlenih
2. **Naslednje**: profila PRODAJA in KADROVSKA + modul Uporabniki (urejanje gesel)
3. **Naslednje**: popravki NABAVA/RAČUNOVODSTVO/SKLADIŠČE + DIREKTOR združitev
4. **Zadnje**: Akcije + Cenovke (PDF) + Dokumenti hub

Potrdite plan in začnem s korakom 1.
