import { useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");

  const saveUser = () => {
    fetch(`${API}/add_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "error") {
          setMessage(data.msg);
        } else {
          setMessage(`User "${username}" created successfully!`);
        }
      });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h2>Create New User</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>

      <br /><br />

      <button onClick={saveUser}>Save User</button>
      <button onClick={goBack} style={{ marginLeft: "10px" }}>
        Back
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
