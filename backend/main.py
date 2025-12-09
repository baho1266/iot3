from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt
import json
import os

USERS_FILE = "users.json"

# --------------------------------------
# LOAD USERS FROM FILE (PERSISTENT)
# --------------------------------------
if os.path.exists(USERS_FILE):
    with open(USERS_FILE, "r") as f:
        users = json.load(f)
else:
    users = {
        "admin": {"password": "admin123", "role": "admin"},
        "user":  {"password": "user123",  "role": "user"}
    }
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)


def save_users():
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=4)


# --------------------------------------
# FASTAPI APP
# --------------------------------------
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

latest_data = {}
system_limits = {}


# --------------------------------------
# USER MODELS
# --------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class AddUserRequest(BaseModel):
    username: str
    password: str
    role: str


# --------------------------------------
# USER ROUTES
# --------------------------------------
@app.post("/login")
def login(data: LoginRequest):
    username = data.username
    password = data.password

    if username in users and users[username]["password"] == password:
        return {"status": "ok", "username": username, "role": users[username]["role"]}

    return {"status": "error", "msg": "Invalid username or password"}


@app.post("/add_user")
def add_user(data: AddUserRequest):
    username = data.username

    if username in users:
        return {"status": "error", "msg": "User already exists!"}

    users[username] = {"password": data.password, "role": data.role}
    save_users()

    return {"status": "ok", "msg": "User created!"}


@app.get("/list_users")
def list_users():
    return users


# --------------------------------------
# IOT SENSOR PARSING
# --------------------------------------
def parse_sensor_message(raw: str):
    result = {}
    try:
        start = raw.find("[") + 1
        end = raw.find("]")
        result["node"] = raw[start:end]

        parts = raw.split("] - ")[1]
        time_str = parts.split()[0]
        result["time"] = time_str

        sensor_parts = parts[len(time_str):].strip().split("|")

        for part in sensor_parts:
            if ":" in part:
                key, val = part.split(":", 1)
                val = (
                    val.replace("C", "")
                    .replace("%", "")
                    .replace("V", "")
                    .replace("ms", "")
                    .replace("(MANUAL)", "")
                    .strip()
                )

                try:
                    val = float(val) if "." in val else int(val)
                except:
                    pass

                result[key.strip().lower()] = val

    except Exception as e:
        print("Parse error:", e)

    return result


# --------------------------------------
# MQTT CALLBACKS
# --------------------------------------
def on_connect(client, userdata, flags, rc):
    print("MQTT connected:", rc)
    client.subscribe("iot/pi/data")


def on_message(client, userdata, msg):
    raw = msg.payload.decode()
    parsed = parse_sensor_message(raw)

    if parsed:
        node = parsed["node"]

        if node not in system_limits:
            system_limits[node] = {"temp_th": 30.0, "gas_th": 1.20}

        parsed["temp_th"] = system_limits[node]["temp_th"]
        parsed["gas_th"] = system_limits[node]["gas_th"]

        latest_data[node] = parsed


# --------------------------------------
# MQTT SETUP
# --------------------------------------
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set("p_user", "P_user123")
mqtt_client.tls_set()

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect("08d5c716cf9f46518abcda4d565e5141.s1.eu.hivemq.cloud", 8883)
mqtt_client.loop_start()


# --------------------------------------
# COMMAND MODELS & ROUTES
# --------------------------------------
class Command(BaseModel):
    device: str
    action: str


class LimitUpdate(BaseModel):
    device: str
    temp_th: float | None = None
    gas_th: float | None = None


@app.get("/")
def root():
    return {"message": "Backend working!"}


@app.get("/realtime")
def realtime():
    return latest_data


@app.post("/command")
def send_command(cmd: Command):
    msg = f"{cmd.device}:{cmd.action.replace('_', ' ')}"
    mqtt_client.publish("iot/pi/command", msg)
    return {"status": "ok", "sent": msg}


@app.post("/set_limits")
def set_limits(limit: LimitUpdate):
    device = limit.device

    if device not in system_limits:
        system_limits[device] = {"temp_th": 30.0, "gas_th": 1.20}

    if limit.temp_th is not None:
        system_limits[device]["temp_th"] = limit.temp_th
        mqtt_client.publish("iot/pi/command", f"{device}:TEMP={limit.temp_th}")

    if limit.gas_th is not None:
        system_limits[device]["gas_th"] = limit.gas_th
        mqtt_client.publish("iot/pi/command", f"{device}:GAS={limit.gas_th}")

    return {"status": "ok", "limits": system_limits[device]}