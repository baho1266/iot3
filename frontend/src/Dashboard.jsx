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
  // --- 1. SAFE VARIABLES (The Crash Preventer) ---
  // If user is null, these become "Guest" instead of crashing the app.
  const safeUsername = user && user.username ? user.username : "Guest";
  const safeRole = user && user.role ? user.role : "Viewer";
  const isAdmin = user && user.role === "admin";

  // --- 2. LOADING STATE ---
  if (!user) {
    return (
      <div style={{ padding: "50px", textAlign: "center", color: "#666" }}>
        <h2>Session Expired or Loading...</h2>
        <button 
          onClick={logout}
          style={{ padding: "10px 20px", background: "#1e90ff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}
        >
          Click here to Login Again
        </button>
      </div>
    );
  }

  // --- 3. HELPER FUNCTIONS ---
  const cardStyle = (device) => {
    if (!device) return {}; 
    const now = Date.now();
    const timestamp = device._timestamp || 0;
    
    let bg = "#ffffff";
    if (now - timestamp > 5000) bg = "#e8e8e8"; // Grey if offline
    if (device.ao_v > device.gas_th) bg = "#ffe0e0"; // Red gas warning
    if (device.t > device.temp_th) bg = "#ffe9d6";   // Orange temp warning

    return {
      width: "360px", background: bg, borderRadius: "18px", padding: "22px", margin: "20px",
      boxShadow: "0px 10px 25px rgba(0,0,0,0.1)"
    };
  };

  const buttonStyle = { padding: "10px 16px", borderRadius: "8px", border: "none", cursor: "pointer", marginRight: "10px", marginTop: "10px", fontWeight: "600" };

  // --- 4. RENDER UI ---
  return (
    <div style={{ fontFamily: "Arial", padding: "40px", background: "#f5f5f7", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ color: "#1e90ff" }}>🌐 Smart IoT Dashboard (V6)</h1>
        <div style={{ textAlign: "right" }}>
          <p>Logged in as: <strong style={{ color: "#1e90ff" }}>{safeUsername}</strong> ({safeRole})</p>
          {isAdmin && (
            <button onClick={goUsers} style={{ padding: "8px 12px", background: "#1e90ff", color: "white", borderRadius: "6px", marginRight: "10px", border: "none", cursor: "pointer" }}>
              Manage Users
            </button>
          )}
          <button onClick={logout} style={{ padding: "8px 12px", background: "#dc3545", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* DEVICES */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {(!data || Object.keys(data).length === 0) && <p style={{ marginTop: "40px" }}>Waiting for device data...</p>}
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
                {isAdmin && (
                  <>
                    <hr />
                    <button onClick={() => sendCommand(node, "LED_ON")} style={{ ...buttonStyle, background: "#28a745", color: "white" }}>LED ON</button>
                    <button onClick={() => sendCommand(node, "LED_OFF")} style={{ ...buttonStyle, background: "#dc3545", color: "white" }}>LED OFF</button>
                  </>
                )}
              </div>
              {history && history[node] && (
                <GraphCard title="Temperature" labels={history[node]?.time || []} data={history[node]?.temp || []} color="#ff5733" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
