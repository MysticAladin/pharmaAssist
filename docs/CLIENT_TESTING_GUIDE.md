# PharmaAssist - Vodič za Testiranje

## 📋 Pregled

Ovaj dokument sadrži sve potrebne informacije za testiranje PharmaAssist aplikacije.

---

## 🔑 Pristupni Podaci

### URL Aplikacije
- **Frontend**: `http://localhost:4200`
- **Backend API**: `http://localhost:5000/api`

### Test Korisnici

Svi test korisnici koriste istu lozinku: **`test123`**

#### Osnovni Korisnici

| Uloga | Email | Opis |
|-------|-------|------|
| **System Admin** | `admin@pharmaassist.ba` | Puni pristup sistemu, upravljanje svim klijentima |
| **Manager** | `manager.user@pharmaassist.com` | Operativni nadzor, upravljanje prodajom i zalihama |
| **Pharmacist** | `pharmacist.user@pharmaassist.com` | Obrada recepata, izdavanje lijekova |
| **Sales Rep** | `salesrep.user@pharmaassist.com` | Odnosi s kupcima, kreiranje narudžbi |
| **Warehouse** | `warehouse.user@pharmaassist.com` | Operacije skladišta i otpreme |
| **Customer** | `customer.user@pharmaassist.com` | Pristup portalu za kupce (e-Apoteka) |

#### Menadžeri Timova

| Uloga | Email | Tim |
|-------|-------|-----|
| **Manager** | `amir.hodzic@pharmaassist.com` | Menadžer komercijalnog tima (OTC) |
| **Manager** | `selma.begovic@pharmaassist.com` | Menadžer medicinskog tima (RX) |

#### Komercijalni Prodajni Predstavnici (OTC)

| Email | Ime | Teritorij |
|-------|-----|-----------|
| `edin.mujic@pharmaassist.com` | Edin Mujić | Kanton Sarajevo |
| `amela.hadzic@pharmaassist.com` | Amela Hadžić | Zeničko-dobojski kanton |
| `mirza.delic@pharmaassist.com` | Mirza Delić | Tuzlanski kanton |
| `lejla.imamovic@pharmaassist.com` | Lejla Imamović | Hercegovačko-neretvanski kanton |

#### Medicinski Prodajni Predstavnici (RX)

| Email | Ime | Teritorij |
|-------|-----|-----------|
| `adnan.kovacevic@pharmaassist.com` | Adnan Kovačević | Sarajevo - Bolnice i klinike |
| `maja.petrovic@pharmaassist.com` | Maja Petrović | Centralna BiH - Medicinske ustanove |
| `haris.zahirovic@pharmaassist.com` | Haris Zahirović | Sjeverna BiH - Medicinske ustanove |
| `aida.softic@pharmaassist.com` | Aida Softić | Južna BiH - Zdravstvene ustanove |

---

## 🎯 Uloge i Pristup Menijima

### 🔐 System Admin
**Puni pristup sistemu** - Može sve

| Sekcija Menija | Pristup |
|----------------|---------|
| Kontrolna Tabla | ✅ Potpun |
| Proizvodi | ✅ Puni CRUD |
| Zalihe | ✅ Potpun |
| Narudžbe | ✅ Puni CRUD |
| Kupci | ✅ Puni CRUD |
| Izvještaji | ✅ Svi izvještaji uključujući naprednu analitiku |
| **Administracija** | |
| Upravljanje Korisnicima | ✅ |
| Feature Flags | ✅ |
| Cjenovnik | ✅ |
| Ciljevi | ✅ |
| Postavke | ✅ |
| Audit Logovi | ✅ |
| Integracije | ✅ |

---

### 📊 Manager
**Operativni nadzor** - Prodaja i operacije

| Sekcija Menija | Pristup |
|----------------|---------|
| Kontrolna Tabla | ✅ Potpun (uključujući admin dashboard) |
| Proizvodi | ✅ Pregled + Uređivanje |
| Zalihe | ✅ Puno upravljanje |
| Narudžbe | ✅ Kreiranje, Uređivanje, Obrada |
| Kupci | ✅ Pregled, Kreiranje, Uređivanje |
| Izvještaji | ✅ Pregled + Izvoz |
| **Administracija** | |
| Upravljanje Korisnicima | ✅ Samo pregled |
| Ciljevi | ✅ |
| Audit Logovi | ✅ |
| Ostalo | ❌ |

---

### 💊 Pharmacist (Farmaceut)
**Kliničke operacije** - Recepti i lijekovi

| Sekcija Menija | Pristup |
|----------------|---------|
| Kontrolna Tabla | ✅ Pregled |
| Proizvodi | ✅ Samo pregled |
| Zalihe | ✅ Samo pregled |
| Narudžbe | ✅ Pregled + Uređivanje |
| Kupci | ✅ Samo pregled |
| Recepti | ✅ Potpun (kreiranje, odobravanje, odbijanje, izdavanje) |
| Izvještaji | ✅ Samo pregled |
| **Administracija** | ❌ |

---

### 💼 Sales Rep (Prodajni Predstavnik)
**Odnosi s kupcima** - Prodaja i upravljanje kupcima

| Sekcija Menija | Pristup |
|----------------|---------|
| Kontrolna Tabla | ✅ Pregled (vlastita statistika) |
| Proizvodi | ✅ Samo pregled |
| Narudžbe | ✅ Kreiranje i pregled vlastitih narudžbi |
| Moji Kupci | ✅ Pregled dodijeljenih kupaca |
| Posjete | ✅ Puno upravljanje |
| Izvještaji | ✅ Vlastiti izvještaji |
| **Administracija** | ❌ |

---

### 📦 Warehouse (Skladište)
**Logističke operacije** - Zalihe i otprema

| Sekcija Menija | Pristup |
|----------------|---------|
| Kontrolna Tabla | ✅ Pregled |
| Proizvodi | ✅ Samo pregled |
| Zalihe | ✅ Puno upravljanje |
| Narudžbe | ✅ Procesiranje (pakovanje, otprema) |
| Otpremnice | ✅ Puni CRUD |
| Izvještaji | ✅ Izvještaji o zalihama |
| **Administracija** | ❌ |

---

### 🛒 Customer (Kupac)
**Portal za kupce** - e-Apoteka pristup

| Sekcija Menija | Pristup |
|----------------|---------|
| Kontrolna Tabla Kupca | ✅ Vlastita statistika |
| Katalog Proizvoda | ✅ Pregled i pretraga |
| Moje Narudžbe | ✅ Kreiranje i praćenje |
| Moj Profil | ✅ Uređivanje |
| **Administracija** | ❌ |

---

## ✅ Scenariji za Testiranje

### 1. Prijava i Autentifikacija
- [ ] Prijava s ispravnim kredencijalima
- [ ] Prijava s pogrešnom lozinkom (očekuje se greška)
- [ ] Odjava iz sistema
- [ ] Provjera da li meni prikazuje samo dozvoljene stavke za ulogu

### 2. Proizvodi (Admin/Manager)
- [ ] Pregled liste proizvoda
- [ ] Pretraga proizvoda po nazivu
- [ ] Filtriranje po kategoriji
- [ ] Kreiranje novog proizvoda
- [ ] Uređivanje postojećeg proizvoda
- [ ] Deaktivacija proizvoda

### 3. Narudžbe
- [ ] Pregled liste narudžbi
- [ ] Filtriranje po statusu
- [ ] Kreiranje nove narudžbe
- [ ] Dodavanje stavki u narudžbu
- [ ] Procesiranje narudžbe (promjena statusa)

### 4. Kupci (Admin/Manager)
- [ ] Pregled liste kupaca
- [ ] Pretraga po nazivu ili PIB-u
- [ ] Kreiranje novog kupca
- [ ] Uređivanje podataka kupca
- [ ] Pregled historije narudžbi kupca

### 5. Zalihe (Warehouse/Admin)
- [ ] Pregled zaliha po skladištu
- [ ] Filtriranje proizvoda s niskim zalihama
- [ ] Ažuriranje količine zaliha
- [ ] Premještanje zaliha između skladišta

### 6. Posjete (Sales Rep)
- [ ] Pregled vlastitih posjeta
- [ ] Kreiranje nove posjete
- [ ] Uređivanje postojeće posjete
- [ ] Dodavanje bilješki o posjeti
- [ ] Filtriranje po datumu

### 7. Izvještaji
- [ ] Generiranje izvještaja o prodaji
- [ ] Izvoz izvještaja u Excel/PDF
- [ ] Filtriranje izvještaja po datumu

### 8. Administracija (Admin)
- [ ] Upravljanje korisnicima
- [ ] Kreiranje novog korisnika
- [ ] Dodjela uloga korisnicima
- [ ] Pregled audit logova

---

## 🐛 Prijava Grešaka

Prilikom prijave greške, molimo uključite:

1. **Korisnik**: Kojom ulogom ste prijavljeni
2. **Stranica**: Na kojoj stranici se greška desila
3. **Koraci**: Šta ste radili prije nego što se greška pojavila
4. **Očekivano ponašanje**: Šta ste očekivali da se desi
5. **Stvarno ponašanje**: Šta se zapravo desilo
6. **Screenshot**: Ako je moguće, priložite sliku ekrana

---

## 📞 Kontakt

Za pitanja ili probleme tokom testiranja, kontaktirajte razvojni tim.

---

*Dokument ažuriran: Februar 2026*
