'use strict';

const Path = require('path');
const Fs = require('fs');
const BN = require('bn.js');
const Redis = require('redis');
const Merge = require('merge');
const BlueBird = require('bluebird');

BlueBird.promisifyAll(Redis.RedisClient.prototype);
BlueBird.promisifyAll(Redis.Multi.prototype);

const lpad = function (str, padString, length) {
  while (str.length < length) {
    str = padString + str;
  }
  return str;
}

// 默认选项
const defaultOptions = {
  // redis 配置，默认不配置。详见 https://www.npmjs.com/package/redis
  redis: null,
  // 世纪，用于减少生成的id数字大小，单位：毫秒，如：1300000000000
  epoch: 0,
  // redis 的hash键名
  hash_key: 'REDIS_SNOWFLAKE_ID',
};

let redisClient = null;

let RedisSnowflakeId = function (opts) {
  this.options = Merge.recursive(defaultOptions, opts || {});

  this.options.epoch = parseInt(this.options.epoch || 0);
  if (this.options.epoch < 0 || this.options.epoch > Date.now()) {
    throw new Error('无效世纪毫秒数。范围：0 <= epoch < Date.now()');
  }
  if (!this.options.hash_key) {
    throw new Error('未设置hash键名');
  }

  if (this.options.redis) {
    try {
      if (!redisClient) {
        redisClient = Redis.createClient(this.options.redis);
      }
    }
    catch (e) {
      throw new Error('无法连接redis，请检查配置是否正确。详见：https://www.npmjs.com/package/redis');
    }

    let file = Path.resolve(__dirname + '/fetch-id.lua');
    this.luaScript = Fs.readFileSync(file);
  }
};

/**
 * 获取id
 * @param {int} machineId 机器id，可理解为不同业务场景，2^8，可选值：0~255，默认：0
 * @return {string}
 */
RedisSnowflakeId.prototype.next = async function (machineId = 0) {
  if (!this.luaScript) {
    throw new Error('未配置redis，无法生成id');
  }
  let args = [this.luaScript, 1, this.options.hash_key, machineId];
  let segments = await redisClient.evalAsync(...args);
  // redis的毫秒是6位的，取前3位
  segments[1] = parseInt(segments[1] / 1000);
  return this.buildId(...segments);
};

/**
 * 生成id
 * @param {int} second 秒数，13位
 * @param {int} microSecond 毫秒数，3位
 * @param {int} machineId 机器id，可理解为不同业务场景，2^8，可选值：0~255
 * @param {int} count 计数，2^14，可选值：0~16383
 * @return {string}
 */
RedisSnowflakeId.prototype.buildId = function (second, microSecond, machineId, count) {
  let miliSecond = second * 1000 + microSecond - this.options.epoch;
  // 0 + 41位毫秒时间戳 + 8机器id + 14位自增序列
  let base = '0' + lpad(miliSecond.toString(2), '0', 41) + lpad(machineId.toString(2), '0', 8) + lpad(count.toString(2), '0', 14);
  var id_bit = new BN(base, 2);
  return id_bit.toString();
};

/**
 * 从id中解析出时间戳
 * @param {string} id id
 * @return {timestamp}
 */
RedisSnowflakeId.prototype.parse = async function (id) {
  let id_bit = new BN(id, 10);
  // 回填为64位
  let base = lpad(id_bit.toString(2), '0', 64);
  let timestamp = parseInt(base.substr(1, 41), 2) + this.options.epoch;
  let machineId = parseInt(base.substr(42, 8), 2);
  let count = parseInt(base.substr(50, 14), 2);
  return { timestamp, machineId, count };
};

module.exports = RedisSnowflakeId;
