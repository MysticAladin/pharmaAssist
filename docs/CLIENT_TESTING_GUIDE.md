# PharmaAssist - Vodič za Testiranje

## 📋 Pregled

Ovaj dokument sadrži sve potrebne informacije za testiranje PharmaAssist aplikacije.

---

## 🔑 Pristupni Podaci

### URL Aplikacije
https://calm-hill-0c8eb5803.6.azurestaticapps.net


### Test Korisnici

Svi test korisnici koriste istu lozinku: **`Admin@123!`**

#### Osnovni Korisnici

| Uloga | Email | Opis |
|-------|-------|------|
| **System Admin** | `admin@pharmaassist.ba` | Puni pristup sistemu, upravljanje svim klijentima |
| **Manager** | `manager.user@pharmaassist.com` | Operativni nadzor, upravljanje prodajom i zalihama |
| **Sales Rep** | `salesrep.user@pharmaassist.com` | Odnosi s kupcima, kreiranje narudžbi |
| **Warehouse** | `warehouse.user@pharmaassist.com` | Operacije skladišta i otpreme |
| **Customer** | `customer.user@pharmaassist.com` | Pristup portalu za kupce (e-Apoteka) |

#### Menadžeri Timova

| Email | Ime | Tim |
|-------|-----|-----|
| `amir.hodzic@pharmaassist.com` | Amir Hodžić | Menadžer komercijalnog tima (OTC) |
| `selma.begovic@pharmaassist.com` | Selma Begović | Menadžer medicinskog tima (RX) |

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
