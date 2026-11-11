# Detailed urban digital twin

This update replaces the original block scene with a detailed, editable urban district. It is an illustrative environment, not a surveyed city, engineering CAD drawing or photogrammetric reconstruction. The original archive did not contain CAD, GLB or a source model from TR AWARE.

## Included

- Articulated façades, window glazing, roof parapets, HVAC, solar arrays and industrial utility details.
- Raised pavements, road markings, pedestrian crossings, street lamps, parking bays and parked cars.
- Landscaped park, seating, sports court, trees and a reflective retention pond.
- 22 walking pedestrians, 8 cars and 5 bicycles on separated perimeter routes.
- Day/dusk lighting, orbit/pan/zoom, top/reset view, fullscreen, independent motion pause and visibility layers.
- Existing zone telemetry and clickable status labels. The model stays visible if the backend is offline; labels require actual replay data.

## Start on your Mac

Keep your existing model file and backend environment. This archive does not include the separately supplied Random Forest model.

Backend, in one terminal:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

For a fresh backend setup, follow README.md and setup_model.sh. Your old virtual environment should be recreated if you move it between folders or machines.

Frontend, in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173 and select Digital Twin. Dependencies and virtual environments are excluded from the archive; install dependencies locally. The frontend proxies API and WebSocket traffic to the backend so phones no longer try to connect to their own localhost.

## Phone AR

### Android WebXR

1. Serve the app through a trusted HTTPS address, using the example deployment below.
2. Open the address on a WebXR/ARCore-capable Android browser.
3. Tap Phone AR and allow the camera permission requested by the browser.
4. Move the phone slowly across a well-lit floor or table until the green placement ring appears.
5. Tap to place the district at approximately one metre wide. Walk around to inspect it. People and traffic continue animating; telemetry continues when connected.
6. Tap Exit AR to restore the normal view.

The scene remains hidden before placement. Unsupported browsers receive an explanation instead of a simulated camera view. Phone AR cannot run from an ordinary local-network HTTP address. A phone's localhost points to that phone, not your Mac.

### iPhone / iPad

Open the HTTPS site in Safari, tap Phone AR, then Open iPhone AR. This opens the bundled USDZ in Apple Quick Look for surface placement and scaling. This is a static model snapshot: movement and live telemetry remain available in the web 3D view, not in Quick Look.

### HTTPS deployment

Build with `cd frontend && npm run build`. `deploy/Caddyfile` serves the build and proxies `/api` and `/ws` on the same HTTPS origin. Set APP_DOMAIN to your domain and APP_DIST to the absolute dist directory, then run Caddy with that file. The domain must resolve to the deployment machine, certificates must be trusted on the phone, and the FastAPI backend must run on port 8000. Do not expose this research demo publicly without adding authentication and appropriate access controls. For a private LAN, configure a trusted local certificate and DNS; a self-signed warning is not a completed HTTPS setup.

## Editable model and exports

`frontend/src/scene/district.ts` is the editable parametric scene source. Dimensions use metres. Existing Z01–Z08 identifiers remain mapped to the district plots.

`frontend/public/models/urban-microclimate-district.glb` can be imported into Blender or other glTF-compatible tools. `urban-microclimate-district.usdz` is the tabletop-scale Apple AR snapshot. These are polygonal models, not STEP/DWG solids. The web application builds the district from TypeScript, so edits to the standalone GLB do not automatically alter the application.

After editing the scene, regenerate the packaged assets:

```bash
cd frontend
npm run export:models
npm run build
```

Export GLB in the viewer exports the current geometry and actor positions without sensor labels. GLB/USDZ exports are static snapshots; live movement is implemented in the application. Lighting is daylight/dusk styling, not a solar-position simulation. Water uses a reflective material, not a fluid simulation.

## Validation

TypeScript and production build passed. The model export script checks finite geometry, district bounds, actor counts, vehicle movement, GLB header and USDZ signature; both exports completed. The GLB was imported into Blender for a separate model inspection. Browser interaction and physical Android/iPhone AR acceptance were not completed in the execution environment and must be verified on the target devices.
