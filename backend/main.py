from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os

USERS_FILE = "users.json"

# -----------------------------------------------------
# LOAD USERS FROM FILE
# -----------------------------------------------------
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    else:
        default_users = {
            "admin": {"password": "admin123", "role": "admin"},
            "user": {"password": "user123", "role": "user"}
        }
        with open(USERS_FILE, "w") as f:
            json.dump(default_users, f, indent=4)
        return default_users

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)

users = load_users()

# -----------------------------------------------------
# FASTAPI APP
# -----------------------------------------------------
app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://ee495smarthome.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------
# STORAGE
# -----------------------------------------------------
latest_data = {}
system_limits = {}

# -----------------------------------------------------
# MODELS
# -----------------------------------------------------
class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class Command(BaseModel):
    device: str
    action: str

class LimitUpdate(BaseModel):
    device: str
    temp_th: float | None = None
    gas_th: float | None = None

# -----------------------------------------------------
# USER ROUTES
# -----------------------------------------------------
@app.post("/add_user")
def add_user(u: UserCreate):
    global users

    if u.username in users:
        return {"status": "error", "msg": "User already exists"}

    users[u.username] = {"password": u.password, "role": u.role}
    save_users(users)

    return {"status": "ok", "msg": "User added"}

@app.get("/users")
def list_users():
    return users

@app.post("/login")
def login(u: UserLogin):
    if u.username not in users:
        return {"status": "error", "msg": "Invalid username"}

    if users[u.username]["password"] != u.password:
        return {"status": "error", "msg": "Incorrect password"}

    return {"status": "ok", "user": {"username": u.username, "role": users[u.username]["role"]}}

# -----------------------------------------------------
# PARSE SENSOR DATA + MQTT
# (same as before, unchanged)
# -----------------------------------------------------

def parse_sensor_message(raw: str):
    ...
    # KEEP YOUR EXISTING IMPLEMENTATION HERE
    ...

# MQTT connection, send_command, set_limits...
# KEEP ALL YOUR PREVIOUS CODE EXACTLY AS BEFORE