console.log("CHECK", Date.now());

import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Image, useTexture } from "@react-three/drei";
import { easing } from "maath";
import "./util";

let EXTERNAL_PROGRESS = 0;

export default function App() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
  function onMessage(e) {
    if (typeof e.data?.carouselProgress === "number") {
      EXTERNAL_PROGRESS = Math.min(
        Math.max(e.data.carouselProgress, 0),
        1
      );
    }
  }

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, []);

  return (
    <Canvas
      style={{ position: "fixed", inset: 0 }}
      camera={{ position: [0, 0, 100], fov: 15 }}
      gl={{
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050505", 1);
      }}
    >
      {/* Лёгкий красный туман */}
      <fog attach="fog" args={["#d10000", 10, 13]} />

      <Rig rotation={progress}>
        <Carousel />
      </Rig>

      <Banner position={[0, -0.15, 0]} />
    </Canvas>
  );
}

/* ================= RIG ================= */

function Rig({ children }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;

    const ROTATION_RANGE = Math.PI * 0.6;
    const BASE_OFFSET = 0;

    ref.current.rotation.y =
      BASE_OFFSET - EXTERNAL_PROGRESS * ROTATION_RANGE;
  });

  return <group ref={ref}>{children}</group>;
}

/* ================= CAROUSEL ================= */

function Carousel({ radius = 1.4, count = 8 }) {
  return Array.from({ length: count }, (_, i) => (
    <Card
      key={i}
      url={`/img${(i % 8) + 1}_.jpg`}
      position={[
        Math.sin((i / count) * Math.PI * 2) * radius,
        0,
        Math.cos((i / count) * Math.PI * 2) * radius,
      ]}
      rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
    />
  ));
}

/* ================= CARD ================= */

function Card({ url, ...props }) {
  const ref = useRef();
  const [hovered, hover] = useState(false);

  useFrame((_, delta) => {
    easing.damp3(ref.current.scale, hovered ? 1.15 : 1, 0.15, delta);
    easing.damp(ref.current.material, "radius", hovered ? 0.06 : 0.03, 0.2, delta);
    easing.damp(ref.current.material, "zoom", hovered ? 1 : 1.5, 0.2, delta);
  });

  return (
    <group {...props}>
      {/* FRONT — картинка (снаружи кольца) */}
      <Image
        ref={ref}
        url={url}
        side={THREE.BackSide}
        transparent
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(true);
        }}
        onPointerOut={() => hover(false)}
      >
        <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
      </Image>

      {/* BACK — чёрная заливка (внутри кольца) */}
      <mesh>
        <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
        <meshBasicMaterial
          color="#fffffff"
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ================= BANNER ================= */

function Banner(props) {
  const ref = useRef();
  const texture = useTexture("/work_.png");

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  useFrame((_, delta) => {
    ref.current.rotation.y = 1.5;
    ref.current.material.map.offset.x += delta / 1.8;
  });

  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry args={[1.6, 1.6, 0.14, 128, 16, true]} />
      <meshSineMaterial
        map={texture}
        map-repeat={[30, 1]}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ================= EXTERNAL SCROLL ================= */

function useExternalCarouselProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf;

    const loop = () => {
      // значение приходит ИЗ Webflow
      if (typeof window !== "undefined") {
        setProgress(window.__CAROUSEL_PROGRESS__ || 0);
      }
      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return progress;
}