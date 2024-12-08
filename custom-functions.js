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

  // Dodanie treści description
  if (description) {
    popupContent += `<p>${description}</p>`;
  } else {
    popupContent += `<p>Brak opisu.</p>`;
  }

  // Dodanie przycisku "Pokaż szczegóły", jeśli istnieje link w szczegóły.json
  if (detailsMap[name]) {
    popupContent += `
      <a href="${detailsMap[name]}" target="_blank" class="details-button">
        Pokaż szczegóły
      </a><br>`;
  } else {
    popupContent += "Dodaj info o tej lokalizacji www.campteam.pl/dodaj.<br>";
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
