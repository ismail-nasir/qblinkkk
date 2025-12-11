
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

const FloatingParticles = () => {
  const count = 50;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = new THREE.Object3D();

  useFrame((state) => {
    if (!mesh.current) return;
    
    // Light follows mouse slightly
    if (light.current) {
        light.current.position.x = (state.mouse.x * 20);
        light.current.position.y = (state.mouse.y * 20);
    }

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <pointLight ref={light} distance={40} intensity={20} color="#3b82f6" />
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshPhysicalMaterial 
            color="#eff6ff" 
            roughness={0} 
            metalness={0.1} 
            transmission={0.9} 
            thickness={1} 
            clearcoat={1} 
        />
      </instancedMesh>
    </>
  );
};

const MainShape = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state, delta) => {
        if(meshRef.current) {
            meshRef.current.rotation.x += delta * 0.1;
            meshRef.current.rotation.y += delta * 0.15;
            // Gentle float based on mouse
            meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, state.mouse.x * 2, 0.1);
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, state.mouse.y * 2, 0.1);
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={meshRef} position={[4, 0, 0]} scale={2.5}>
                <torusKnotGeometry args={[1, 0.3, 128, 16]} />
                <meshPhysicalMaterial 
                    color="#3b82f6" 
                    roughness={0.1} 
                    metalness={0.1} 
                    transmission={0.6} 
                    thickness={2} 
                    ior={1.5}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>
        </Float>
    );
}

const HeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-60">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <color attach="background" args={['#F8FAFC']} />
        
        {/* Environment & Lights */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={5} color="#ec4899" />
        
        {/* Floating Abstract Queue Elements */}
        <MainShape />
        <FloatingParticles />
        
        {/* Background Depth */}
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
};

export default HeroScene;
