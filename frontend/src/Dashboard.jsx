import GraphCard from "./GraphCard";

export default function Dashboard({
  user,
  data = {},
  history = {},
  logout,
  sendCommand,
  updateLimits,
  goUsers
}) {
  // -----------------------------
  // SAFETY GUARD
  // -----------------------------
  // We keep this, but we also add safeguards below just in case.
  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading user session...</h2>
      </div>
    );
  }

  // -----------------------------------
  // CARD STYLE FUNCTION
  // -----------------------------------
  const cardStyle = (device) => {
    const now = Date.now();
    const age = now - (device?._timestamp || 0);

    let bg = "#ffffff";
    if (age > 5000) bg = "#e8e8e8";
    if (device?.ao_v > device?.gas_th) bg = "#ffe0e0";
    if (device?.t > device?.temp_th) bg = "#ffe9d6";

    return {
      width: "360px",
      background: bg,
      borderRadius: "18px",
      padding: "22px",
      margin: "20px",
      boxShadow: "0px 10px 25px rgba(0,0,0,0.1)",
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
  // UI
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
        <h1 style={{ color: "#1e90ff" }}>🌐 Smart IoT Dashboard</h1>

        <div style={{ textAlign: "right" }}>
          <p>
            Logged in as:{" "}
            {/* --- FIX APPLIED HERE: Added ?. --- */}
            <strong style={{ color: "#1e90ff" }}>
              {user?.username || "User"}
            </strong>{" "}
            ({user?.role})
          </p>

          {/* --- FIX APPLIED HERE: Added ?. --- */}
          {user?.role === "admin" && (
            <button
              onClick={goUsers}
              style={{
                padding: "8px 12px",
                background: "#1e90ff",
                color: "white",
                borderRadius: "6px",
                marginRight: "10px",
                border: "none",
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

      {/* DEVICES */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {Object.keys(data).length === 0 && (
          <p style={{ marginTop: "40px" }}>Waiting for device data...</p>
        )}

        {Object.keys(data).map((node) => {
          const d = data[node];
          if (!d) return null;

          return (
            <div key={node}>
              <div style={cardStyle(d)}>
                <h2>{node}</h2>
                <p><strong>Time:</strong> {d.time}</p>
                <p><strong>Temp:</strong> {d.t} °C</p>
                <p><strong>Humidity:</strong> {d.h} %</p>
                <p><strong>Gas:</strong> {d.ao_v} V</p>

                {/* --- FIX APPLIED HERE: Added ?. --- */}
                {user?.role === "admin" && (
                  <>
                    <hr />
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
                  </>
                )}
              </div>

              {history[node] && (
                <GraphCard
                  title="Temperature"
                  labels={history[node].time}
                  data={history[node].temp}
                  color="#ff5733"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
