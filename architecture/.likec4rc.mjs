/**
 * LikeC4 Configuration
 * @type {import('likec4').LikeC4Config}
 */
export default {
  // Source directory containing .c4 files
  sources: './src/**/*.c4',
  
  // Output directory for builds
  outdir: './dist-c4',
  
  // Layout engine (wasm or dot)
  useGraphvizLayout: false,
  
  // Title for generated site
  title: 'Amit Platform Architecture',
};

