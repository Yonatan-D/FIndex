import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

export default class Logger {
  constructor(req, opt = {}) {
    this.req = req;
    this.opt = {
      dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      level: LOG_LEVELS.INFO,
      template: '{date} | {ip} | {traceId} | {level} | {message}',
      ...opt
    };
    this.traceId = uuidv4();
  }

  #formatdDate() {
    return dayjs().format(this.opt.dateFormat);
  }

  #formatMessage (level, message, args) {
    const template = this.opt.template;
    const formatted = template
      .replace('{ip}', this.req.ip)
      .replace('{date}', this.#formatdDate())
      .replace('{traceId}', this.traceId)
      .replace('{level}', level)
      .replace('{message}', message);

    return [formatted, ...args];
  }

  #log(level, ...args) {
    if (level < this.opt.level) return;

    const arg0 = args.shift();
    const formatted = this.#formatMessage(Object.keys(LOG_LEVELS)[level], arg0, args);
    console.log(...formatted);
  }

  debug(...args) {
    this.#log(LOG_LEVELS.DEBUG, ...args);
  }

  info(...args) {
    this.#log(LOG_LEVELS.INFO, ...args);
  }

  warn(...args) {
    this.#log(LOG_LEVELS.WARN, ...args);
  }

  error(...args) {
    this.#log(LOG_LEVELS.ERROR, ...args);
  }
}