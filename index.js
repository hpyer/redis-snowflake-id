'use strict';

const { readFileSync } = require('fs');
const BN = require('bn.js');
const Redis = require('ioredis');

const lpad = function (str, padString, length) {
  while (str.length < length) {
    str = padString + str;
  }
  return str;
}

const mergeOptions = function (options, defaultOptions) {
  for (let key in defaultOptions) {
    if (options[key] === undefined) {
      options[key] = defaultOptions[key];
    } else if (typeof options[key] === 'object') {
      options[key] = mergeOptions(options[key], defaultOptions[key]);
    }
  }
  return options;
};

const defaultOptions = {
  redis: null,
  epoch: 0,
  hash_key: 'REDIS_SNOWFLAKE_ID',
};

let redisClient = null;

class RedisSnowflakeId {
  constructor(opts) {
    this.options = mergeOptions(opts, defaultOptions);

    this.options.epoch = parseInt(this.options.epoch) || 0;
    if (this.options.epoch < 0 || this.options.epoch > Date.now()) {
      throw new Error('无效世纪毫秒数。范围：0 <= epoch < Date.now()');
    }
    if (!this.options.hash_key) {
      throw new Error('未设置hash键名');
    }
    if (this.options.redis) {
      try {
        redisClient = new Redis(this.options.redis);
        redisClient.defineCommand('snowflakeId', {
          numberOfKeys: 1,
          lua: readFileSync(__dirname + '/fetch-id.lua'),
        });
      }
      catch (e) {
        console.log('RedisSnowflakeId.ConnectError', e);
        throw new Error('无法连接redis，请检查配置是否正确。详见：https://www.npmjs.com/package/redis');
      }
    }
  }

  async next(machineId = 0) {
    if (!redisClient) {
      throw new Error('未配置redis，无法生成id');
    }
    let args = [this.options.hash_key, machineId];
    let segments = await redisClient.snowflakeId(...args);
    // redis的毫秒是6位的，取前3位
    segments[1] = parseInt(segments[1] / 1000);
    return this.buildId(...segments);
  }

  buildId(second, microSecond, machineId, count) {
    let miliSecond = second * 1000 + microSecond - this.options.epoch;
    // 0 + 41位毫秒时间戳 + 8机器id + 14位自增序列
    let base = '0' + lpad(miliSecond.toString(2), '0', 41) + lpad(machineId.toString(2), '0', 8) + lpad(count.toString(2), '0', 14);
    var id_bit = new BN(base, 2);
    return id_bit.toString();
  }

  parse(id) {
    let id_bit = new BN(id, 10);
    // 回填为64位
    let base = lpad(id_bit.toString(2), '0', 64);
    let timestamp = parseInt(base.substr(1, 41), 2) + this.options.epoch;
    let machineId = parseInt(base.substr(42, 8), 2);
    let count = parseInt(base.substr(50, 14), 2);
    return { timestamp, machineId, count };
  }
};

module.exports = RedisSnowflakeId;
