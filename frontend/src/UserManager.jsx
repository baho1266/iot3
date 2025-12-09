import { useState, useEffect } from "react";

export default function UserManager({ goBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState({});

  // Load users on page load
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("users")) || {};
    setUsers(stored);
  }, []);

  // Create user
  const saveUser = () => {
    if (!username || !password) {
      setMessage("Username and password required.");
      return;
    }

    let stored = JSON.parse(localStorage.getItem("users")) || {};

    stored[username] = { password, role };

    localStorage.setItem("users", JSON.stringify(stored));
    setUsers(stored); // update list
    setMessage(`User "${username}" created/updated successfully!`);

    // Reset form
    setUsername("");
    setPassword("");
    setRole("user");
  };

  // Delete user
  const deleteUser = (userToDelete) => {
    let stored = JSON.parse(localStorage.getItem("users")) || {};

    delete stored[userToDelete];

    localStorage.setItem("users", JSON.stringify(stored));
    setUsers(stored);

    setMessage(`User "${userToDelete}" deleted.`);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h2>Create / Manage Users</h2>

      {/* CREATE USER FORM */}
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      />

      <br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
      />

      <br />

      <label>Role: </label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ padding: "10px", margin: "10px" }}
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
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginRight: "20px"
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
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Back to Dashboard
      </button>

      {message && <p style={{ color: "green" }}>{message}</p>}

      <hr style={{ margin: "40px 0" }} />

      {/* USER LIST */}
      <h3>Existing Users</h3>

      {Object.keys(users).length === 0 && <p>No users found.</p>}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {Object.keys(users).map((u) => (
          <div
            key={u}
            style={{
              width: "320px",
              padding: "10px",
              margin: "6px",
              background: "#f0f0f0",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>
              {u} — <strong>{users[u].role}</strong>
            </span>

            <button
              onClick={() => deleteUser(u)}
              style={{
                padding: "6px 10px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
