'use strict';

const RedisSnowflakeId = require('./');

(async function() {
  let idgen = new RedisSnowflakeId({
    redis: {
      host: '127.0.0.1',
      port: 6379,
    },
    epoch: 1300000000000,
    hash_key: 'TEST_REDIS_SNOWFLAKE_ID',
  });

  // 使用方法
  let id1 = await idgen.next();
  console.log('id1', id1);
  // 解析id信息
  console.log('id1_info', idgen.parse(id1));

  // 自定义机器id
  let machineId = 3;
  let id2 = await idgen.next(machineId);
  console.log('id2', id2);
  console.log('id2_info', idgen.parse(id2));

  // // 若不配置redis，可调用buildId方法，手工生成id
  // let second = 1570000000, microSecond = 123, machineId = 3, count = 99;
  // let manual_id = idgen.buildId(second, microSecond, machineId, count);
  // console.log('manual_id', manual_id);
  // console.log('manual_id_info', idgen.parse(manual_id));

  process.exit()
})();
