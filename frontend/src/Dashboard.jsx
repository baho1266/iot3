import GraphCard from "./GraphCard";

export default function Dashboard({
  user,
  data = {},
  history = {},
  logout,
  sendCommand,
  updateLimits,
  goUsers,
}) {
  // -----------------------------------
  // SAFETY CHECK (VERY IMPORTANT)
  // -----------------------------------
  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // -----------------------------------
  // CARD STYLE FUNCTION
  // -----------------------------------
  const cardStyle = (device) => {
    if (!device) return {};

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

  // -----------------------------------
  // MAIN UI
  // -----------------------------------
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        background: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ marginBottom: "30px", color: "#1e90ff" }}>
          🌐 Smart IoT Dashboard
        </h1>

        <div style={{ textAlign: "right", marginRight: "20px" }}>
          <p>
            Logged in as:{" "}
            <strong style={{ color: "#1e90ff" }}>
              {user.username}
            </strong>{" "}
            ({user.role})
          </p>

          {user.role === "admin" && (
            <button
              onClick={goUsers}
              style={{
                padding: "8px 12px",
                background: "#1e90ff",
                color: "white",
                borderRadius: "6px",
                border: "none",
                marginRight: "10px",
                cursor: "pointer",
              }}
            >
              Manage Users
            </button>
          )}

          <button
            onClick={logout}
            style={{
              padding: "8px 12px",
              background: "#dc3545",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* DEVICE CARDS */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {Object.keys(data).length === 0 && (
          <p>No device data yet…</p>
        )}

        {Object.keys(data).map((node) => {
          const d = data[node];
          if (!d) return null;

          return (
            <div key={node} style={{ display: "flex", flexDirection: "column" }}>
              <div style={cardStyle(d)}>
                <h2>{node}</h2>

                <p><strong>Time:</strong> {d.time || "-"}</p>
                <p><strong>Temp:</strong> {d.t ?? "-"} °C</p>
                <p><strong>Humidity:</strong> {d.h ?? "-"} %</p>
                <p><strong>Gas:</strong> {d.ao_v ?? "-"} V</p>

                <p>
                  <strong>LED:</strong> {d.led || "OFF"}
                </p>

                <p>
                  <strong>Fan:</strong> {d.fan || "OFF"}
                </p>

                <hr />

                <p><strong>Temp Limit:</strong> {d.temp_th}</p>
                <p><strong>Gas Limit:</strong> {d.gas_th}</p>

                {user.role === "admin" && (
                  <>
                    <input
                      id={`${node}-temp-limit`}
                      type="number"
                      defaultValue={d.temp_th}
                    />
                    <input
                      id={`${node}-gas-limit`}
                      type="number"
                      defaultValue={d.gas_th}
                    />
                    <br />

                    <button
                      style={{ ...buttonStyle, background: "#007bff", color: "white" }}
                      onClick={() => updateLimits(node)}
                    >
                      Save Limits
                    </button>

                    <hr />

                    <button
                      style={{ ...buttonStyle, background: "#28a745", color: "white" }}
                      onClick={() => sendCommand(node, "LED_ON")}
                    >
                      LED ON
                    </button>

                    <button
                      style={{ ...buttonStyle, background: "#dc3545", color: "white" }}
                      onClick={() => sendCommand(node, "LED_OFF")}
                    >
                      LED OFF
                    </button>
                  </>
                )}
              </div>

              {history[node] && (
                <GraphCard
                  title="Temperature"
                  labels={history[node].time}
                  data={history[node].temp}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
