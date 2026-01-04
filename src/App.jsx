console.log("CHECK", Date.now());

import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Image, useTexture } from "@react-three/drei";
import { easing } from "maath";
import "./util";

export default function App() {
  const progress = useExternalCarouselProgress();

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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

      <Rig rotation={[0, 0, 0.15]} scrollProgress={scrollProgress}>
        <Carousel />
      </Rig>

      <Banner position={[0, -0.15, 0]} />
    </Canvas>
  );
}

/* ================= RIG ================= */

function Rig(props) {
  const ref = useRef();

  useFrame((state, delta) => {
    ref.current.rotation.y = -0.25;

    easing.damp3(
      state.camera.position,
      [-state.pointer.x * 2, state.pointer.y + 1.5, 10],
      0.3,
      delta
    );

    state.camera.lookAt(0, 0, 0);
  });

  return <group ref={ref} {...props} />;
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

function useExternalScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf;

    const loop = () => {
      const p = window.__CAROUSEL_PROGRESS__ ?? 0;
      setProgress(p);
      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return progress;
}