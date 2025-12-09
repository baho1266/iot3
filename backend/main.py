from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os

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
# USER STORAGE HELPERS
# -----------------------------------------------------
USERS_FILE = "users.json"

def load_users():
    """Load all users from JSON file; if missing, create defaults."""
    if not os.path.exists(USERS_FILE):
        users = {
            "admin": {"password": "admin123", "role": "admin"},
            "user": {"password": "user123", "role": "user"}
        }
        with open(USERS_FILE, "w") as f:
            json.dump(users, f, indent=4)
        return users

    with open(USERS_FILE, "r") as f:
        return json.load(f)


def save_users(users):
    """Save users dictionary back to file."""
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)


# -----------------------------------------------------
# PARSE SENSOR MESSAGES
# -----------------------------------------------------
def parse_sensor_message(raw: str):
    result = {}
    try:
        start = raw.find("[") + 1
        end = raw.find("]")
        result["node"] = raw[start:end]

        parts = raw.split("] - ")[1]
        time_str = parts.split()[0]
        result["time"] = time_str

        sensors_str = parts[len(time_str):].strip()
        sensor_parts = sensors_str.split("|")

        for part in sensor_parts:
            part = part.strip()
            if ":" in part:
                key, val = part.split(":", 1)
                key = key.strip()
                val = val.strip()

                val = (
                    val.replace("C", "")
                    .replace("%", "")
                    .replace("V", "")
                    .replace("ms", "")
                    .replace("(MANUAL)", "")
                    .strip()
                )

                try:
                    if "." in val:
                        val = float(val)
                    else:
                        val = int(val)
                except:
                    pass

                result[key.lower()] = val

    except Exception as e:
        print("Parse error:", e)
    return result


# -----------------------------------------------------
# MQTT CALLBACKS
# -----------------------------------------------------
def on_connect(client, userdata, flags, rc):
    print("Connected:", rc)
    client.subscribe("iot/pi/data")


def on_message(client, userdata, msg):
    global latest_data, system_limits
    raw = msg.payload.decode()
    parsed = parse_sensor_message(raw)

    if parsed:
        node = parsed["node"]

        # Create default per-device limits if missing
        if node not in system_limits:
            system_limits[node] = {"temp_th": 30.0, "gas_th": 1.20}

        parsed["temp_th"] = system_limits[node]["temp_th"]
        parsed["gas_th"] = system_limits[node]["gas_th"]

        latest_data[node] = parsed


# -----------------------------------------------------
# MQTT CLIENT SETUP
# -----------------------------------------------------
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set("p_user", "P_user123")
mqtt_client.tls_set()

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect(
    "08d5c716cf9f46518abcda4d565e5141.s1.eu.hivemq.cloud",
    8883
)
mqtt_client.loop_start()


# -----------------------------------------------------
# MODELS
# -----------------------------------------------------
class Command(BaseModel):
    device: str
    action: str

class LimitUpdate(BaseModel):
    device: str
    temp_th: float | None = None
    gas_th: float | None = None

class LoginData(BaseModel):
    username: str
    password: str

class NewUser(BaseModel):
    username: str
    password: str
    role: str


# -----------------------------------------------------
# ROUTES
# -----------------------------------------------------
@app.get("/")
def root():
    return {"message": "Backend working"}


@app.get("/realtime")
def realtime_data():
    return latest_data


# -----------------------------------------------------
# AUTH: LOGIN
# -----------------------------------------------------
@app.post("/login")
def login_user(info: LoginData):
    users = load_users()

    if info.username not in users:
        return {"status": "error", "msg": "Invalid username"}

    if users[info.username]["password"] != info.password:
        return {"status": "error", "msg": "Invalid password"}

    return {
        "status": "ok",
        "username": info.username,
        "role": users[info.username]["role"]
    }


# -----------------------------------------------------
# AUTH: ADD NEW USER
# -----------------------------------------------------
@app.post("/add_user")
def add_user(u: NewUser):
    users = load_users()

    if u.username in users:
        return {"status": "error", "msg": "User already exists"}

    users[u.username] = {
        "password": u.password,
        "role": u.role
    }

    save_users(users)
    return {"status": "ok", "msg": "User created"}


# -----------------------------------------------------
# SEND ESP32 COMMANDS (LED & FAN)
# -----------------------------------------------------
@app.post("/command")
def send_command(cmd: Command):
    action_fixed = cmd.action.replace("_", " ")
    message = f"{cmd.device}:{action_fixed}"

    r = mqtt_client.publish("iot/pi/command", message)
    print("Publishing:", message, "→ RC =", r.rc)

    return {"status": "ok", "sent": message, "mqtt_rc": r.rc}


# -----------------------------------------------------
# UPDATE LIMITS (PER DEVICE)
# -----------------------------------------------------
@app.post("/set_limits")
def update_limits(limit: LimitUpdate):
    device = limit.device

    if device not in system_limits:
        system_limits[device] = {"temp_th": 30.0, "gas_th": 1.20}

    messages = []

    if limit.temp_th is not None:
        system_limits[device]["temp_th"] = limit.temp_th
        msg = f"{device}:TEMP={limit.temp_th}"
        mqtt_client.publish("iot/pi/command", msg)
        messages.append(msg)

    if limit.gas_th is not None:
        system_limits[device]["gas_th"] = limit.gas_th
        msg = f"{device}:GAS={limit.gas_th}"
        mqtt_client.publish("iot/pi/com_

