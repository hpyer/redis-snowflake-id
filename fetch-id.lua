redis.replicate_commands()

local STEP = 1;
-- 最大自增序列 2^14
local MAX_COUNT = 16384;
-- 最大机器数 2^8
local MAX_MACHINES = 256;

local now = redis.call('TIME');
local tag = KEYS[1];
local machineId;

if ARGV[1] == nil then
  machineId = 0;
else
  machineId = ARGV[1] % MAX_MACHINES;
end

local count;
count = tonumber(redis.call('HINCRBY', tag, machineId, STEP));
if count >= MAX_COUNT then
  count = 0;
  redis.call('HSET', tag, machineId, count);
end

return {tonumber(now[1]), tonumber(now[2]), machineId, count};
