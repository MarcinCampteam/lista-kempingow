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

// Funkcja do ekstrakcji numeru telefonu
function extractPhone(placemark) {
  const phoneRegex = /\b\d{9,}\b/; // Prosty regex dla numerów telefonów
  const description = placemark.getElementsByTagName("description")[0]?.textContent || "";
  const phone = placemark.getElementsByTagName("phone")[0]?.textContent || "";
  const opis = placemark.getElementsByTagName("opis")[0]?.textContent || "";
  const phoneFromDescription = description.match(phoneRegex);
  const phoneFromPhoneTag = phone.match(phoneRegex);
  const phoneFromOpis = opis.match(phoneRegex);
  return (
    (phoneFromPhoneTag && phoneFromPhoneTag[0]) ||
    (phoneFromDescription && phoneFromDescription[0]) ||
    (phoneFromOpis && phoneFromOpis[0]) ||
    null
  );
}

// Funkcja generująca treść popupu
function generatePopupContent(name, lat, lon, phone = null) {
  let popupContent = `<strong>${name}</strong><br>`;
  if (phone) {
    popupContent += `Kontakt: <a href="tel:${phone}" class="phone-link">${phone}</a><br>`;
  }
  if (detailsMap[name]) {
    popupContent += `
      <a href="${detailsMap[name]}" target="_blank" class="details-button">
        Pokaż szczegóły
      </a><br>`;
  } else {
    popupContent += "Dodaj info o tej lokalizacji www.campteam.pl/dodaj.<br>";
  }
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
  await loadDetails();
  updatePopups(markers);
}
