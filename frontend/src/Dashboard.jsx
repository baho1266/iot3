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
  // DEBUG LOGGING
  // -----------------------------
  // Open your browser console to see this. 
  // It helps us know if "user" is null or undefined.
  // console.log("Dashboard rendering. User is:", user);

  // -----------------------------
  // SAFETY GUARD
  // -----------------------------
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
    // Safety check: if device is null, return default style immediately
    if (!device) {
       return { 
          width: "360px", 
          background: "#fff", 
          padding: "22px", 
          margin: "20px",
          borderRadius: "18px"
       };
    }

    const now = Date.now();
    const timestamp = device._timestamp ? device._timestamp : 0;
    const age = now - timestamp;

    let bg = "#ffffff";
    if (age > 5000) bg = "#e8e8e8";
    
    // Manual checks instead of ?.
    if (device.ao_v > device.gas_th) bg = "#ffe0e0";
    if (device.t > device.temp_th) bg = "#ffe9d6";

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
        {/* V3 TITLE - To verify update */}
        <h1 style={{ color: "#1e90ff" }}>🌐 Smart IoT Dashboard (V3)</h1>

        <div style={{ textAlign: "right" }}>
          <p>
            Logged in as:{" "}
            <strong style={{ color: "#1e90ff" }}>
              {/* OLD SCHOOL SAFETY CHECK (Ternary Operator) */}
              {user && user.username ? user.username : "Guest"}
            </strong>{" "}
            ({user && user.role ? user.role : "Viewer"})
          </p>

          {/* OLD SCHOOL SAFETY CHECK */}
          {user && user.role === "admin" && (
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
        {/* Safety check on data object */}
        {(!data || Object.keys(data).length === 0) && (
          <p style={{ marginTop: "40px" }}>Waiting for device data...</p>
        )}

        {data && Object.keys(data).map((node) => {
          const d = data[node];
          if (!d) return null;

          return (
            <div key={node}>
              <div style={cardStyle(d)}>
                <h2>{node}</h2>
                <p><strong>Time:</strong> {d.time || "--:--"}</p>
                <p><strong>Temp:</strong> {d.t} °C</p>
                <p><strong>Humidity:</strong> {d.h} %</p>
                <p><strong>Gas:</strong> {d.ao_v} V</p>

                {/* OLD SCHOOL SAFETY CHECK */}
                {user && user.role === "admin" && (
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

              {/* Safety check on history object */}
              {history && history[node] && (
                <GraphCard
                  title="Temperature"
                  labels={history[node].time || []}
                  data={history[node].temp || []}
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
