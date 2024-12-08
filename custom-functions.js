// Obiekt do przechowywania danych ze szczegóły.json
let detailsMap = {};

// Funkcja wczytująca dane z pliku szczegóły.json
async function loadDetails() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/szczegoly.json");
    if (!response.ok) throw new Error("Nie udało się załadować pliku szczegóły.json");
    const data = await response.json();
    // Konwersja danych na mapę (nazwa -> link)
    detailsMap = data.reduce((map, item) => {
      const [name, link] = item.split(",");
      map[name.trim()] = link.trim();
      return map;
    }, {});
  } catch (error) {
    console.error("Błąd podczas wczytywania szczegółów:", error);
  }
}

// Funkcja wczytująca numery telefonów z plików KML
async function fetchPhoneNumbersFromKML(kmlUrl, phoneTag) {
  try {
    const response = await fetch(kmlUrl);
    if (!response.ok) throw new Error(`Nie udało się załadować pliku: ${kmlUrl}`);
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    const placemarks = Array.from(kml.getElementsByTagName("Placemark"));

    const phoneNumbers = placemarks.reduce((acc, placemark) => {
      const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
      let phone = null;

      // Pobierz numer z odpowiedniego tagu
      if (phoneTag === "description") {
        const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
        phone = description ? extractPhoneNumber(description) : null;
      } else {
        phone = placemark.getElementsByTagName(phoneTag)[0]?.textContent.trim();
      }

      if (name) {
        acc[name] = phone || null; // Dodaj numer telefonu lub null
      }
      return acc;
    }, {});

    return phoneNumbers;
  } catch (error) {
    console.error(`Błąd podczas przetwarzania pliku ${kmlUrl}:`, error);
    return {};
  }
}

// Funkcja do wyodrębniania numeru telefonu z tekstu opisu
function extractPhoneNumber(text) {
  const phoneRegex = /\+?\d[\d\s\-()]{7,}/; // Prosty regex do wyszukiwania numerów telefonów
  const match = text.match(phoneRegex);
  return match ? match[0].trim() : null;
}

// Funkcja ładująca wszystkie numery telefonów z plików KML
async function loadPhoneNumbers() {
  const kmlFiles = [
    { url: "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Atrakcje.kml", tag: "description" },
    { url: "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi.kml", tag: "phone" },
    { url: "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi1.kml", tag: "telefon" },
    { url: "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingiopen.kml", tag: "description" },
    { url: "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotowe.kml", tag: "phone" },
    { url: "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotoweopen.kml", tag: "description" },
  ];

  const phoneNumbers = {};

  for (const file of kmlFiles) {
    const data = await fetchPhoneNumbersFromKML(file.url, file.tag);
    Object.assign(phoneNumbers, data); // Dodaj numery do głównego obiektu
  }

  return phoneNumbers;
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon, phoneNumbers) {
  let popupContent = `<strong>${name}</strong><br>`;

  // Dodanie numeru telefonu
  const phone = phoneNumbers[name] || "Brak numeru telefonu";
  const phoneLink = phone !== "Brak numeru telefonu"
    ? `<a href="tel:${phone}" style="color:blue; text-decoration:none;">${phone}</a>`
    : phone;
  popupContent += `<strong>Kontakt:</strong> ${phoneLink}<br>`;

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
function updatePopups(markers, phoneNumbers) {
  markers.forEach(({ marker, name, lat, lon }) => {
    const popupContent = generatePopupContent(name, lat, lon, phoneNumbers);
    marker.bindPopup(popupContent);
  });
}

// Funkcja do wczytania szczegółów i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails(); // Wczytaj szczegóły z pliku
  const phoneNumbers = await loadPhoneNumbers(); // Wczytaj numery telefonów z plików KML
  updatePopups(markers, phoneNumbers); // Zaktualizuj popupy dla markerów
}
