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

// Funkcja do wyodrębniania numeru telefonu z placemarka
function extractPhone(placemark) {
  const possibleFields = [
    placemark.getElementsByTagName("phone")[0]?.textContent || "",
    placemark.getElementsByTagName("description")[0]?.textContent || "",
    placemark.getElementsByTagName("opis")[0]?.textContent || "",
  ];

  // Wyszukiwanie numeru telefonu w polach
  for (const field of possibleFields) {
    const phoneMatch = field.match(/(?:\+?\d[\d\s-]{7,15}\d)/); // Prosty regex dla numerów telefonów
    if (phoneMatch) {
      return phoneMatch[0].trim();
    }
  }
  return null;
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon, phone) {
  let popupContent = `<strong>${name}</strong><br>`;

  // Dodanie numeru telefonu
  if (phone) {
    popupContent += `Kontakt: <a href="tel:${phone}" class="phone-link">${phone}</a><br>`;
  } else {
    popupContent += "Brak numeru telefonu.<br>";
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
function updatePopups(markers, placemarks) {
  markers.forEach(({ marker, name, lat, lon }, index) => {
    const placemark = placemarks[index];
    const phone = extractPhone(placemark); // Pobierz numer telefonu
    const popupContent = generatePopupContent(name, lat, lon, phone);
    marker.bindPopup(popupContent);
  });
}

// Funkcja do wczytania szczegółów i aktualizacji popupów
async function loadDetailsAndUpdatePopups(markers, placemarks) {
  await loadDetails(); // Wczytaj szczegóły z pliku
  updatePopups(markers, placemarks); // Zaktualizuj popupy dla markerów
}
