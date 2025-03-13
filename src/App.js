// src/App.js
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import MapComponent from "./components/MapComponent";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// If you need to override CSV coordinates for specific police stations,
// you can define a mapping. Otherwise, the CSV values will be used.
const stationCoordinates = {
  "Sheshadripuram": { latitude: 12.9913, longitude: 77.5770 },
  "High Ground": { latitude: 12.984345, longitude: 77.582786 },
  "Kengeri": { latitude: 12.9015, longitude: 77.4815 },
  "Kumbalagudu": { latitude: 12.8776, longitude: 77.4463 },
  "Madivala": { latitude: 12.9210242, longitude: 77.6185382 },
  "Hulimavu": { latitude: 12.85820166, longitude: 77.58952833 },
  "Electronic City": { latitude: 12.83952, longitude: 77.66149 },
  // Add others as needed...
};

// Helper to assign a category based on crime_type.
const assignCategory = (crime_type) => {
  if (["petty"].includes(crime_type.toLowerCase())) return "petty";
  if (["serious"].includes(crime_type.toLowerCase())) return "serious";
  if (["heinous"].includes(crime_type.toLowerCase())) return "heinous";
  // You can add further logic for ccl or cncp if needed.
  return "uncategorized";
};

// Process the CSV data rows into proper objects.
const processCrimeData = (data) => {
  return data.map((item) => {
    // Optionally override coordinates from our mapping.
    if (stationCoordinates[item.police_station]) {
      item.latitude = stationCoordinates[item.police_station].latitude;
      item.longitude = stationCoordinates[item.police_station].longitude;
    }
    return {
      date: item.date,
      crime_type: item.crime_type,
      police_station: item.police_station,
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
      age: parseInt(item.age, 10),
      cncp_details: item.cncp_details,
      crime_descriptions: item.crime_descriptions,
      category: assignCategory(item.crime_type),
    };
  });
};

const App = () => {
  const [crimeData, setCrimeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  // Filter states
  const [crimeCategory, setCrimeCategory] = useState("All");
  const [policeStation, setPoliceStation] = useState("All");
  const [startDate, setStartDate] = useState("2016-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [minAge, setMinAge] = useState(5);
  const [maxAge, setMaxAge] = useState(100);
  // Active tab state: 'map' or 'analysis'
  const [activeTab, setActiveTab] = useState("map");
  // State to trigger re-mounting of analysis charts
  const [analysisReady, setAnalysisReady] = useState(false);

  // Fetch and parse the CSV data on mount.
  useEffect(() => {
    fetch("/data/crime_data.csv")
      .then((response) => response.text())
      .then((text) => {
        const results = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        const processed = processCrimeData(results.data);
        console.log("Processed Data:", processed);
        // Filter out any records with invalid coordinates
        const valid = processed.filter(
          (item) =>
            !isNaN(item.latitude) &&
            !isNaN(item.longitude) &&
            item.latitude !== 0 &&
            item.longitude !== 0
        );
        setCrimeData(valid);
        setFilteredData(valid);
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  // Update filteredData whenever filters change.
  useEffect(() => {
    const filtered = crimeData.filter((crime) => {
      const crimeDate = new Date(crime.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const withinDateRange = crimeDate >= start && crimeDate <= end;
      const matchesCategory =
        crimeCategory === "All" ||
        crime.category === crimeCategory;
      const matchesStation =
        policeStation === "All" || crime.police_station === policeStation;
      const withinAgeRange = crime.age >= minAge && crime.age <= maxAge;
      return withinDateRange && matchesCategory && matchesStation && withinAgeRange;
    });
    setFilteredData(filtered);
  }, [crimeData, crimeCategory, policeStation, startDate, endDate, minAge, maxAge]);

  // Re-mount analysis charts each time the Analysis tab is activated.
  useEffect(() => {
    if (activeTab === "analysis") {
      setAnalysisReady(false);
      const timer = setTimeout(() => {
        setAnalysisReady(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const policeStations = Array.from(new Set(crimeData.map((c) => c.police_station)));

  // Prepare chart data for Analysis.
  const categoryOrder = ["petty", "serious", "heinous", "ccl", "cncp"];
  const categoryColors = {
    petty: "yellow",
    serious: "orange",
    heinous: "red",
    ccl: "purple",
    cncp: "green",
  };
  const categoryCounts = filteredData.reduce((acc, crime) => {
    acc[crime.category] = (acc[crime.category] || 0) + 1;
    return acc;
  }, {});

  const labels = categoryOrder.filter((cat) => categoryCounts[cat] !== undefined);
  const data = labels.map((cat) => categoryCounts[cat]);
  const backgroundColors = labels.map((cat) => categoryColors[cat]);
  const categoryChartData = {
    labels: labels,
    datasets: [
      {
        label: "Number of Cases",
        data: data,
        backgroundColor: backgroundColors,
      },
    ],
  };

  const trends = {};
  filteredData.forEach((crime) => {
    const yr = new Date(crime.date).getFullYear();
    trends[yr] = (trends[yr] || 0) + 1;
  });
  const trendYears = Object.keys(trends).sort();
  const trendCounts = trendYears.map((yr) => trends[yr]);
  const trendChartData = {
    labels: trendYears,
    datasets: [
      {
        label: "Total Cases per Year",
        data: trendCounts,
        borderColor: "blue",
        fill: false,
      },
    ],
  };

  const ageBins = {};
  filteredData.forEach((crime) => {
    const bin = Math.floor(crime.age / 5) * 5;
    ageBins[bin] = (ageBins[bin] || 0) + 1;
  });
  const ageLabels = Object.keys(ageBins).sort((a, b) => a - b);
  const ageCounts = ageLabels.map((bin) => ageBins[bin]);
  const ageChartData = {
    labels: ageLabels.map((b) => `${b}-${+b + 4}`),
    datasets: [
      {
        label: "Number of Cases",
        data: ageCounts,
        backgroundColor: "teal",
      },
    ],
  };

  const totalCases = filteredData.length;
  const summaryStats = {};
  filteredData.forEach((crime) => {
    if (!summaryStats[crime.category])
      summaryStats[crime.category] = { count: 0, totalAge: 0 };
    summaryStats[crime.category].count += 1;
    summaryStats[crime.category].totalAge += crime.age;
  });

  return (
    <div className="container">
      <h1>Crime Mapping System</h1>
      <div className="filters">
        <label>
          Crime Category:
          <select value={crimeCategory} onChange={(e) => setCrimeCategory(e.target.value)}>
            <option value="All">All</option>
            <option value="petty">Petty</option>
            <option value="serious">Serious</option>
            <option value="heinous">Heinous</option>
            <option value="ccl">CCL</option>
            <option value="cncp">CNCP</option>
          </select>
        </label>
        <label>
          Police Station:
          <select value={policeStation} onChange={(e) => setPoliceStation(e.target.value)}>
            <option value="All">All</option>
            {policeStations.map((station, idx) => (
              <option key={idx} value={station}>
                {station}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label>
          Age Range:
          <input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value))}
            style={{ width: "50px" }}
          />
          -
          <input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(Number(e.target.value))}
            style={{ width: "50px" }}
          />
        </label>
      </div>

      <div className="tabs">
        <button onClick={() => setActiveTab("map")} className={activeTab === "map" ? "active" : ""}>
          Map
        </button>
        <button onClick={() => setActiveTab("analysis")} className={activeTab === "analysis" ? "active" : ""}>
          Analysis
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "map" && <MapComponent crimeData={filteredData} />}
        {activeTab === "analysis" && analysisReady && (
          <div className="analysis">
            <div className="chart-container">
              <h3>Category Distribution</h3>
              <Bar key="bar-category" data={categoryChartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
            </div>
            <div className="chart-container">
              <h3>Crime Trends Over Years</h3>
              <Line key="line-trends" data={trendChartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
            </div>
            <div className="chart-container">
              <h3>Age Distribution</h3>
              <Bar key="bar-age" data={ageChartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
            </div>
            <div className="summary">
              <h3>Crime Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Cases</th>
                    <th>Percentage</th>
                    <th>Avg Age</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(summaryStats).map((cat, idx) => (
                    <tr key={idx}>
                      <td>{cat}</td>
                      <td>{summaryStats[cat].count}</td>
                      <td>{((summaryStats[cat].count / totalCases) * 100).toFixed(1)}%</td>
                      <td>{(summaryStats[cat].totalAge / summaryStats[cat].count).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
