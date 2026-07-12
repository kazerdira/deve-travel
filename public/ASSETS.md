# Image assets — where to drop them

All paths are under `public/`. The site works without any of these (graceful
fallback), and automatically upgrades the moment a file with the right name exists.
Filenames are EXACT and case-sensitive.

## 1) Service icons  →  public/icons/
3D icons (Microsoft Fluent / claymorphism style), transparent PNG, ~256×256, square.
Name each file after the service slug:

  icons/tcf.png            (Inscription TCF / TEF)      suggested emoji base: 📝
  icons/campus-france.png  (Campus France)             🎓
  icons/visa-dossier.png   (Dossier visa)              🛂
  icons/rdv-booking.png    (Prise de rendez-vous)      📅
  icons/translation.png    (Traduction assermentée)    🌐
  icons/flights.png        (Billets d'avion)           ✈️
  icons/accommodation.png  (Hébergement)               🏠
  icons/cv-lm.png          (CV & lettre de motivation) 📄

Missing icon → the built-in line icon shows instead. No broken image.

## 2) Destination 3D landmarks  →  public/destinations/
The object that floats in the top corner of each destination card.
Transparent PNG, ~600×600, object centered, soft shadow baked in is fine.
Name after the destination slug + `-3d`:

  destinations/france-3d.png     (Eiffel Tower, 3D)
  destinations/canada-3d.png     (CN Tower / mountain + maple, 3D)
  destinations/spain-3d.png      (optional — Sagrada / sun)
  destinations/portugal-3d.png   (optional — tram / lighthouse)

Missing → card still looks good (mesh gradient + glass panel), just no landmark.

## 3) Destination detail photos  →  public/destinations/
Wide banner photo at the top of each destination page.
WebP (or JPG), landscape ~1600×900, real city/landmark shot.
Name after the destination slug + `-hero`:

  destinations/france-hero.webp    (Paris street / rooftops at golden hour)
  destinations/canada-hero.webp    (Toronto or Montréal skyline)
  destinations/spain-hero.webp     (optional)
  destinations/portugal-hero.webp  (optional)

Missing → a warm tinted panel with the title shows instead.

## 4) Home hero background (optional)  →  public/hero/
If you want a photographic desert-dusk behind the animated hero, drop:

  hero/desert-dusk.webp   (~1920×1200)

Then follow the one-line note in README.md ("Home hero background") to switch it on.
Left off by default — the animated SVG hero is the current look.

---
### Consistency is everything
Use ONE style for all service icons (same angle, same lighting, same material) and
ONE style for all landmarks. Mixing a glossy icon with a matte one is what makes a
set look assembled. Keep the whole set in the brand orange #E45424 family where you can.
