import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import SearchControl from "./SearchControl";
import Legend from "./Legend";
import "leaflet/dist/leaflet.css";
//import "react-leaflet-search/dist/index.css";

// Centralized configuration for marker styles and sizes
const markerConfig = {
  petty: { stroke: "yellow", fill: "rgba(255, 255, 0, 0.5)", radius: 9 },
  serious: { stroke: "orange", fill: "rgba(255, 165, 0, 0.5)", radius: 9 },
  heinous: { stroke: "red", fill: "rgba(255, 0, 0, 0.5)", radius: 9 },
  ccl: { stroke: "purple", fill: "rgba(128, 0, 128, 0.5)", radius: 8 },
  cncp: { stroke: "green", fill: "rgba(0, 128, 0, 0.5)", radius: 8 },
  default: { stroke: "blue", fill: "rgba(0, 0, 255, 0.5)", radius: 9 },
};

const MapComponent = ({ crimeData }) => {
  return (
    <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: "500px", width: "100%" }}>
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution="&copy; OpenStreetMap contributors" 
      />
      {/* Add the Legend control */}
      <Legend />
      {/* Add Search component */}
      <SearchControl/>
      {crimeData.map((crime, index) => {
        // Destructure configuration based on crime category with a default fallback.
        const { stroke, fill, radius } = markerConfig[crime.category] || markerConfig.default;
        // Ensure valid coordinates before rendering marker.
        if (isNaN(crime.latitude) || isNaN(crime.longitude)) return null;
        
        // Add a small random offset to prevent markers from overlapping exactly.
        const offsetLat = crime.latitude + (Math.random() - 0.5) * 0.0010;
        const offsetLng = crime.longitude + (Math.random() - 0.5) * 0.0010;
        
        return (
          <CircleMarker
            key={index}
            center={[offsetLat, offsetLng]}
            radius={radius}
            color={stroke}
            fillColor={fill}
            fillOpacity={0.6}
            weight={2}
            opacity={1}
          >
            <Popup className="custom-popup">
              <div>
                <strong>Crime Type:</strong> {crime.crime_type} <br />
                <strong>Date:</strong> {crime.date} <br />
                <strong>Police Station:</strong> {crime.police_station} <br />
                <strong>Age:</strong> {crime.age} <br />
                {crime.cncp_details && (
                  <>
                    <strong>CNCP Details:</strong> {crime.cncp_details}
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default React.memo(MapComponent);
