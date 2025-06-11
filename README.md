# redis-snowflake-id

> Node.js 版本的 Twitter 雪花算法(Snowflake) 发号器。基于 redis 存储发号器自增序号

### 安装

> `1.2.0` 版本开始改用 `ioredis` 模块作为redis客户端

```shell
npm install redis-snowflake-id -S
```

或

```shell
pnpm add redis-snowflake-id
```

### 使用

```js
let options = {
  // Redis 客户端配置，配置详见 https://www.npmjs.com/package/ioredis
  // 如果不传，可调用buildId方法，手工生成id，详见test.js
  redis: {
    host: '127.0.0.1',
  },
  // 世纪，用于减少生成的id数字大小，单位：毫秒，如：1300000000000
  epoch: 0,
  // redis 的hash键名
  hash_key: 'REDIS_SNOWFLAKE_ID',
};

// 创建发号器实例
let idgen = new RedisSnowflakeId(options);

// 生成id
let id = await idgen.next();
console.log('id', id);

// 根据id解析生成的时间戳（毫秒）
let time = idgen.parse(id);
console.log('time', time);

// 生成不同业务类型的id，可选值：0~255，默认：0
let machineId = 3;
let id2 = await idgen.next(machineId);
console.log('id2', id2);

```

### 原理

雪花算法（snowflake）是将时间戳、业务id、自增序列分别转为二进制，然后拼接到一起，再转回10进制，得到唯一id。

本项目根据实际情况将时间戳补全到41位，业务id补全到8位，自增序列补全到14位，如果业务id不够用，可自行调整

```
0 00000000000000000000000000000000000000000 00000000  00000000000000
0 + 41位时间戳 + 8位业务id + 14位自增序列
```
