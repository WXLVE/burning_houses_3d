import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Billboard } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Leva, useControls } from "leva";


function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}


// 🔥 Fire (always faces camera)
function Fire({ active }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const t = clock.getElapsedTime();

    ref.current.scale.y = 1 + Math.sin(t * 10) * 0.2;
    ref.current.material.opacity = active
      ? 0.7 + Math.sin(t * 15) * 0.2
      : 0;
  });

  return (
    <Billboard position={[0, 1.2, 0]}>
      <mesh ref={ref}>
        <planeGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="orange"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}

// 🌫️ Smoke
function Smoke({ active }) {
  const points = useRef();

  const particles = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededRandom(i) - 0.5) * 0.5;
      positions[i * 3 + 1] = seededRandom(i * 3) * 2;
      positions[i * 3 + 2] = (seededRandom(i * 2) - 0.5) * 0.5;
    }

    return positions;
  }, []);

  useFrame(() => {
    if (!points.current || !active) return;

    const pos = points.current.geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3 + 1] += 0.02;

      if (pos.array[i * 3 + 1] > 3) {
        pos.array[i * 3 + 1] = 0;
      }
    }

    pos.needsUpdate = true;
  });

  return (
    <points ref={points} visible={active}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} transparent opacity={0.4} />
    </points>
  );
}

// 🏠 House
function House({ position, fireLevel, index, total }) {
  const ref = useRef();
  const isBurning = index / total < fireLevel;

  useFrame(() => {
    if (!ref.current) return;

    ref.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if ("emissive" in child.material) {
          child.material.emissive.set(isBurning ? 0xff2200 : 0x000000);
          child.material.emissiveIntensity = isBurning ? 1 : 0;
        }
      }
    });
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      <Fire active={isBurning} />
      <Smoke active={isBurning} />
    </group>
  );
}

// 🏘️ Village (FIXED: stable positions)
function Village({ fireLevel }) {
  const total = 100;

  const positions = useMemo(() => {
    return Array.from({ length: total }, (_, i) => [
      (seededRandom(i) - 0.5) * 20,
      0,
      (seededRandom(i * 2) - 0.5) * 20,
    ]);
  }, []);

  return (
    <>
      {positions.map((pos, i) => (
        <House
          key={i}
          index={i}
          total={total}
          fireLevel={fireLevel}
          position={pos}
        />
      ))}
    </>
  );
}

// 🌍 Scene
function Scene() {
  const { fire } = useControls({
    fire: { value: 0, min: 0, max: 1 },
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="green" />
      </mesh>

      <Village fireLevel={fire} />

      <OrbitControls />
    </>
  );
}

function Model({ fireLevel }) {
  const { scene } = useGLTF("my_city.glb");
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;

    let meshes = [];

    ref.current.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });

    meshes.forEach((mesh, i) => {
      const isBurning = i / meshes.length < fireLevel;

      if ("emissive" in mesh.material) {
        mesh.material.emissive.set(isBurning ? 0xff2200 : 0x000000);
        mesh.material.emissiveIntensity = isBurning ? 1 : 0;
      }
    });
  });

  useEffect(() => {
    scene.traverse((child) => {
      console.log(child.type, child.name);
    });
  }, [scene]);

  return <primitive ref={ref} object={scene} />;
}

// 🚀 App
export default function App() {
  return (
    
    <>
      <Leva />
      <Canvas
      style={{ width: "100vw", height: "100vh" }}
      camera={{ position: [10, 10, 10], fov: 60 }}>
        <Scene />
      </Canvas>
    </>
  );
}