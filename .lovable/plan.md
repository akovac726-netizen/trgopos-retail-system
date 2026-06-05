
## 1. Otvoritev – klikljivi koraki + potrditveno okno
- Vsak od 7 korakov v `OtvoritevDialog.tsx` postane klikljiv (gumb v vrstici "Funkcija").
- Klik odpre majhno potrditveno okno (točno po sliki Diapozitiv47): naslov "Otvoritev", besedilo "Ali ste prepričani, da želite nadaljevati?", gumba **SI** / **NEIN**. Klik SI = korak označen kot izveden + odpre poročilo/akcijo (npr. izvleček cen, tiskanje etiket, posodobitev blagajne) – uporabili bomo obstoječe dialoge/PDF generatorje, kjer obstajajo, sicer placeholder PDF poročilo o prejšnji akciji.

## 2. Skupni "DocumentDialog" (Vračilo / Naročilo / Prevzem)
Nov komponent `src/components/backoffice/retro/DocumentDialog.tsx` po Diapozitiv22/23/24:
- **Glava**: Interna koda (številka poslovalnice, auto iz profila), Št. dokumenta (zaporedna, auto), Datum (today, auto), Naziv, Naslov (dropdown lokacij), Status dok. (▮ rdeč = Odprto, zelen = Zaprto), Št. dok. (free-text, **dovoljene črke**, default VRAČILO/Naročilo/Prevzem), Datum dok. (ročni vnos).
- **Podrobnosti**: input "Koda artikla" (EAN), "Kosi" (količina) – Enter doda vrstico v tabelo (Vrsta, Koda, Naziv, Paket, Količina, Skupna vrednost, Popust, Cena). Klik na vrstico = temno modro označena.
- **Spodaj**: tabi Dokument / Fakture / Prejem / Naročilo / Opomba (po sliki).
- Gumba **Spremeni** / **Nov**, **Izhod**.
- Prop `mode: 'vracilo' | 'narocilo' | 'prevzem'` določa naslov, default "Št. dok." in zapis v bazo (`orders` za naročilo, `prevzemnice` za prevzem, `dispatches` za vračilo).

## 3. Workflow Naročilo → Skladišče → Prevzem
- Trgovina ustvari Naročilo (status `Poslano`, `to_profile='skladisce'`) → zapis v `orders`.
- Skladišče (`WarehouseHomePage`) dobi seznam prejetih naročil → potrdi → kreira **dobavnico** (zapis v `dispatches` z `delivery_note_number`).
- V Trgovini se v modulu **Prevzemi** prikažejo dobavnice; odpre se isti DocumentDialog v `prevzem` načinu, kjer trgovina v "Št. dokumenta" vpiše št. dobavnice za prevzem.

## 4. Skladišče: nov modul "SKLADIŠČA TRGOVIN"
- Dodam gumb v `WarehouseHomePage` → odpre `SkladiscaTrgovinDialog`.
- Tabela: za vsako lokacijo tipa `pe` prikaže agregat zalog iz `location_stock` (artikel, koda, količina). Iskanje po EAN/nazivu/lokaciji.

## 5. Prijavni podatki
- Posodobim seznam dovoljenih uporabnikov (verjetno v `LoginScreen.tsx` ali konfiguraciji profilov):
  - **Spremeni**: prejšnje "ivancna_gorica" → `ivancnag` / `TR-IVO-001`.
  - **Dodaj**: `domzale` / `TR-DOM-002` (nova trgovina – ustvarim tudi lokacijo Domžale).

## 6. Tehnične opombe
- Brez sprememb sheme – uporabimo obstoječe tabele `orders`, `dispatches`, `prevzemnice`, `locations`, `location_stock`.
- Stil dialogov: enak retro vzorec (`RetroWindow`), notranji scroll, `max-h 92vh`.
- Status barva: `bg-red-500` (odprt), `bg-green-600` (zaprt), z neon-stil okvirjem.

## Datoteke
- new: `src/components/backoffice/retro/DocumentDialog.tsx`
- new: `src/components/backoffice/retro/SkladiscaTrgovinDialog.tsx`
- new: `src/components/backoffice/retro/ConfirmDialog.tsx` (SI/NEIN)
- edit: `src/components/backoffice/retro/OtvoritevDialog.tsx` (klikljivi koraki, ConfirmDialog)
- edit: `src/components/backoffice/ShopHomePage.tsx` (poveži Naročilo/Prevzem/Vračilo z DocumentDialog)
- edit: warehouse home (najdem) — dodaj "Skladišča trgovin" + sprejem naročil
- edit: `LoginScreen` / profil seznam (nov user domzale, preimenovan ivancnag)
- migration: insert lokacije za Domžale (če manjka)
