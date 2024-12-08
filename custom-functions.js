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

// Funkcja wczytująca dane z plików KML i pobierająca numery telefonów z description
async function loadKMLData(kmlUrl) {
  try {
    const response = await fetch(kmlUrl);
    if (!response.ok) throw new Error(`Nie udało się załadować pliku KML: ${kmlUrl}`);
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    const placemarks = Array.from(kml.getElementsByTagName("Placemark"));

    // Przetwarzanie danych Placemark
    return placemarks.map((placemark) => {
      const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
      const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
      const coordinates = placemark.getElementsByTagName("coordinates")[0]?.textContent.trim();
      const [lon, lat] = coordinates.split(",").map((coord) => parseFloat(coord));

      // Wyciąganie numeru telefonu z description
      const phoneMatch = description?.match(/(\+?\d[\d\s-]{7,})/);
      const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : null;

      return { name, lat, lon, phone };
    });
  } catch (error) {
    console.error(`Błąd podczas przetwarzania pliku KML: ${kmlUrl}`, error);
    return [];
  }
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon, phone) {
  let popupContent = `<strong>${name}</strong><br>`;
  const phoneLink = phone
    ? `<a href="tel:${phone}" style="color:blue; text-decoration:none;">${phone}</a>`
    : "Brak numeru telefonu";
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
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon, phone }) => {
    const popupContent = generatePopupContent(name, lat, lon, phone);
    marker.bindPopup(popupContent);
  });
}

// Funkcja do wczytania szczegółów i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails(); // Wczytaj szczegóły z pliku

  // Wczytaj dane z plików KML
  const kmlFiles = [
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Atrakcje.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi1.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingiopen.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotowe.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotoweopen.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Parkingilesne.kml",
    "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Miejscenabiwak.kml"
  ];

  const markers = [];

  for (const kmlUrl of kmlFiles) {
    const placemarks = await loadKMLData(kmlUrl);
    placemarks.forEach(({ name, lat, lon, phone }) => {
      const marker = L.marker([lat, lon]); // Tworzenie markera Leaflet
      markers.push({ marker, name, lat, lon, phone });
    });
  }

  updatePopups(markers); // Zaktualizuj popupy
}
