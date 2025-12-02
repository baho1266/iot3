import { useEffect, useState } from "react";
import GraphCard from "./GraphCard";

const API = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [data, setData] = useState({});
  const [history, setHistory] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/realtime`)
        .then((res) => res.json())
        .then((json) => {
          const now = Date.now();

          for (let node in json) {
            json[node]._timestamp = now;
          }

          setData(json);

          setHistory((prev) => {
            const updated = { ...prev };

            Object.keys(json).forEach((node) => {
              const d = json[node];

              if (!updated[node]) {
                updated[node] = {
                  time: [],
                  temp: [],
                  gas: []
                };
              }

              updated[node].time.push(now);
              updated[node].temp.push(d.t);
              updated[node].gas.push(d.ao_v);

              if (updated[node].time.length > 99999999) {
                updated[node].time.shift();
                updated[node].temp.shift();
                updated[node].gas.shift();
              }
            });

            return updated;
          });
        })
        .catch(() => {});
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendCommand = (device, action) => {
    fetch(`${API}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device, action }),
    });
  };

  const updateLimits = (device) => {
    const temp = parseFloat(
      document.getElementById(`${device}-temp-limit`).value
    );
    const gas = parseFloat(
      document.getElementById(`${device}-gas-limit`).value
    );

    fetch(`${API}/set_limits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device: device,
        temp_th: temp,
        gas_th: gas,
      }),
    });
  };

  const cardStyle = (device) => {
    const now = Date.now();
    const age = now - (device._timestamp || 0);

    let bg = "#ffffff";

    if (age > 5000) bg = "#e8e8e8";
    if (device.ao_v > device.gas_th) bg = "#ffe0e0";
    if (device.t > device.temp_th) bg = "#ffe9d6";

    return {
      width: "360px",
      background: bg,
      borderRadius: "18px",
      padding: "22px",
      margin: "20px",
      boxShadow: "0px 10px 25px rgba(0,0,0,0.1)",
      color: "#1a1a1a",
      fontWeight: "500",
      transition: "0.3s",
    };
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    marginRight: "10px",
    marginTop: "10px",
    fontWeight: "600",
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        background: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
          color: "#1e90ff",
        }}
      >
        🌐 Smart IoT Dashboard
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {Object.keys(data).map((node) => {
          const d = data[node];

          return (
            <div
              key={node}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={cardStyle(d)}>
                <h2 style={{ marginTop: 0 }}>{node}</h2>
                <p><strong>Time:</strong> {d.time}</p>

                <p>
                  <strong>Temp:</strong> {d.t}°C{" "}
                  {d.t > d.temp_th && (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      🔥 HIGH
                    </span>
                  )}
                </p>

                <p><strong>Humidity:</strong> {d.h}%</p>

                {/* LED STATUS */}
                <p>
                  <strong>LED:</strong>{" "}
                  {d.led === "ON" ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>🟢 ON</span>
                  ) : (
                    <span style={{ color: "gray" }}>⚪ OFF</span>
                  )}
                </p>

                {/* FAN STATUS */}
                <p>
                  <strong>Fan:</strong>{" "}
                  {d.fan === "ON" ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>🟢 ON</span>
                  ) : (
                    <span style={{ color: "gray" }}>⚪ OFF</span>
                  )}
                </p>

                <p>
                  <strong>Gas Voltage:</strong> {d.ao_v}V{" "}
                  {d.ao_v > d.gas_th && (
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      ⚠️ GAS ALERT
                    </span>
                  )}
                </p>

                <hr />

                <h3>Limits</h3>
                <p><strong>Temp Limit:</strong> {d.temp_th}°C</p>
                <p><strong>Gas Limit:</strong> {d.gas_th}V</p>

                <label>
                  New Temp Limit:
                  <input
                    id={`${node}-temp-limit`}
                    type="number"
                    defaultValue={d.temp_th}
                    step="0.1"
                    style={{
                      marginLeft: "10px",
                      padding: "6px",
                      width: "80px",
                      borderRadius: "6px",
                    }}
                  />
                </label>

                <br /><br />

                <label>
                  New Gas Limit:
                  <input
                    id={`${node}-gas-limit`}
                    type="number"
                    defaultValue={d.gas_th}
                    step="0.01"
                    style={{
                      marginLeft: "18px",
                      padding: "6px",
                      width: "80px",
                      borderRadius: "6px",
                    }}
                  />
                </label>

                <br /><br />

                <button
                  onClick={() => updateLimits(node)}
                  style={{ ...buttonStyle, background: "#007bff", color: "white" }}
                >
                  Save Limits
                </button>

                <hr />

                <h3>Controls</h3>

                <button
                  onClick={() => sendCommand(node, "LED_ON")}
                  style={{ ...buttonStyle, background: "#28a745", color: "white" }}
                >
                  LED ON
                </button>

                <button
                  onClick={() => sendCommand(node, "LED_OFF")}
                  style={{ ...buttonStyle, background: "#dc3545", color: "white" }}
                >
                  LED OFF
                </button>

                <br />

                <button
                  onClick={() => sendCommand(node, "FAN_ON")}
                  style={{ ...buttonStyle, background: "#17a2b8", color: "white" }}
                >
                  FAN ON
                </button>

                <button
                  onClick={() => sendCommand(node, "FAN_OFF")}
                  style={{ ...buttonStyle, background: "#6c757d", color: "white" }}
                >
                  FAN OFF
                </button>
              </div>

              {history[node] && (
                <GraphCard
                  title="Temperature (°C)"
                  labels={history[node].time}
                  data={history[node].temp}
                  color="#ff5733"
                />
              )}

              {history[node] && (
                <GraphCard
                  title="Gas Voltage (V)"
                  labels={history[node].time}
                  data={history[node].gas}
                  color="#3366ff"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;


