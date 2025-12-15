from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paho.mqtt.client as mqtt

# -----------------------------------------------------
# FASTAPI APP
# -----------------------------------------------------
app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://iot-backend-phi.vercel.app/"
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

# Per-device limits
# Structure will become:
# {
#   "ESP32-1": { "temp_th": 30.0, "gas_th": 1.20 },
#   "ESP32-2": { "temp_th": 28.0, "gas_th": 0.55 }
# }
system_limits = {}

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

        # Set default limits if device has no entry yet
        if node not in system_limits:
            system_limits[node] = {"temp_th": 30.0, "gas_th": 1.20}

        # Attach device-specific limits
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
# UPDATE LIMITS – FIXED VERSION (PER DEVICE)
# -----------------------------------------------------
@app.post("/set_limits")
def update_limits(limit: LimitUpdate):
    device = limit.device

    # If device has no limits yet, create defaults
    if device not in system_limits:
        system_limits[device] = {"temp_th": 30.0, "gas_th": 1.20}

    messages = []

    # TEMP LIMIT UPDATE
    if limit.temp_th is not None:
        system_limits[device]["temp_th"] = limit.temp_th
        msg = f"{device}:TEMP={limit.temp_th}"
        r = mqtt_client.publish("iot/pi/command", msg)
        print("Publishing:", msg, "→ RC =", r.rc)
        messages.append(msg)

    # GAS LIMIT UPDATE
    if limit.gas_th is not None:
        system_limits[device]["gas_th"] = limit.gas_th
        msg = f"{device}:GAS={limit.gas_th}"
        r = mqtt_client.publish("iot/pi/command", msg)
        print("Publishing:", msg, "→ RC =", r.rc)
        messages.append(msg)

    return {
        "status": "ok",
        "sent": messages,
        "all_limits": system_limits
    }

