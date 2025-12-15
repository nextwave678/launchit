/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

interface RateLimitOptions {
  limit: number // Max requests
  window: number // Time window in seconds
}

export function rateLimit(identifier: string, options: RateLimitOptions): {
  success: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = identifier

  // If no entry exists or it's expired, create a new one
  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + options.window * 1000
    }
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt: store[key].resetAt
    }
  }

  // Check if limit exceeded
  if (store[key].count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: store[key].resetAt
    }
  }

  // Increment count
  store[key].count++

  return {
    success: true,
    remaining: options.limit - store[key].count,
    resetAt: store[key].resetAt
  }
}

/**
 * Rate limit for AI agent endpoints (expensive operations)
 */
export function rateLimitAgent(userId: string) {
  return rateLimit(`agent:${userId}`, {
    limit: 10, // 10 requests
    window: 3600 // per hour
  })
}

/**
 * Rate limit for public lead capture (prevent spam)
 */
export function rateLimitLeadCapture(ip: string) {
  return rateLimit(`lead:${ip}`, {
    limit: 100, // 100 submissions
    window: 3600 // per hour
  })
}

/**
 * Rate limit for public analytics tracking
 */
export function rateLimitAnalytics(ip: string) {
  return rateLimit(`analytics:${ip}`, {
    limit: 1000, // 1000 events
    window: 3600 // per hour
  })
}


