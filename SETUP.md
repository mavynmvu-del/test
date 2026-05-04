# web altar — fresh Pi setup

## What this is

A Three.js walkthrough installation. A Skype call intro leads into a 3D corridor with billboards, spatial audio, and a live ESP32-CAM video feed at the end. The Pi acts as a self-contained unit: WiFi access point, web server, and display — no internet required.

---

## Hardware

- Raspberry Pi (any model with onboard WiFi)
- ESP32-CAM (AI Thinker)
- Monitor + HDMI cable
- Power for both Pi and ESP32-CAM

---

## 1. Get the repo onto the Pi

From your Mac, SCP the folder over:

```bash
scp -r "/Users/avelaga/Documents/Repos/web altar" poop@<PI_IP>:/home/poop/Desktop/
```

Or if the Pi is already the one you developed on, skip this step.

---

## 2. Install dependencies

```bash
sudo apt update
sudo apt install -y dnsmasq python3
```

Confirm NetworkManager is running:

```bash
systemctl is-active NetworkManager
```

---

## 3. Flash the ESP32-CAM

Do this before switching the Pi to AP mode so you still have internet if needed.

Open `esp32cam/esp32cam.ino` in Arduino IDE.

Required board package: **ESP32 by Espressif** (install via Boards Manager).

Required settings:
- Board: `AI Thinker ESP32-CAM`
- Partition scheme: `Huge APP (3MB No OTA)`

The sketch connects to SSID `poop` / password `pooppoop` and streams MJPEG at `http://{ESP32_IP}/stream`. No changes needed unless you rename the network.

---

## 4. Set up the WiFi access point

**Do this from a keyboard/monitor session on the Pi, not SSH — activating the AP will drop your SSH connection.**

Install the connection profile:

```bash
sudo cp "/home/poop/Desktop/web altar/SETUP_files/poop-ap.nmconnection" /etc/NetworkManager/system-connections/
sudo chmod 600 /etc/NetworkManager/system-connections/poop-ap.nmconnection
sudo nmcli con reload
```

Activate the AP (SSH drops here):

```bash
sudo nmcli con up poop-ap
```

The Pi is now at `192.168.4.1` and broadcasting WiFi SSID `poop` / password `pooppoop`.

Verify it's active:

```bash
nmcli con show --active
```

You should see `poop-ap` in the list.

To revert back to normal WiFi client mode when done:

```bash
sudo nmcli con down poop-ap
sudo nmcli con up <your-normal-wifi-connection-name>
```

Check your normal connection name with `nmcli con show`.

---

To SSH back in after switching to AP: connect your laptop to the `poop` WiFi, then:

```bash
ssh poop@192.168.4.1
```

---

## 5. Find the ESP32-CAM's IP

Power on the ESP32-CAM and wait ~15 seconds for it to connect. Then check the ARP table:

```bash
ip neigh show
```

Look for a `192.168.4.x` entry that isn't `.1` (that's the Pi itself). The IP is assigned by DHCP and will vary — don't assume `.2`.

Update `sketch.js` with the actual IP:

```bash
nano "/home/poop/Desktop/web altar/sketch.js"
```

Find this line near the top and change the IP:

```js
var ESP32_STREAM_URL = 'http://192.168.4.x/stream';
```

Save: `Ctrl+O` → Enter → `Ctrl+X`

Verify the stream is reachable before opening the browser:

```bash
curl -I http://192.168.4.x/stream
# should return: HTTP/1.1 200 OK
```

> **Note:** The ESP32-CAM only handles one stream connection at a time. If the stream is black, make sure no other browser tab or terminal is already connected to the stream URL. The frontend retries automatically every 3 seconds.

---

## 6. Serve the frontend

From the `web altar` directory:

```bash
cd "/home/poop/Desktop/web altar"
python3 -m http.server 8080
```

Open `http://localhost:8080` in the browser.

### Auto-start on boot (gallery mode)

Set the server to start automatically:

```bash
sudo cp "/home/poop/Desktop/web altar/SETUP_files/web-altar.service" /etc/systemd/system/
sudo systemctl enable web-altar
sudo systemctl start web-altar
```

Set the browser to open in kiosk mode on login:

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/kiosk.desktop
```

Paste this content:

```ini
[Desktop Entry]
Type=Application
Name=web altar kiosk
Exec=chromium --kiosk --noerrdialogs --disable-infobars http://localhost:8080
```

Save: `Ctrl+O` → Enter → `Ctrl+X`

> If `chromium` doesn't work, try `chromium-browser`. Check which one exists: `which chromium chromium-browser`

---

## 7. SETUP_files reference

Supporting config files live in `SETUP_files/` in this repo:

| File | Purpose |
|------|---------|
| `poop-ap.nmconnection` | NetworkManager AP profile |
| `web-altar.service` | systemd unit for the HTTP server |

---

## Troubleshooting

**Stream doesn't appear in the corridor**
- Check ESP32-CAM is powered and connected: `ip neigh show`
- Confirm stream is reachable: `curl -I http://<ESP32_IP>/stream` (find IP with `ip neigh show`)
- Update `ESP32_STREAM_URL` in `sketch.js` to match
- Close any other browser tabs or terminals connected to the stream — only one connection allowed at a time
- The frontend auto-retries every 3s if the stream was down at page load — give it a moment if the ESP32-CAM is still booting

**Audio blocked on page load**
- Click anywhere or press any key — the browser requires a user gesture before audio starts
- This is intentional; the Skype ringtone begins on first interaction

**SSH locked out after enabling AP**
- Connect a keyboard/monitor to the Pi directly
- Or connect your laptop to the `poop` WiFi and SSH to `192.168.4.1`

**AP not activating**
- Check NetworkManager has the profile: `nmcli con show`
- Re-run the install steps from section 4
- Check for errors: `sudo journalctl -u NetworkManager -n 50`
