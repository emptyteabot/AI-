import type {NextConfig} from 'next';
import path from 'node:path';
const nextConfig:NextConfig={
  webpack(config,{webpack}){config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^lessonbench-runtime$/,path.resolve(process.cwd(),'lib/eval/runtime-node.ts')));return config;},
};
export default nextConfig;
