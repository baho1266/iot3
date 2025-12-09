import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [users, setUsers] = useState({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState("");

  // Load existing users
  const loadUsers = () => {
    fetch(`${API}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Save or Update User
  const saveUser = () => {
    if (!username || !password) {
      setMessage("Username and password required.");
      return;
    }

    const endpoint = editingUser ? "edit_user" : "add_user";

    const payload = editingUser
      ? {
          old_username: editingUser,
          new_username: username,
          password,
          role
        }
      : {
          username,
          password,
          role
        };

    fetch(`${API}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((data) => {
        setMessage(data.msg);
        loadUsers();
        setEditingUser(null);
        setUsername("");
        setPassword("");
        setRole("user");
      });
  };

  // Delete user
  const deleteUser = (u) => {
    if (u === "admin") {
      setMessage("Cannot delete default admin!");
      return;
    }

    fetch(`${API}/delete_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u })
    })
      .then((r) => r.json())
      .then((data) => {
        setMessage(data.msg);
        loadUsers();
      });
  };

  // Edit user (load into form)
  const editUser = (u) => {
    setEditingUser(u);
    setUsername(u);
    setPassword(users[u].password);
    setRole(users[u].role);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>User Manager</h2>

      {/* FORM */}
      <div style={{ marginBottom: "30px" }}>
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

        <button onClick={saveUser}>
          {editingUser ? "Update User" : "Create User"}
        </button>

        <button onClick={goBack} style={{ marginLeft: "10px" }}>
          Back
        </button>

        {message && <p style={{ color: "green" }}>{message}</p>}
      </div>

      {/* USERS LIST */}
      <h3>Existing Users</h3>

      <div style={{ maxWidth: "400px", margin: "auto", textAlign: "left" }}>
        {Object.keys(users).map((u) => (
          <div
            key={u}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              marginBottom: "8px",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <strong>{u}</strong>  
              <span style={{ marginLeft: "8px", fontSize: "12px", color: "#555" }}>
                ({users[u].role})
              </span>
            </div>

            <div>
              <button
                onClick={() => editUser(u)}
                style={{ marginRight: "10px" }}
              >
                Edit
              </button>

              <button
                onClick={() => deleteUser(u)}
                style={{ color: "white", background: "red" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
