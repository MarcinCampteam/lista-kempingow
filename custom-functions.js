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

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon, description) {
  let popupContent = `<strong>${name}</strong><br>`;

  // Wyciąganie numeru telefonu z description
  const match = description?.match(/Telefon[:\s]*([\+0-9\s\-]+)/i); // Dopasuj numer telefonu
  const phone = match ? match[1].replace(/\s+/g, "").trim() : "Brak numeru telefonu";
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
function updatePopups(markers) {
  markers.forEach(({ marker, name, lat, lon, description }) => {
    const popupContent = generatePopupContent(name, lat, lon, description);
    marker.bindPopup(popupContent);
  });
}

// Funkcja do wczytania szczegółów i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers) {
  await loadDetails(); // Wczytaj szczegóły z pliku
  updatePopups(markers); // Zaktualizuj popupy dla markerów
}

// Funkcja wczytująca dane z plików KML i przypisująca markerom
async function loadKMLData(kmlUrl) {
  try {
    const response = await fetch(kmlUrl);
    if (!response.ok) throw new Error(`Nie udało się załadować pliku KML: ${kmlUrl}`);
    const kmlText = await response.text();
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    const placemarks = Array.from(kml.getElementsByTagName("Placemark"));

    // Przetwarzanie każdego Placemark
    return placemarks.map((placemark) => {
      const name = placemark.getElementsByTagName("name")[0]?.textContent.trim();
      const description = placemark.getElementsByTagName("description")[0]?.textContent.trim();
      const coordinates = placemark.getElementsByTagName("coordinates")[0]?.textContent.trim();
      const [lon, lat] = coordinates.split(",").map((coord) => parseFloat(coord));

      return { name, description, lat, lon };
    });
  } catch (error) {
    console.error(`Błąd podczas wczytywania i przetwarzania pliku KML: ${kmlUrl}`, error);
    return [];
  }
}

// Przykład użycia
async function initializeMarkers() {
  const kmlUrl = "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi.kml";
  const placemarks = await loadKMLData(kmlUrl);

  const markers = placemarks.map(({ name, description, lat, lon }) => {
    const marker = L.marker([lat, lon]); // Tworzenie markera Leaflet
    return { marker, name, lat, lon, description };
  });

  await loadDetailsAndUpdatePopups(markers); // Ładowanie szczegółów i aktualizacja popupów
}
