# Robot Car — Interactive 3D Showcase

A dark, cinematic, responsive website inspired by the uploaded reference video. It displays the supplied robot-car GLB in a Three.js studio scene.

## Included

- `index.html` — website and interactive 3D viewer
- `assets/robot-car.glb` — robot car model used by the site

## Run locally

The page loads the GLB with JavaScript modules, so open it through a local web server rather than double-clicking `index.html`.

### Option A — Python

1. Extract the ZIP file.
2. Open a terminal in the extracted `robot-car-showcase` folder.
3. Run:

   ```bash
   python -m http.server 8000
   ```

4. Open `http://localhost:8000` in Chrome or Edge.

### Option B — Visual Studio Code

1. Open the extracted folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**.

## Controls

- Drag with mouse or finger: rotate the model
- Scroll / pinch: zoom
- `3/4`, `S`, `F`, `T`: switch camera views
- `+` / `−`: zoom in or out
- `↺`: reset camera
- `Pause` / `Rotate`: stop or resume automatic rotation
- `Details`: open the component breakdown panel

## Notes

- Three.js modules are loaded from jsDelivr, and fonts from Google Fonts, so an internet connection is required when viewing the site unless those dependencies are downloaded and hosted locally.
- The model itself is stored locally in `assets/robot-car.glb`.
- The GLB is displayed as provided; the viewer does not alter its geometry.
