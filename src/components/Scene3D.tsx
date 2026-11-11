import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Three.js scene driven entirely by the Remotion frame number.
 * Never use useFrame()/requestAnimationFrame here — derive all motion from
 * useCurrentFrame() so renders are deterministic.
 */
export const Scene3D: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12 } });
  const rotation = (frame / fps) * Math.PI * 0.8;
  const float = Math.sin((frame / fps) * Math.PI * 2 * 0.5) * 0.25;
  const cameraZ = interpolate(frame, [0, 180], [7, 5.5], {
    extrapolateRight: "clamp",
  });

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, cameraZ], fov: 50 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, -3, 2]} intensity={40} color="#4ea8ff" />
      <mesh
        position={[0, float, 0]}
        rotation={[rotation * 0.6, rotation, 0]}
        scale={enter * 1.4}
      >
        <torusKnotGeometry args={[1, 0.34, 220, 32]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.25} />
      </mesh>
    </ThreeCanvas>
  );
};
