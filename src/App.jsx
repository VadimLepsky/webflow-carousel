console.log("BUILD CHECK", Math.random());

import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Image, useTexture } from "@react-three/drei";
import { easing } from "maath";
import "./util";

/* ================= APP ================= */

export default function App() {
  const progress = usePageScrollProgress();

  return (
    <Canvas
      eventSource={document}
      eventPrefix="client"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none" 
      }}
      camera={{ position: [0, 0, 100], fov: 15 }}
      gl={{
        alpha: false,
        antialias: true,
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050505", 1);
      }}
    >
      {/* ТУМАН */}
      <fog attach="fog" args={["#d10000", 10, 13]} />

      {/* КАРУСЕЛЬ */}
      <Rig progress={progress}>
        <Carousel />
      </Rig>

      {/* ЛЕНТА */}
      <Banner position={[0, -0.15, 0]} />
    </Canvas>
  );
}

/* ================= RIG ================= */

function Rig({ children, progress }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;

    const ROTATION_RANGE = Math.PI * 0.65;
    const BASE_OFFSET = -0.25;

    ref.current.rotation.y =
      -progress * ROTATION_RANGE + BASE_OFFSET;
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
      {/* FRONT — картинка */}
      <Image
        ref={ref}
        url={url}
        side={THREE.BackSide}
        transparent
        style={{ pointerEvents: "auto" }} 
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(true);
        }}
        onPointerOut={() => hover(false)}
      >
        <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
      </Image>

      {/* BACK — заливка */}
      <mesh>
        <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
        <meshBasicMaterial
          color="#000000"
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

/* ================= SCROLL LOGIC ================= */

function usePageScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = document.getElementById("carousel-root");
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // секция должна быть ПОЛНОСТЬЮ в экране
      const fullyVisible =
        rect.top >= 0 && rect.bottom <= vh;

      if (!fullyVisible) {
        setProgress(0);
        return;
      }

      const travel = vh - rect.height;
      const current = -rect.top;

      const p = Math.min(Math.max(current / travel, 0), 1);
      setProgress(p);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}