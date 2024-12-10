// Obiekt do przechowywania danych ze szczegóły.json
let detailsMap = {};
// Obiekt do przechowywania numerów telefonów
let phoneNumbersMap = {};
// Obiekt do przechowywania adresów stron WWW
let websitesMap = {};

// Funkcja wczytująca dane z pliku szczegóły.json
async function loadDetails() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/szczegoly.json");
    if (!response.ok) throw new Error("Nie udało się załadować pliku szczegóły.json");
    const data = await response.json();
    detailsMap = data.reduce((map, item) => {
      const [name, link] = item.split(",");
      map[name.trim()] = link.trim();
      return map;
    }, {});
  } catch (error) {
    console.error("Błąd podczas wczytywania szczegółów:", error);
  }
}

// Funkcja do wyodrębniania numerów telefonów z tekstu opisu
function extractPhoneNumber(description) {
  const phoneRegex = /(?:Telefon:|Phone:)?\s*(\+?\d[\d\s\-()]{7,})/i; // Dopasowanie numerów telefonów
  const urlRegex = /https?:\/\/[^\s]+/gi; // Dopasowanie linków

  // Usuń linki z opisu
  const descriptionWithoutUrls = description.replace(urlRegex, "");

  const match = descriptionWithoutUrls.match(phoneRegex);
  return match ? match[1].replace(/\s+/g, "") : null; // Usuń spacje w numerze telefonu
}

// Funkcja do wyodrębniania adresów stron WWW z tekstu opisu
function extractWebsite(description) {
  const websiteRegex = /https?:\/\/[^\s]+/i; // Dopasowanie pierwszego linku w opisie
  const match = description.match(websiteRegex);
  return match ? match[0] : null;
}

// Funkcja wczytująca numery telefonów i adresy stron WWW z pliku map.kml
async function loadMapData() {
  const mapKmlUrl = "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/map.kml";

  try {
    const response = await fetch(mapKmlUrl);
    if (!response.ok) throw new Error(`Nie udało się załadować pliku: ${mapKmlUrl}`);
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    const placemarks = kml.getElementsByTagName("Placemark");

    for (const placemark of placemarks) {
      const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
      const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
      if (name && description) {
        const phone = extractPhoneNumber(description);
        const website = extractWebsite(description);

        phoneNumbersMap[name] = phone || "Brak numeru kontaktowego";
        if (website) {
          websitesMap[name] = website;
        }
      }
    }
  } catch (error) {
    console.error(`Błąd podczas przetwarzania pliku map.kml:`, error);
  }
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon) {
  let popupContent = `<strong>${name}</strong><br>`;

  // Dodanie numeru telefonu
  const phone = phoneNumbersMap[name] || "Brak numeru kontaktowego";
  const phoneLink = phone !== "Brak numeru kontaktowego"
    ? `<a href="tel:${phone}" style="color:blue; text-decoration:none;">${phone}</a>`
    : phone;
  popupContent += `<strong>Kontakt:</strong> ${phoneLink}<br>`;

  // Dodanie przycisku "Strona WWW", jeśli istnieje
  if (websitesMap[name]) {
    popupContent += `
      <a href="${websitesMap[name]}" target="_blank" class="website-button">
        Strona WWW
      </a><br>`;
  }

  // Dodanie przycisku "Pokaż szczegóły", jeśli istnieje link w szczegóły.json
  if (detailsMap[name]) {
    popupContent += `
      <a href="${detailsMap[name]}" target="_blank" class="details-button">
        Pokaż szczegóły
      </a><br>`;
  } else {
    popupContent += `
      <a href="https://www.campteam.pl/dodaj/dodaj-zdj%C4%99cie-lub-opini%C4%99" 
         target="_blank" class="update-button">
        Aktualizuj
      </a><br>`;
  }

  // Dodanie przycisku "Prowadź do"
  popupContent += `
    <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" 
       target="_blank" class="navigate-button">
      Prowadź
    </a>`;

  return popupContent;
}

// Funkcja aktualizująca popupy dla wszystkich markerów
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon);
    marker.bindPopup(popupContent);
  });
}

// Funkcja do wczytania szczegółów, danych z map.kml i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails(); // Wczytaj szczegóły z pliku
  await loadMapData(); // Wczytaj numery telefonów i adresy stron WWW z map.kml
  updatePopups(markers); // Zaktualizuj popupy dla markerów
}

// Dodanie stylów dla przycisku "Strona WWW"
const style = document.createElement("style");
style.textContent = `
  .website-button {
    display: inline-block;
    margin: 5px 0;
    padding: 5px 10px;
    border: 2px solid red;
    color: red;
    text-decoration: none;
    font-size: 14px;
    font-weight: bold;
    border-radius: 5px;
  }
  .website-button:hover {
    background-color: #ffe6e6;
    color: #b30000;
  }
`;
document.head.appendChild(style);
