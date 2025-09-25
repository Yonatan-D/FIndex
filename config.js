const loadEnv = () => {
  const env = {};
  // 传入配置项、处理函数和错误时的默认值，如果处理函数抛出错误，则返回默认值
  const safeExecute = (key, fn, defaultValue) => {
    try {
      const value = fn();
      if (Array.isArray(value)) {
        env[key] = value.filter(item => item);
      } else if (isNaN(value)) {
        env[key] = defaultValue;
      } else {
        env[key] = value;
      }
    } catch (error) {
      const errorLine = error.stack.split('\n')[2]; // 获取错误行号
      console.error(`Error reading environment variable "${key}": ${error}`, errorLine);
      env[key] =  defaultValue;
    }
  }
  // 读取环境变量
  safeExecute('PORT', () => parseInt(process.env.PORT), 3000);
  safeExecute('BUCKETS', () => JSON.parse(process.env.BUCKETS), []);
  safeExecute('IP_WHITE_LIST', () => process.env.IP_WHITE_LIST.split(','), []);
  safeExecute('TOKEN', () => process.env.TOKEN, undefined);

  return env;
}

const defaultConfig = {
  PORT: 3000,
  BUCKETS: [],
  IP_WHITE_LIST: [],
  TOKEN: undefined,
}

const mergedConfig = Object.assign({}, defaultConfig, loadEnv());

console.log('Config:', mergedConfig);

export default mergedConfig;