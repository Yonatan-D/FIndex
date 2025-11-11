import c from 'kleur';
import { fileURLToPath } from "url";
import { dirname } from "path";

// 获取应用根目录
const getAppRoot = () => {
  const __filename = fileURLToPath(import.meta.url);
  return dirname(__filename);
}

// 环境变量类型定义
const ENV_TYPES = {
  PORT: 'number',
  TITLE: 'string',
  BUCKETS: 'array',
  IP_WHITE_LIST: 'array',
  TOKEN: 'string',
}; 

// 默认配置
const DEFAULT_CONFIG = {
  APP_ROOT: getAppRoot(),
  PORT: 3000,
  TITLE: 'FIndex',
  BUCKETS: [],
  IP_WHITE_LIST: [],
  TOKEN: undefined,
};

// 环境变量转换器
const ENV_TRANSFORMERS = {
  PORT: (value) => parseInt(value),
  BUCKETS: (value) => JSON.parse(value || '[]'),
  IP_WHITE_LIST: (value) => value.split(',').map(i => i.trim()).filter(Boolean),
}

const firstUpperCase = ([first, ...rest]) => first?.toUpperCase() + rest.join('');

// 加载环境变量配置
const loadEnvConfig = () => {
  const config = {};

  Object.keys(ENV_TYPES).forEach(key => {
    let value = process.env[key];
    if (!value) return;

    const transformer = ENV_TRANSFORMERS[key];
    if (transformer) {
      try {
        value = transformer(value);
      } catch (error) {
        throw new Error(`Invalid environment variable: ${key}=${value}`);
      }
    }
    const type = ENV_TYPES[key];
    if (Object.prototype.toString.call(value) !== `[object ${firstUpperCase(type)}]`) {
      throw new Error(`Invalid environment variable: ${key}=${value}`);
    }
    
    config[key] = value;
  })
  return config;
}

// 合并配置
const config = {
  ...DEFAULT_CONFIG,
  ...loadEnvConfig(),
}

console.log(c.yellow('Config:'), config);

export default config;