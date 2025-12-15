import { useState } from "react";

const USERS = {
  admin: { password: "admin123", role: "admin" },
  user:  { password: "user123",  role: "user" }
};

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!USERS[username] || USERS[username].password !== password) {
      setError("Invalid username or password");
      return;
    }

    const role = USERS[username].role;

    const userInfo = { username, role };
    localStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>🔐 Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      />

      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      />

      <br />

      <button
        onClick={handleLogin}
        style={{
          padding: "10px 20px",
          background: "#1e90ff",
          color: "white",
          borderRadius: "6px",
          border: "none",
          marginTop: "10px",
          cursor: "pointer"
        }}
      >
        Login
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

