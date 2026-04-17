# 设计：限流持久化

## 滑动窗口限流

```
Redis Key: ratelimit:{type}:{id}:{window}

类型: ip, user, api
ID: IP地址或用户ID
Window: 时间窗口（分钟）
```

## 限流算法

使用 Redis INCR + EXPIRE 实现计数器限流：

```lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end

return current <= limit
```
