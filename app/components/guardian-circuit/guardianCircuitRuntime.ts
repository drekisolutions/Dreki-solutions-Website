import type {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Scene,
} from "three";

type ThreeModule = typeof import("three");

type CircuitRuntimeOptions = {
  canvas: HTMLCanvasElement;
  context: WebGL2RenderingContext;
  viewport: HTMLElement;
  initialStage: number;
};

export type GuardianCircuitRuntime = {
  selectStage: (stage: number) => void;
  setActive: (active: boolean) => void;
  dispose: (loseContext?: boolean) => void;
};

type NodeVisual = {
  group: Group;
  coreMaterial: MeshStandardMaterial;
  haloMaterial: MeshBasicMaterial;
  ring: Mesh;
};

const MAX_BUFFER_PIXELS = 1_800_000;
const MAX_DPR = 1.5;
const TRANSITION_MS = 640;
const STAGE_COUNT = 6;

const stagePositions = [
  [-4.45, 0.85, 0.02],
  [-2.7, -0.55, 0.28],
  [-0.95, 0.58, -0.08],
  [0.9, -0.38, 0.48],
  [2.7, 0.68, 0.02],
  [4.45, -0.1, 0.22],
] as const;

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function seededRandomFactory() {
  let state = 0x5f3759df;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function disposeScene(scene: Scene) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();

  scene.traverse((object: Object3D) => {
    const renderable = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };

    if (renderable.geometry) geometries.add(renderable.geometry);
    if (Array.isArray(renderable.material)) {
      renderable.material.forEach((material) => materials.add(material));
    } else if (renderable.material) {
      materials.add(renderable.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  scene.clear();
}

export function createGuardianCircuitRuntime(
  THREE: ThreeModule,
  {
    canvas,
    context,
    viewport,
    initialStage,
  }: CircuitRuntimeOptions,
): GuardianCircuitRuntime {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x000000, 0);

  const circuit = new THREE.Group();
  circuit.rotation.x = -0.08;
  circuit.rotation.z = -0.025;
  scene.add(circuit);

  scene.add(new THREE.HemisphereLight(0xa9ddf1, 0x11141a, 1.45));

  const copperLight = new THREE.PointLight(0xd08455, 14, 9, 1.8);
  copperLight.position.set(0.8, 0.1, 3.4);
  scene.add(copperLight);

  const glacialLight = new THREE.PointLight(0x9edff6, 11, 8, 1.8);
  glacialLight.position.set(-2.4, 1.8, 2.8);
  scene.add(glacialLight);

  const positions = stagePositions.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z),
  );
  const path = new THREE.CatmullRomCurve3(
    positions,
    false,
    "catmullrom",
    0.32,
  );

  const conduit = new THREE.Mesh(
    new THREE.TubeGeometry(path, 128, 0.048, 8, false),
    new THREE.MeshStandardMaterial({
      color: 0x6d422e,
      emissive: 0x2c160f,
      emissiveIntensity: 0.7,
      metalness: 0.82,
      roughness: 0.31,
    }),
  );
  circuit.add(conduit);

  const current = new THREE.Mesh(
    new THREE.TubeGeometry(path, 128, 0.015, 6, false),
    new THREE.MeshBasicMaterial({
      color: 0xa8e4f8,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
    }),
  );
  circuit.add(current);

  const nodeGeometry = new THREE.IcosahedronGeometry(0.23, 2);
  const ringGeometry = new THREE.TorusGeometry(0.43, 0.026, 8, 48);
  const haloGeometry = new THREE.RingGeometry(0.49, 0.66, 48);
  const nodes: NodeVisual[] = [];

  positions.forEach((position, index) => {
    const group = new THREE.Group();
    group.position.copy(position);

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: index === 3 ? 0xd08a5d : 0x9bdcf4,
      emissive: index === 3 ? 0x8d4529 : 0x3b93b3,
      emissiveIntensity: 0.72,
      metalness: 0.72,
      roughness: 0.24,
    });
    const core = new THREE.Mesh(nodeGeometry, coreMaterial);
    core.rotation.set(0.34 + index * 0.08, index * 0.27, 0.1);
    group.add(core);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: index === 3 ? 0xd28c5d : 0x7a94a2,
      emissive: index === 3 ? 0x6f321e : 0x213d49,
      emissiveIntensity: 0.55,
      metalness: 0.9,
      roughness: 0.3,
      transparent: true,
      opacity: 0.88,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = index % 2 === 0 ? 0.38 : -0.32;
    ring.rotation.y = 0.22 + index * 0.07;
    group.add(ring);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: index === 3 ? 0xd88e5e : 0x91d9f2,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.z = -0.03;
    group.add(halo);

    if (index === 3) {
      const approvalGateMaterial = new THREE.MeshStandardMaterial({
        color: 0xc67a4c,
        emissive: 0x6d2e1b,
        emissiveIntensity: 0.7,
        metalness: 0.88,
        roughness: 0.28,
        transparent: true,
        opacity: 0.88,
      });
      const outerGate = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.035, 8, 56),
        approvalGateMaterial,
      );
      outerGate.rotation.set(-0.24, 0.18, 0.12);
      group.add(outerGate);

      const innerGate = new THREE.Mesh(
        new THREE.TorusGeometry(0.56, 0.018, 8, 56),
        approvalGateMaterial,
      );
      innerGate.rotation.set(0.28, -0.16, -0.08);
      group.add(innerGate);
    }

    circuit.add(group);
    nodes.push({ group, coreMaterial, haloMaterial, ring });
  });

  const signalMaterial = new THREE.MeshBasicMaterial({
    color: 0xd7f4ff,
    blending: THREE.AdditiveBlending,
  });
  const signal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.12, 2),
    signalMaterial,
  );
  circuit.add(signal);

  const signalHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 16),
    new THREE.MeshBasicMaterial({
      color: 0x8cd9f6,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  signal.add(signalHalo);

  const gridPositions: number[] = [];
  for (let x = -6; x <= 6; x += 0.75) {
    gridPositions.push(x, -3.2, -1.15, x, 3.2, -1.15);
  }
  for (let y = -3; y <= 3; y += 0.75) {
    gridPositions.push(-6.2, y, -1.15, 6.2, y, -1.15);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(gridPositions, 3),
  );
  const grid = new THREE.LineSegments(
    gridGeometry,
    new THREE.LineBasicMaterial({
      color: 0x466574,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    }),
  );
  circuit.add(grid);

  const random = seededRandomFactory();
  const particlePositions: number[] = [];
  for (let index = 0; index < 74; index += 1) {
    particlePositions.push(
      (random() - 0.5) * 12,
      (random() - 0.5) * 6.2,
      -0.75 + random() * 1.35,
    );
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(particlePositions, 3),
  );
  circuit.add(
    new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x9bdcf4,
        size: 0.025,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );

  let active = true;
  let disposed = false;
  let frame: number | null = null;
  let visualStage = Math.max(0, Math.min(STAGE_COUNT - 1, initialStage));
  let transition:
    | { from: number; to: number; startedAt: number }
    | undefined;

  const renderScene = () => {
    const pathPosition = path.getPoint(visualStage / (STAGE_COUNT - 1));
    signal.position.copy(pathPosition);
    glacialLight.position.set(
      pathPosition.x - 0.3,
      pathPosition.y + 0.65,
      pathPosition.z + 2.5,
    );

    nodes.forEach((node, index) => {
      const emphasis = Math.max(0, 1 - Math.abs(index - visualStage));
      const scale = 1 + emphasis * 0.28;
      node.group.scale.setScalar(scale);
      node.coreMaterial.emissiveIntensity = 0.58 + emphasis * 1.65;
      node.haloMaterial.opacity = 0.045 + emphasis * 0.24;
      node.ring.rotation.z = index * 0.18 + visualStage * 0.08;
    });

    circuit.rotation.y = (visualStage - 2.5) * -0.018;
    camera.position.x = (visualStage - 2.5) * 0.12;
    camera.lookAt(camera.position.x * 0.24, 0.05, 0);
    renderer.render(scene, camera);
  };

  const tick = (timestamp: number) => {
    frame = null;
    if (!active || disposed) return;

    if (transition) {
      const progress = Math.min(
        1,
        (timestamp - transition.startedAt) / TRANSITION_MS,
      );
      visualStage =
        transition.from +
        (transition.to - transition.from) * easeInOutCubic(progress);

      if (progress >= 1) {
        visualStage = transition.to;
        transition = undefined;
      }
    }

    renderScene();
    if (transition) frame = window.requestAnimationFrame(tick);
  };

  const requestRender = () => {
    if (!active || disposed || frame !== null) return;
    frame = window.requestAnimationFrame(tick);
  };

  const resize = () => {
    if (disposed) return;

    const bounds = viewport.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      MAX_DPR,
      Math.sqrt(MAX_BUFFER_PIXELS / (width * height)),
    );

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width / height < 1.45 ? 13.4 : 11.2;
    camera.updateProjectionMatrix();
    requestRender();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  resize();

  return {
    selectStage(stage) {
      const target = Math.max(0, Math.min(STAGE_COUNT - 1, stage));
      if (target === visualStage && !transition) {
        requestRender();
        return;
      }

      transition = {
        from: visualStage,
        to: target,
        startedAt: performance.now(),
      };
      requestRender();
    },
    setActive(nextActive) {
      active = nextActive;
      if (!active && frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      if (active) requestRender();
    },
    dispose(loseContext = false) {
      if (disposed) return;
      disposed = true;
      resizeObserver.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      disposeScene(scene);
      renderer.renderLists.dispose();
      renderer.dispose();
      if (loseContext) renderer.forceContextLoss();
      canvas.width = 1;
      canvas.height = 1;
    },
  };
}
