import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Stars } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const GlowingOrb = ({ color, position, scale, speed, distort }: any) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.2;
      ref.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={ref} position={position} scale={scale} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          envMapIntensity={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.8}
          roughness={0.2}
          distort={distort}
          speed={speed * 2}
          opacity={0.4}
          transparent
        />
      </Sphere>
    </Float>
  );
};

export const Scene3D = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#050816] opacity-90 z-10" />
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#4F46E5" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#06B6D4" />
        
        <GlowingOrb color="#4F46E5" position={[-4, 2, -5]} scale={3} speed={1} distort={0.4} />
        <GlowingOrb color="#8B5CF6" position={[4, -2, -8]} scale={4} speed={0.8} distort={0.5} />
        <GlowingOrb color="#06B6D4" position={[0, -4, -4]} scale={2.5} speed={1.2} distort={0.3} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
};
