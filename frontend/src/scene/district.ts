import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const zoneSites: Record<string, [number, number, number]> = {
  Z01: [-24, 12, -12],
  Z02: [-8, 6, -12],
  Z03: [8, 4, -12],
  Z04: [24, 3, -12],
  Z05: [-24, 10, 12],
  Z06: [-8, 17, 12],
  Z07: [8, 4, 12],
  Z08: [24, 8, 12],
};
const materials = new Map<string, T.MeshStandardMaterial>();
function mat(color: string, metalness = 0, roughness = 0.72) {
  const key = `${color}:${metalness}:${roughness}`;
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({ color, metalness, roughness }),
    );
  return materials.get(key)!;
}
function mesh(
  g: T.BufferGeometry,
  color: string,
  p: number[],
  parent: T.Object3D,
  metal = 0,
  rough = 0.72,
) {
  const m = new T.Mesh(g, mat(color, metal, rough));
  m.position.set(p[0], p[1], p[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(
  parent: T.Object3D,
  p: number[],
  s: number[],
  c: string,
  metal = 0,
  rough = 0.72,
) {
  return mesh(new T.BoxGeometry(s[0], s[1], s[2]), c, p, parent, metal, rough);
}
function cylinder(
  parent: T.Object3D,
  p: number[],
  r: number,
  h: number,
  c: string,
) {
  return mesh(new T.CylinderGeometry(r, r, h, 12), c, p, parent, 0.35);
}
function beam(
  parent: T.Object3D,
  a: T.Vector3,
  b: T.Vector3,
  r: number,
  c: string,
) {
  const m = cylinder(
    parent,
    a.clone().add(b).multiplyScalar(0.5).toArray(),
    r,
    a.distanceTo(b),
    c,
  );
  m.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    b.clone().sub(a).normalize(),
  );
}
function tree(parent: T.Object3D, x: number, z: number, s = 1) {
  const g = new T.Group();
  g.position.set(x, 0.25, z);
  g.scale.setScalar(s);
  parent.add(g);
  cylinder(g, [0, 1.5, 0], 0.17, 3, "#75614b");
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const r = i < 3 ? 0.55 : 1.05;
    const m = mesh(
      new T.IcosahedronGeometry(1.15, 1),
      ["#426a38", "#527d42", "#63864a"][i % 3],
      [Math.cos(a) * r, 2.6 + (i % 3) * 0.6, Math.sin(a) * r],
      g,
    );
    m.scale.set(1, 0.85, 1);
  }
}
function building(
  parent: T.Object3D,
  x: number,
  z: number,
  w: number,
  d: number,
  floors: number,
  color: string,
) {
  const h = floors * 2.3;
  box(parent, [x, h / 2 + 0.3, z], [w, h, d], color);
  for (let f = 0; f < floors; f++) {
    const y = 1.5 + f * 2.3;
    box(parent, [x, y + 1.05, z], [w + 0.2, 0.16, d + 0.2], "#deddd4");
    for (let n = 0; n < Math.floor(w / 1.5); n++)
      for (const side of [-1, 1]) {
        const px = x - w / 2 + 0.8 + n * 1.5;
        box(
          parent,
          [px, y, z + side * (d / 2 + 0.03)],
          [1.02, 1.45, 0.06],
          "#426572",
          0.65,
          0.22,
        );
        box(
          parent,
          [px, y - 0.73, z + side * (d / 2 + 0.11)],
          [1.18, 0.09, 0.22],
          "#e3dfd2",
        );
      }
    for (let n = 0; n < Math.floor(d / 1.6); n++)
      for (const side of [-1, 1])
        box(
          parent,
          [x + side * (w / 2 + 0.03), y, z - d / 2 + 0.85 + n * 1.6],
          [0.06, 1.45, 1.08],
          "#426572",
          0.65,
          0.22,
        );
  }
  box(parent, [x, h + 0.45, z], [w + 0.35, 0.3, d + 0.35], "#8b928e");
  for (const side of [-1, 1]) {
    box(parent, [x + (side * w) / 2, h + 0.75, z], [0.15, 0.6, d], "#deddd4");
    box(parent, [x, h + 0.75, z + (side * d) / 2], [w, 0.6, 0.15], "#deddd4");
  }
  for (let i = 0; i < 2; i++) {
    box(
      parent,
      [x - w / 4 + (i * w) / 2, h + 0.9, z],
      [1.4, 0.75, 1.7],
      "#b8bdb8",
      0.4,
    );
    cylinder(
      parent,
      [x - w / 4 + (i * w) / 2, h + 1.31, z],
      0.47,
      0.08,
      "#414d52",
    );
    for (let k = 0; k < 5; k++)
      box(
        parent,
        [x - w / 4 + (i * w) / 2, h + 0.9, z - 0.7 + k * 0.3],
        [1.42, 0.07, 0.05],
        "#667371",
      );
  }
  box(
    parent,
    [x, 0.95, z + d / 2 + 0.08],
    [1.4, 1.8, 0.13],
    "#244451",
    0.7,
    0.2,
  );
  box(parent, [x, 2.05, z + d / 2 + 0.6], [2.3, 0.14, 1.3], "#c1beb0");
}
export function makeCar(color: string) {
  const g = new T.Group();
  box(g, [0, 0.6, 0], [1.65, 0.55, 3.5], color, 0.45, 0.28);
  box(g, [0, 1.02, -0.15], [1.43, 0.6, 1.85], "#28444f", 0.65, 0.19);
  box(g, [0, 1.36, -0.2], [1.5, 0.1, 1.65], color, 0.4, 0.3);
  for (const x of [-0.82, 0.82])
    for (const z of [-1.08, 1.08]) {
      const wheel = cylinder(g, [x, 0.36, z], 0.36, 0.2, "#24292d");
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(g, [x * 1.13, 0.36, z], 0.19, 0.02, "#a5afb3");
      hub.rotation.z = Math.PI / 2;
    }
  for (const x of [-0.55, 0.55]) {
    box(g, [x, 0.65, 1.77], [0.4, 0.18, 0.06], "#fff1c7");
    box(g, [x, 0.65, -1.77], [0.4, 0.15, 0.06], "#b34235");
  }
  return g;
}
function person(color: string) {
  const g = new T.Group();
  const body = mesh(
    new T.CapsuleGeometry(0.22, 0.42, 3, 6),
    color,
    [0, 1.12, 0],
    g,
  );
  body.scale.z = 0.68;
  mesh(new T.SphereGeometry(0.18, 8, 6), "#ba8c69", [0, 1.7, 0], g);
  const limbs: T.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const limb = new T.Group();
    limb.position.set(
      i < 2 ? (i === 0 ? -0.14 : 0.14) : i === 2 ? -0.3 : 0.3,
      i < 2 ? 0.86 : 1.37,
      0,
    );
    g.add(limb);
    const m = cylinder(
      limb,
      [0, i < 2 ? -0.36 : -0.29, 0],
      i < 2 ? 0.085 : 0.065,
      i < 2 ? 0.72 : 0.58,
      i < 2 ? "#343e4b" : color,
    );
    if (i < 2) box(limb, [0, -0.73, 0.07], [0.17, 0.12, 0.32], "#232c32");
    limbs.push(limb);
    m.castShadow = true;
  }
  return { g, limbs };
}
function bicycle() {
  const g = new T.Group();
  for (const z of [-0.65, 0.65]) {
    const m = mesh(
      new T.TorusGeometry(0.43, 0.045, 5, 16),
      "#242c32",
      [0, 0.46, z],
      g,
    );
    m.rotation.y = Math.PI / 2;
    const hub = new T.Vector3(0, 0.46, z);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      beam(
        g,
        hub,
        new T.Vector3(0, 0.46 + Math.cos(a) * 0.4, z + Math.sin(a) * 0.4),
        0.012,
        "#9ca7aa",
      );
    }
  }
  const a = new T.Vector3(0, 0.46, -0.65),
    b = new T.Vector3(0, 0.46, 0.65),
    c = new T.Vector3(0, 1.05, -0.2),
    d = new T.Vector3(0, 0.5, 0),
    e = new T.Vector3(0, 1.05, 0.4);
  for (const [p, q] of [
    [a, c],
    [c, d],
    [d, a],
    [c, e],
    [e, d],
    [e, b],
    [d, b],
  ])
    beam(g, p, q, 0.035, "#c47d38");
  box(g, [0, 1.1, -0.2], [0.25, 0.1, 0.32], "#2c3338");
  beam(g, e, new T.Vector3(0, 1.3, 0.48), 0.035, "#aab2b2");
  box(g, [0, 1.3, 0.48], [0.5, 0.05, 0.05], "#535e62");
  const rider = person("#b16845");
  rider.g.position.y = 0.35;
  rider.g.rotation.x = 0.2;
  g.add(rider.g);
  return g;
}
function batchStatic(root: T.Group) {
  root.updateMatrixWorld(true);
  const groups = new Map<T.Material, T.BufferGeometry[]>();
  root.traverse((o) => {
    if (o instanceof T.Mesh) {
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      const material = o.material as T.Material;
      const list = groups.get(material) || [];
      list.push(g);
      groups.set(material, list);
    }
  });
  const merged = new T.Group();
  for (const [material, geos] of groups) {
    const m = new T.Mesh(mergeGeometries(geos, false)!, material);
    m.castShadow = true;
    m.receiveShadow = true;
    merged.add(m);
    geos.forEach((g) => g.dispose());
  }
  root.traverse((o) => {
    if (o instanceof T.Mesh) o.geometry.dispose();
  });
  return merged;
}
export function createDistrict() {
  const detail = new T.Group();
  box(detail, [0, -0.55, 0], [70, 1, 47], "#8b9492");
  box(detail, [0, -0.02, 0], [69, 0.1, 46], "#484f50");
  // Raised plots leave continuous, separated road and pavement corridors.
  for (const x of [-24, -8, 8, 24])
    for (const z of [-12, 12])
      box(detail, [x, 0.15, z], [14, 0.3, 17.5], "#c3c1b5");
  for (let x = -33; x < 34; x += 3) {
    box(detail, [x, 0.045, 0], [1.4, 0.02, 0.12], "#e4d9ad");
    for (const z of [-22, 22])
      box(detail, [x, 0.045, z], [1.4, 0.02, 0.12], "#e4d9ad");
  }
  for (const x of [-34, 34])
    for (let z = -20; z < 21; z += 3)
      box(detail, [x, 0.045, z], [0.12, 0.02, 1.4], "#e4d9ad");
  for (const x of [-16, 0, 16])
    for (let z = -21; z < 22; z += 3)
      box(detail, [x, 0.045, z], [0.1, 0.02, 1.2], "#e4d9ad");
  for (const x of [-28, -12, 12, 28])
    for (let i = 0; i < 7; i++)
      box(detail, [x + i * 0.42, 0.06, 0], [0.22, 0.03, 5.4], "#e9e8df");
  building(detail, -26, -12, 5.2, 8, 4, "#b8b3a6");
  building(detail, -20, -13, 4.5, 6, 3, "#b09c85");
  building(detail, -27, 11, 4.8, 7, 3, "#d4c4ac");
  building(detail, -21, 13, 4.8, 7, 4, "#c4b39d");
  building(detail, -8, 12, 9, 10, 6, "#b4bfc0");
  for (let x = -11; x < -4; x += 1.5)
    for (const z of [9, 11, 13]) {
      const p = box(
        detail,
        [x, 15.1, z],
        [1.25, 0.09, 1.55],
        "#1c405a",
        0.65,
        0.2,
      );
      p.rotation.x = 0.25;
    }
  // Garden paths, planting beds and seating.
  box(detail, [-8, 0.33, -12], [12, 0.08, 15], "#6c8853");
  box(detail, [-8, 0.4, -12], [2, 0.06, 15], "#d5cdb8");
  box(detail, [-8, 0.4, -12], [12, 0.06, 1.6], "#d5cdb8");
  for (const x of [-12, -4])
    for (const z of [-17, -8]) tree(detail, x, z, 1.05);
  for (const x of [-10, -6])
    for (const z of [-16, -9]) {
      box(detail, [x, 0.8, z], [1.8, 0.15, 0.55], "#947457");
      box(detail, [x, 1.13, z - 0.3], [1.8, 0.55, 0.08], "#947457");
      for (const dx of [-0.65, 0.65])
        box(detail, [x + dx, 0.55, z], [0.1, 0.6, 0.5], "#505c5d");
    }
  box(detail, [8, 0.34, -12], [11, 0.12, 13], "#b9a783");
  box(detail, [8, 0.43, -12], [8, 0.04, 10], "#bf8262");
  for (const x of [4, 12])
    box(detail, [x, 0.46, -12], [0.06, 0.02, 10], "#f1e1cb");
  for (const z of [-17, -7])
    box(detail, [8, 0.46, z], [8, 0.02, 0.06], "#f1e1cb");
  box(detail, [24, 0.32, -12], [12, 0.04, 15], "#5c6361");
  for (let i = 0; i < 6; i++) {
    const x = 19 + i * 2;
    for (const z of [-16, -8]) {
      box(detail, [x, 0.36, z], [0.06, 0.02, 4.3], "#ddd8c7");
      if (i % 3 !== 1) {
        const c = makeCar(["#e2ded1", "#6e8b98", "#a06453"][i % 3]);
        c.position.set(x + 1, 0.35, z);
        detail.add(c);
      }
    }
  }
  // Reflective retention pond, stone coping and promenade.
  box(detail, [8, 0.35, 12], [12, 0.2, 15], "#a5afa7");
  box(detail, [8, 0.47, 12], [10.8, 0.04, 13.8], "#488995", 0.55, 0.17);
  for (let i = 0; i < 22; i++) {
    const m = box(
      detail,
      [3.4 + (i % 5) * 2.1, 0.5, 6 + ((i * 1.71) % 12)],
      [0.8 + (i % 3) * 0.3, 0.008, 0.035],
      "#88b5b8",
      0.45,
      0.2,
    );
    m.rotation.y = 0.15;
  }
  for (const z of [6, 18]) for (const x of [3, 13]) tree(detail, x, z, 0.8);
  building(detail, 24, 13, 10, 9, 2, "#b4b4a9");
  for (const x of [21, 24, 27]) {
    cylinder(detail, [x, 6, 12], 0.85, 2, "#b9c2c0");
    cylinder(detail, [x, 7.05, 12], 0.88, 0.12, "#d7dbd5");
  }
  for (let i = 0; i < 3; i++) {
    const pipe = cylinder(
      detail,
      [24, 5.5, 15 + i * 0.45],
      0.12,
      11,
      "#8dacae",
    );
    pipe.rotation.z = Math.PI / 2;
  }
  for (const x of [-30, -18, -14, -2, 2, 14, 18, 30])
    for (const z of [-3, 3]) {
      cylinder(detail, [x, 2.4, z], 0.07, 4.3, "#4f6267");
      box(detail, [x, 4.6, z + 0.4], [0.14, 0.15, 0.9], "#53676a");
      box(detail, [x, 4.51, z + 0.7], [0.3, 0.05, 0.4], "#f5e8b5");
    }
  for (const x of [-30, -18, -14, -2, 2, 14, 18, 30])
    for (const z of [-19.5, 19.5]) tree(detail, x, z, 0.62);
  const root = new T.Group();
  root.name = "Urban microclimate district";
  root.add(batchStatic(detail));
  const traffic = new T.Group(),
    people = new T.Group();
  root.add(traffic, people);
  const actors: {
    g: T.Group;
    speed: number;
    offset: number;
    kind: string;
    limbs?: T.Group[];
  }[] = [];
  for (let i = 0; i < 8; i++) {
    const g = makeCar(["#deded4", "#467486", "#ac604d", "#697669"][i % 4]);
    traffic.add(g);
    actors.push({ g, speed: 3.2, offset: i / 8, kind: "car" });
  }
  for (let i = 0; i < 5; i++) {
    const g = bicycle();
    traffic.add(g);
    actors.push({ g, speed: 1.8, offset: i / 5, kind: "bike" });
  }
  for (let i = 0; i < 22; i++) {
    const p = person(["#526e86", "#b47c57", "#778566", "#ddd8c8"][i % 4]);
    people.add(p.g);
    actors.push({
      g: p.g,
      limbs: p.limbs,
      speed: 0.7,
      offset: i / 22,
      kind: "person",
    });
  }
  function route(t: number, x: number, z: number) {
    const length = 4 * (x + z);
    let d = ((t % length) + length) % length;
    if (d < 2 * x) return { x: -x + d, z: -z, a: Math.PI / 2 };
    d -= 2 * x;
    if (d < 2 * z) return { x, z: -z + d, a: 0 };
    d -= 2 * z;
    if (d < 2 * x) return { x: x - d, z, a: -Math.PI / 2 };
    d -= 2 * x;
    return { x: -x, z: z - d, a: Math.PI };
  }
  return {
    root,
    traffic,
    people,
    update(time: number) {
      actors.forEach((a, i) => {
        const x = a.kind === "person" ? 30.6 : a.kind === "bike" ? 32.3 : 34;
        const z = a.kind === "person" ? 19.7 : a.kind === "bike" ? 21 : 22;
        const p = route(time * a.speed + a.offset * 4 * (x + z), x, z);
        a.g.position.set(p.x, a.kind === "person" ? 0.31 : 0.06, p.z);
        a.g.rotation.y = p.a;
        a.limbs?.forEach((l, j) => {
          l.rotation.x = Math.sin(time * 5 + i + (j % 2) * Math.PI) * 0.42;
        });
      });
    },
  };
}
