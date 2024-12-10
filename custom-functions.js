// Obiekt do przechowywania danych ze szczegóły.json
let detailsMap = {};
// Obiekt do przechowywania numerów telefonów
let phoneNumbersMap = {};
// Obiekt do przechowywania linków do stron www
let websiteLinksMap = {};

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

// Funkcja wczytująca numery telefonów i linki do stron www z plików KML
async function loadKmlData() {
  const kmlFiles = [
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi1.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingiopen.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Miejscenabiwak.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Parkingilesne.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotowe.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotoweopen.kml",
  ];

  for (const url of kmlFiles) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nie udało się załadować pliku: ${url}`);
      const kmlText = await response.text();
      const parser = new DOMParser();
      const kml = parser.parseFromString(kmlText, "application/xml");
      const placemarks = kml.getElementsByTagName("Placemark");

      for (const placemark of placemarks) {
        const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
        const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
        const website = placemark.querySelector("Data[name='website'] value")?.textContent.trim();

        if (name) {
          if (description) {
            const phone = extractPhoneNumber(description);
            phoneNumbersMap[name] = phone || "Brak numeru kontaktowego";
          }
          if (website) {
            websiteLinksMap[name] = website;
          }
        }
      }
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pliku ${url}:`, error);
    }
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

  // Dodanie przycisku "Strona www", jeśli istnieje link
  if (websiteLinksMap[name]) {
    popupContent += `
      <a href="${websiteLinksMap[name]}" target="_blank" class="website-button" style="color:red; font-weight:bold; border: 2px solid red; padding: 5px; border-radius: 5px; text-decoration: none;">
        Strona www
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

// Funkcja do wczytania szczegółów i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails(); // Wczytaj szczegóły z pliku
  await loadKmlData(); // Wczytaj numery telefonów i linki z plików KML
  updatePopups(markers); // Zaktualizuj popupy dla markerów
}
