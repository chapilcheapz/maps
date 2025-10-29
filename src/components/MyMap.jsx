/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function FullMapLeaflet({ backgroundColor = "#cce5ff" }) {
  const gpsMarkerRef = useRef(null);
  const mapRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null); // Thêm state cho vị trí được chọn
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
    
    mapRef.current = map;

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

      if (name) circle.bindPopup(`<b>${name}</b><br>Lat: ${coords[0].toFixed(4)}, Lng: ${coords[1].toFixed(4)}`);

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
      
      return { circle, interval, name };
    };

    markerRefs.current = [];
    
    locations.forEach((loc) => {
      const markerObj = createBlinkingMarker(loc.coords, loc.name, "red");
      markerRefs.current.push({ 
        marker: markerObj.circle, 
        name: loc.name,
        coords: loc.coords
      });
    });

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
                const gpsMarkerObj = createBlinkingMarker(userCoords, "Vị trí của bạn", "blue");
                gpsMarkerRef.current = gpsMarkerObj.circle;
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

  // Hàm mở Google Maps
  const openGoogleMaps = (coords) => {
    const [lat, lng] = coords;
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
    window.open(url, '_blank');
  };

  // Hàm copy tọa độ
  const copyCoordinates = (coords) => {
    const [lat, lng] = coords;
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        alert(`Đã copy tọa độ: ${text}`);
      })
      .catch(err => {
        console.error('Lỗi khi copy: ', err);
      });
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    const markerObj = markerRefs.current.find((m) => m.name === location.name);
    
    if (markerObj && mapRef.current) {
      markerObj.marker.openPopup();
      mapRef.current.flyTo(markerObj.marker.getLatLng(), 12, { 
        animate: true, 
        duration: 1.5 
      });
      
      markerObj.marker.setStyle({
        fillColor: "#ff0000",
        color: "#ff0000",
        fillOpacity: 0.8
      });
      
      setTimeout(() => {
        markerObj.marker.setStyle({
          fillColor: "red",
          color: "red", 
          fillOpacity: 0.6
        });
      }, 2000);
    }
  };

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
        <h2 style={{ marginBottom: "15px", color: "#333" }}>Địa điểm Việt Nam</h2>

        <input
          type="text"
          placeholder="Tìm kiếm địa điểm..."
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

        {/* Hiển thị thông tin địa điểm được chọn */}
        {selectedLocation && (
          <div style={{
            backgroundColor: "#f8f9fa",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "15px",
            border: "1px solid #e9ecef"
          }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>{selectedLocation.name}</h3>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
              <strong>Tọa độ:</strong><br />
              Lat: {selectedLocation.coords[0].toFixed(6)}<br />
              Lng: {selectedLocation.coords[1].toFixed(6)}
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                onClick={() => openGoogleMaps(selectedLocation.coords)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  backgroundColor: "#4285f4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px"
                }}
                title="Mở trong Google Maps"
              >
                <span>🗺️</span>
                Google Maps
              </button>
              <button
                onClick={() => copyCoordinates(selectedLocation.coords)}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Copy tọa độ"
              >
                <span>📋</span>
              </button>
            </div>
          </div>
        )}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredLocations.map((loc, index) => (
            <li
              key={index}
              style={{
                padding: "12px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background-color 0.2s",
                backgroundColor: selectedLocation?.name === loc.name ? "#e3f2fd" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (selectedLocation?.name !== loc.name) {
                  e.target.style.backgroundColor = "#f5f5f5";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLocation?.name !== loc.name) {
                  e.target.style.backgroundColor = "transparent";
                } else {
                  e.target.style.backgroundColor = "#e3f2fd";
                }
              }}
              onClick={() => handleLocationClick(loc)}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
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
                <span style={{ fontWeight: selectedLocation?.name === loc.name ? "bold" : "normal" }}>
                  {loc.name}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openGoogleMaps(loc.coords);
                  }}
                  style={{
                    padding: "4px 6px",
                    backgroundColor: "transparent",
                    border: "1px solid #4285f4",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "10px",
                    color: "#4285f4"
                  }}
                  title="Mở Google Maps"
                >
                  🗺️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyCoordinates(loc.coords);
                  }}
                  style={{
                    padding: "4px 6px",
                    backgroundColor: "transparent",
                    border: "1px solid #6c757d",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "10px",
                    color: "#6c757d"
                  }}
                  title="Copy tọa độ"
                >
                  📋
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Hướng dẫn sử dụng */}
        <div style={{ 
          marginTop: "20px", 
          padding: "10px", 
          backgroundColor: "#fff3cd", 
          borderRadius: "4px",
          border: "1px solid #ffeaa7",
          fontSize: "12px",
          color: "#856404"
        }}>
          <strong>💡 Hướng dẫn:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "15px" }}>
            <li>Nhấn vào địa điểm để xem chi tiết</li>
            <li>🗺️ Mở Google Maps</li>
            <li>📋 Copy tọa độ</li>
          </ul>
        </div>
      </div>
    </>
  );
}