// index.d.ts

declare class RedisSnowflakeId {
  /**
   * 构造函数
   */
  constructor(opts?: RedisSnowflakeIdOptions);

  /**
   * 获取下一个 ID
   * @param machineId 机器ID，默认为0
   */
  next(machineId?: number): Promise<string>;

  /**
   * 构建 ID
   * @param second 秒级时间戳
   * @param microSecond 毫秒部分（Redis 提供的是毫秒，取前3位）
   * @param machineId 机器ID
   * @param count 自增序列号
   */
  buildId(second: number, microSecond: number, machineId: number, count: number): string;

  /**
   * 解析 ID 为原始数据
   * @param id 生成的 ID
   */
  parse(id: string): {
    /**
     * 时间戳（毫秒）
     */
    timestamp: number;
    /**
     * 机器ID
     */
    machineId: number;
    /**
     * 自增序列号
     */
    count: number;
  };
}

/**
 * 配置选项
 */
type RedisSnowflakeIdOptions = {
  /**
   * Redis 客户端配置，配置详见 https://www.npmjs.com/package/ioredis
   *
   * 如果不传，可调用buildId方法，手工生成id，详见test.js
   */
  redis?: any;

  /**
   * 世纪时间戳，用于减少生成的 ID 大小
   * 单位：毫秒
   * 默认：0
   */
  epoch?: number;

  /**
   * Redis hash 键名
   * 默认：'REDIS_SNOWFLAKE_ID'
   */
  hash_key?: string;
};

export = RedisSnowflakeId;
