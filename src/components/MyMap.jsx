/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function FullMapLeaflet({ backgroundColor = "#cce5ff" }) {
  const gpsMarkerRef = useRef(null); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [locations] = useState([
    { name: "Hà Nội", coords: [21.0278, 105.8342] },
    { name: "TP. Hồ Chí Minh", coords: [10.8231, 106.6297] },
    { name: "Đà Nẵng", coords: [16.0544, 108.2022] },
    { name: "Hải Phòng", coords: [20.8449, 106.6881] },
  ]);
  const markerRefs = useRef([]);

  useEffect(() => {
    const map = L.map("map", {
      center: [14.0583, 108.2772],
      zoom: 5,
    });

    // Base map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: "abc",
      maxZoom: 19,
    }).addTo(map);

    // Labels (Esri, có Hoàng Sa, Trường Sa)
    L.tileLayer(
      "https://tiles.arcgis.com/tiles/EaQ3hSM51DBnlwMq/arcgis/rest/services/VietnamLabels/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map);

    const intervals = [];

    const createBlinkingMarker = (coords, name, color = "red") => {
      const circle = L.circleMarker(coords, {
        radius: 12,
        color,
        fillColor: color,
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(map);

      if (name) circle.bindPopup(`<b>${name}</b>`);

      let growing = true;
      let currentRadius = 12;
      const maxRadius = 20;
      const minRadius = 12;
      const interval = setInterval(() => {
        if (growing) {
          currentRadius += 0.5;
          if (currentRadius >= maxRadius) growing = false;
        } else {
          currentRadius -= 0.5;
          if (currentRadius <= minRadius) growing = true;
        }
        circle.setRadius(currentRadius);
      }, 50);

      intervals.push(interval);
      return circle;
    };

    // Marker cố định màu đỏ
    locations.forEach((loc) => {
      const marker = createBlinkingMarker(loc.coords, loc.name, "red");
      markerRefs.current.push({ marker, name: loc.name });
    });

    // Nút GPS góc dưới phải
    const gpsButton = L.control({ position: "bottomright" });
    gpsButton.onAdd = function () {
      const btn = L.DomUtil.create("button", "gps-btn");
      btn.innerHTML = "📍";
      btn.style.padding = "8px 12px";
      btn.style.background = "#fff";
      btn.style.border = "2px solid #888";
      btn.style.borderRadius = "6px";
      btn.style.cursor = "pointer";
      btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
      btn.title = "Vị trí hiện tại";

      btn.onclick = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userCoords = [position.coords.latitude, position.coords.longitude];

              if (!gpsMarkerRef.current) {
                gpsMarkerRef.current = createBlinkingMarker(userCoords, "Vị trí của bạn", "blue");
              } else {
                gpsMarkerRef.current.setLatLng(userCoords);
              }

              map.flyTo(userCoords, 16, { animate: true, duration: 2 });
            },
            (error) => console.warn("Không thể lấy vị trí GPS:", error),
            { enableHighAccuracy: true }
          );
        } else alert("Trình duyệt không hỗ trợ GPS!");
      };

      return btn;
    };
    gpsButton.addTo(map);

    return () => {
      intervals.forEach((i) => clearInterval(i));
      map.remove();
    };
  }, [backgroundColor, locations]);

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <div
        id="map"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor,
          zIndex: 0,
        }}
      ></div>

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: sidebarOpen ? 0 : "-320px",
          width: "320px",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.97)",
          zIndex: 999,
          boxShadow: "2px 0 10px rgba(0,0,0,0.25)",
          transition: "left 0.3s ease",
          padding: "15px",
          overflowY: "auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
    

        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "15px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredLocations.map((loc, index) => (
            <li
              key={index}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => {
                const markerObj = markerRefs.current.find((m) => m.name === loc.name);
                if (markerObj) {
                  markerObj.marker.openPopup();
                  markerObj.marker._map.flyTo(markerObj.marker.getLatLng(), 12, { animate: true, duration: 1.5 });
                }
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  display: "inline-block",
                  marginRight: "10px",
                }}
              ></span>
              {loc.name}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
