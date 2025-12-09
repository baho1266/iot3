import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function UserManager({ goBack }) {
  const [list, setList] = useState({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/users`)
      .then(res => res.json())
      .then(setList);
  }, []);

  const save = () => {
    fetch(`${API}/add_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    })
      .then(r => r.json())
      .then(d => setMsg(d.msg));
  };

  return (
    <div style={{ textAlign: "center" }}>

      <h2>👥 User Manager</h2>

      <h3>Existing Users</h3>
      <pre>{JSON.stringify(list, null, 2)}</pre>

      <h3>Add New User</h3>

      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <br />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <br />
      <select onChange={e => setRole(e.target.value)}>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>

      <br /><br />

      <button onClick={save}>Create</button>
      <button onClick={goBack} style={{ marginLeft: "10px" }}>Back</button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
