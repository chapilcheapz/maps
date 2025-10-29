/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function FullMapLeaflet({ backgroundColor = "#cce5ff" }) {
  const gpsMarkerRef = useRef(null);
  const mapRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations] = useState([
    { name: "Hà Nội", coords: [21.0278, 105.8342] },
    { name: "TP. Hồ Chí Minh", coords: [10.8231, 106.6297] },
    { name: "Đà Nẵng", coords: [16.0544, 108.2022] },
    { name: "Hải Phòng", coords: [20.8449, 106.6881] },
    { name: "Cần Thơ", coords: [10.0452, 105.7469] },
    { name: "Nha Trang", coords: [12.2388, 109.1967] },
  ]);
  const markerRefs = useRef([]);

  useEffect(() => {
    const map = L.map("map", {
      center: [14.0583, 108.2772],
      zoom: 5,
      zoomControl: true,
    });
const key = import.meta.env.VITE_KEY_VIETMAP
    mapRef.current = map;

    // 🌟 VIETMAP LAYERS - CẬP NHẬT ĐÚNG CÁCH
    const vietMapLayers = {
      // Layer chính - Vector Map
      "VietMap Vector": L.tileLayer(
        `https://maps.vietmap.vn/api/tm/{z}/{x}/{y}@2x.png?apikey=${key}`,
        {
          attribution: '&copy; <a href="https://vietmap.vn">VietMap</a>',
          maxZoom: 20,
          minZoom: 1,
        }
      ),

    };

    // Thêm layer mặc định
    vietMapLayers["VietMap Vector"].addTo(map);

    // // Layer Control
    // const layerControl = L.control.layers(vietMapLayers, null, {
    //   position: "topright",
    //   collapsed: false
    // }).addTo(map);

    // Labels Layer (Esri - có Hoàng Sa, Trường Sa)
    const vietnamLabels = L.tileLayer(
      "https://tiles.arcgis.com/tiles/EaQ3hSM51DBnlwMq/arcgis/rest/services/VietnamLabels/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.arcgis.com">Esri</a>'
      }
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

      if (name) {
        circle.bindPopup(`
          <div style="text-align: center;">
            <b>${name}</b><br>
            <small>Lat: ${coords[0].toFixed(4)}, Lng: ${coords[1].toFixed(4)}</small><br>
            <button onclick="window.open('https://www.google.com/maps?q=${coords[0]},${coords[1]}', '_blank')" 
                    style="margin-top: 5px; padding: 4px 8px; background: #4285f4; color: white; border: none; border-radius: 3px; cursor: pointer;">
              🗺️ Google Maps
            </button>
          </div>
        `);
      }

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

    // GPS Button
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
      btn.style.fontSize = "14px";
      btn.style.fontWeight = "bold";

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

              map.flyTo(userCoords, 15, { animate: true, duration: 2 });
            },
            (error) => {
              console.warn("Không thể lấy vị trí GPS:", error);
              alert("Không thể truy cập vị trí GPS. Vui lòng kiểm tra quyền truy cập vị trí.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          alert("Trình duyệt không hỗ trợ GPS!");
        }
      };

      return btn;
    };
    gpsButton.addTo(map);

    // Scale Control
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

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
        alert(`✅ Đã copy tọa độ: ${text}`);
      })
      .catch(err => {
        console.error('Lỗi khi copy: ', err);
        alert('❌ Lỗi khi copy tọa độ');
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

      // Highlight marker
      markerObj.marker.setStyle({
        fillColor: "#ff0000",
        color: "#ff0000",
        fillOpacity: 0.8,
        weight: 3
      });

      setTimeout(() => {
        markerObj.marker.setStyle({
          fillColor: "red",
          color: "red",
          fillOpacity: 0.6,
          weight: 2
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
          left: 0,
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
        <h2 style={{ marginBottom: "15px", color: "#333", borderBottom: "2px solid #4285f4", paddingBottom: "8px" }}>
          🗺️ Bản đồ Việt Nam
        </h2>

        {/* Search Input */}
        <input
          type="text"
          placeholder="🔍 Tìm kiếm địa điểm..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
            fontSize: "14px",
          }}
        />

        {/* Selected Location Info */}
        {selectedLocation && (
          <div style={{
            backgroundColor: "#e8f4fd",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px",
            border: "2px solid #4285f4",
            boxShadow: "0 2px 8px rgba(66, 133, 244, 0.2)"
          }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333", display: "flex", alignItems: "center", gap: "8px" }}>
              📍 {selectedLocation.name}
            </h3>
            <div style={{ margin: "8px 0", fontSize: "14px", color: "#555" }}>
              <div><strong>Vĩ độ:</strong> {selectedLocation.coords[0].toFixed(6)}</div>
              <div><strong>Kinh độ:</strong> {selectedLocation.coords[1].toFixed(6)}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={() => openGoogleMaps(selectedLocation.coords)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  backgroundColor: "#4285f4",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontWeight: "bold"
                }}
              >
                🗺️ Google Maps
              </button>
              <button
                onClick={() => copyCoordinates(selectedLocation.coords)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#34a853",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold"
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
          📌 {filteredLocations.length} địa điểm được tìm thấy
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
                transition: "all 0.2s ease",
                backgroundColor: selectedLocation?.name === loc.name ? "#e3f2fd" : "transparent",
                borderRadius: "6px",
                marginBottom: "4px",
              }}
              onMouseEnter={(e) => {
                if (selectedLocation?.name !== loc.name) {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                  e.currentTarget.style.transform = "translateX(4px)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLocation?.name !== loc.name) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
              onClick={() => handleLocationClick(loc)}
            >
              <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "red",
                    borderRadius: "50%",
                    display: "inline-block",
                    marginRight: "12px",
                    boxShadow: "0 0 4px rgba(255,0,0,0.5)"
                  }}
                ></span>
                <span style={{
                  fontWeight: selectedLocation?.name === loc.name ? "bold" : "normal",
                  color: selectedLocation?.name === loc.name ? "#4285f4" : "#333"
                }}>
                  {loc.name}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openGoogleMaps(loc.coords);
                  }}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: "transparent",
                    border: "1px solid #4285f4",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                    color: "#4285f4",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#4285f4";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#4285f4";
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
                    padding: "6px 8px",
                    backgroundColor: "transparent",
                    border: "1px solid #34a853",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "11px",
                    color: "#34a853",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#34a853";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#34a853";
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
          padding: "15px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          border: "1px solid #ffeaa7",
          fontSize: "13px",
          color: "#856404"
        }}>
          <strong>💡 Hướng dẫn sử dụng:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "15px" }}>
            <li>🗺️ <strong>Chọn layer</strong> ở góc trên bên phải</li>
            {/* <li>📍 Nhấn <strong>"Vị trí hiện tại"</strong> để xem vị trí GPS</li> */}
            <li>📌 Nhấn vào địa điểm để <strong>fly to</strong> và xem chi tiết</li>
            <li>🔍 Dùng <strong>thanh tìm kiếm</strong> để lọc địa điểm</li>
          </ul>
        </div>
      </div>
    </>
  );
}