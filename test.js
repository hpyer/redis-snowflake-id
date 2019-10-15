'use strict';

const RedisSnowflakeId = require('./index');

const run = async function () {
  let options = {
    // redis 配置，默认不配置。详见 https://www.npmjs.com/package/redis
    redis: {
      host: '127.0.0.1',
    },
    // 世纪，用于减少生成的id数字大小，单位：毫秒，如：1300000000000
    epoch: 1300000000000,
    // redis 的hash键名
    hash_key: 'REDIS_SNOWFLAKE_ID',
  };
  let idgen = new RedisSnowflakeId(options);

  let id = await idgen.next();
  console.log('id', id);

  let data = await idgen.parse(id);
  console.log('data', data);

  let machineId = 3;
  let id2 = await idgen.next(machineId);
  console.log('id2', id2);

  // // 若不配置redis，可调用buildId方法，手工生成id
  // let second = 1570000000, microSecond = 123, machineId = 3, count = 99;
  // let id = await idgen.buildId(second, microSecond, machineId, count);
  // console.log('manual_id', id);

  process.exit()
}

run();
