// src/components/Legend.js
import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

const Legend = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      // Set the background color here
      div.style.backgroundColor = "white";
      div.style.padding = "10px";
      div.style.opacity = "0.6";
      // Define your legend labels and colors
      const categories = ["petty", "serious", "heinous", "ccl", "cncp"];
      const colors = {
        petty: "yellow",
        serious: "orange",
        heinous: "red",
        ccl: "purple",
        cncp: "green"
      };
      
      let labels = [];
      categories.forEach((cat) => {
        labels.push(
          `<i style="background:${colors[cat]}; opacity: 1.5; width: 18px; height: 18px; display: inline-block; margin-right: 8px;"></i>${cat}`
        );
      });
      div.innerHTML = labels.join("<br>");
      return div;
    };

    legend.addTo(map);

    // Clean up on unmount
    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

export default Legend;
