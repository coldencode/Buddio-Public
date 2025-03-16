import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import 3D Force Graph to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
const customColors = [
  '#FF5733', // Vibrant Orange
  '#33FF57', // Bright Green
  '#3357FF', // Deep Blue
  '#F3FF33', // Sunny Yellow
  '#FF33F3', // Magenta
  '#33FFF6', // Cyan
  '#FF9A33', // Warm Orange
  '#9C33FF', // Purple
  '#33FF9C', // Mint Green
  '#FF3333', // Bold Red
];
export default function CollaborationGraph({ data }) {


  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ForceGraph3D
        graphData={data}
        backgroundColor="#f5f5f5"
        // Add lighting effects
        lightColor="#ffffff" // White light
        lightIntensity={0.6}
        ambientLightColor="#ffffff"
        ambientLightIntensity={0.4}
        
        nodeColor={node => customColors[data.nodes.indexOf(node) % customColors.length]}
        nodeLabel="id"
        nodeAutoColorBy="id"
        nodeResolution={12} // Smoother sphere edges

        linkWidth={link => Math.max(link.value * 20, 1)} // Thickness based on score
        linkColor={link => `rgba(0, 144, 255, ${0.3 + link.value * 0.7})`} // Blue gradient
        linkOpacity={1} // Constant opacity
        linkDirectionalParticles={link => Math.round(link.value * 10)} // Animated particles on links
        linkDirectionalParticleSpeed={0.01}
        
        onNodeHover={node => {
          if (node) {
            // Highlight node's connections on hover
            const neighbors = new Set();
            data.links.forEach(link => {
              if (link.source === node.id || link.target === node.id) {
                neighbors.add(link.source).add(link.target);
              }
            });
            // Customize hover effect here (e.g., highlight neighbors)
          }
        }}
        cooldownTicks={100} // Animation smoothness
        enableNavigationControls={true} // Zoom/rotate controls
        width={500} // Set width explicitly
        height={350} // Set height explicitly
      />
    </div>
  );
}