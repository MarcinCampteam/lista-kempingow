// Lista plików KML do przetworzenia
const kmlFiles = [
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Atrakcje.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingi1.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Kempingiopen.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Miejscenabiwak.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Parkingilesne.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotowe.kml",
  "https://raw.githubusercontent.com/MarcinCampteam/lista-kempingow/main/Polanamiotoweopen.kml",
];

// Funkcja do wczytywania i przetwarzania plików KML
async function processKmlFiles(map, markerCluster, icons) {
  const addedMarkers = new Set();
  const allMarkers = [];

  async function fetchKml(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Nie udało się załadować pliku KML: ${url}`);
    return response.text();
  }

  for (const file of kmlFiles) {
    try {
      const kmlText = await fetchKml(file);
      const parser = new DOMParser();
      const kml = parser.parseFromString(kmlText, "application/xml");
      const placemarks = Array.from(kml.getElementsByTagName("Placemark"));

      placemarks.forEach((placemark) => {
        const name = placemark.getElementsByTagName("name")[0]?.textContent || "Brak nazwy";
        const description = placemark.getElementsByTagName("description")[0]?.textContent || "";
        const phone = description.match(/\b\d{9,}\b/)?.[0]; // Szukaj numeru telefonu w opisie
        const coordinates = placemark.getElementsByTagName("coordinates")[0]?.textContent.trim();

        if (coordinates) {
          const [lon, lat] = coordinates.split(",");
          const key = `${lat},${lon}`;

          if (!addedMarkers.has(key)) {
            addedMarkers.add(key);

            const popupContent = `
              <strong>${name}</strong><br>
              ${phone ? `Kontakt: <a href="tel:${phone}">${phone}</a><br>` : "Brak numeru telefonu<br>"}
              <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" 
                 target="_blank" class="navigate-button">
                Prowadź
              </a>`;

            const icon = icons[file.split('/').pop().split('.')[0]] || icons.default; // Wybierz odpowiednią ikonę
            const marker = L.marker([lat, lon], { icon }).bindPopup(popupContent);

            markerCluster.addLayer(marker);
            allMarkers.push({ marker, name, lat, lon });
          }
        }
      });
    } catch (error) {
      console.error(`Błąd podczas przetwarzania pliku ${file}:`, error);
    }
  }

  map.addLayer(markerCluster);
  return allMarkers;
}
