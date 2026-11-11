import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

// Exporters use the browser FileReader interface even for untextured Node exports.
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
    this.onloadend?.();
  }
};
const temporary = new URL("./.district-runtime.mjs", import.meta.url);
try {
  await build({
    entryPoints: [
      fileURLToPath(new URL("../src/scene/district.ts", import.meta.url)),
    ],
    outfile: fileURLToPath(temporary),
    bundle: true,
    platform: "node",
    format: "esm",
    external: ["three", "three/*"],
  });
  const { createDistrict } = await import(temporary.href);
  const district = createDistrict();
  district.update(0);
  assert.equal(district.people.children.length, 22);
  assert.equal(district.traffic.children.length, 13);
  const start = district.traffic.children[0].position.clone();
  district.update(10);
  assert.ok(
    start.distanceTo(district.traffic.children[0].position) > 1,
    "Vehicles must advance",
  );
  let triangles = 0,
    meshes = 0;
  district.root.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    const geometry = object.geometry;
    assert.ok(geometry.attributes.position.array.every(Number.isFinite));
    triangles +=
      (geometry.index?.count ?? geometry.attributes.position.count) / 3;
  });
  district.update(0);
  district.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(district.root);
  assert.ok(bounds.max.y < 25 && bounds.min.x >= -36 && bounds.max.x <= 36);
  const output = new URL("../public/models/", import.meta.url);
  await mkdir(output, { recursive: true });
  const glb = await new GLTFExporter().parseAsync(district.root, {
    binary: true,
  });
  assert.equal(new DataView(glb).getUint32(0, true), 0x46546c67);
  await writeFile(
    new URL("urban-microclimate-district.glb", output),
    Buffer.from(glb),
  );
  district.root.scale.setScalar(0.014);
  district.root.updateMatrixWorld(true);
  const usdz = await new USDZExporter().parseAsync(district.root, {
    quickLookCompatible: true,
  });
  assert.equal(usdz[0], 0x50);
  await writeFile(new URL("urban-microclimate-district.usdz", output), usdz);
  console.log(
    JSON.stringify(
      {
        meshes,
        triangles,
        movingPeople: 22,
        movingCars: 8,
        movingBicycles: 5,
        glbBytes: glb.byteLength,
        usdzBytes: usdz.byteLength,
        checks: "passed",
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(temporary).catch(() => {});
}
