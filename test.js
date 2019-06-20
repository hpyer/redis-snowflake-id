'use strict';

const RedisSnowflakeId = require('./index');

const run = async function () {
  let options = {
    // redis 配置，详见 https://www.npmjs.com/package/redis
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

  process.exit()
}

run();
