import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [userList, setUserList] = useState({});

  // Load users from backend
  useEffect(() => {
    fetch(`${API}/users`)
      .then((res) => res.json())
      .then((data) => setUserList(data));
  }, []);

  const saveUser = () => {
    fetch(`${API}/add_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.msg);

        // Refresh list
        fetch(`${API}/users`)
          .then((res) => res.json())
          .then((data) => setUserList(data));
      });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Create New User</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "8px", margin: "5px" }}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "8px", margin: "5px" }}
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ padding: "8px", margin: "5px" }}
      >
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>

      <br />

      <button
        onClick={saveUser}
        style={{
          padding: "10px 20px",
          background: "green",
          color: "white",
          borderRadius: "6px",
          marginTop: "10px",
        }}
      >
        Save User
      </button>

      <button
        onClick={goBack}
        style={{
          padding: "10px 20px",
          background: "#1e90ff",
          color: "white",
          borderRadius: "6px",
          marginLeft: "10px",
          marginTop: "10px",
        }}
      >
        Back
      </button>

      {message && <p style={{ color: "green" }}>{message}</p>}

      <h2 style={{ marginTop: "40px" }}>Existing Users</h2>

      <table
        style={{
          margin: "0 auto",
          borderCollapse: "collapse",
          width: "60%",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              Username
            </th>
            <th style={{ border: "1px solid #ccc", padding: "10px" }}>
              Role
            </th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(userList).map(([name, data]) => (
            <tr key={name}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {name}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {data.role}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
