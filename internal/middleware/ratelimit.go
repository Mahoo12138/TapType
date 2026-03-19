package middleware

import (
	"sync"
	"time"

	"github.com/gogf/gf/v2/net/ghttp"
)

// tokenBucket implements a simple per-IP token bucket rate limiter.
type tokenBucket struct {
	tokens     float64
	maxTokens  float64
	refillRate float64 // tokens per second
	lastRefill time.Time
}

func (b *tokenBucket) allow() bool {
	now := time.Now()
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * b.refillRate
	if b.tokens > b.maxTokens {
		b.tokens = b.maxTokens
	}
	b.lastRefill = now

	if b.tokens >= 1 {
		b.tokens--
		return true
	}
	return false
}

type rateLimiterStore struct {
	mu      sync.Mutex
	buckets map[string]*tokenBucket
	config  RateLimitConfig
}

// RateLimitConfig holds rate limiter parameters.
type RateLimitConfig struct {
	MaxTokens  float64 // burst size
	RefillRate float64 // tokens per second
}

var (
	limiters = make(map[string]*rateLimiterStore)
	mu       sync.Mutex
)

func getOrCreateStore(key string, config RateLimitConfig) *rateLimiterStore {
	mu.Lock()
	defer mu.Unlock()
	if store, ok := limiters[key]; ok {
		return store
	}
	store := &rateLimiterStore{
		buckets: make(map[string]*tokenBucket),
		config:  config,
	}
	limiters[key] = store
	return store
}

func (s *rateLimiterStore) allow(ip string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	bucket, ok := s.buckets[ip]
	if !ok {
		bucket = &tokenBucket{
			tokens:     s.config.MaxTokens,
			maxTokens:  s.config.MaxTokens,
			refillRate: s.config.RefillRate,
			lastRefill: time.Now(),
		}
		s.buckets[ip] = bucket
	}
	return bucket.allow()
}

// RateLimit returns a middleware that limits requests per IP.
// name is used to identify separate rate limit pools (e.g. "auth", "general").
func RateLimit(name string, config RateLimitConfig) func(r *ghttp.Request) {
	store := getOrCreateStore(name, config)

	return func(r *ghttp.Request) {
		ip := r.GetClientIp()
		if !store.allow(ip) {
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    42901,
				"message": "too many requests",
				"data":    nil,
			})
			return
		}
		r.Middleware.Next()
	}
}

// CleanupExpiredBuckets removes buckets that haven't been used in over 10 minutes.
// Call this periodically (e.g., in a goroutine) to prevent memory leaks.
func CleanupExpiredBuckets() {
	mu.Lock()
	defer mu.Unlock()
	cutoff := time.Now().Add(-10 * time.Minute)
	for _, store := range limiters {
		store.mu.Lock()
		for ip, bucket := range store.buckets {
			if bucket.lastRefill.Before(cutoff) {
				delete(store.buckets, ip)
			}
		}
		store.mu.Unlock()
	}
}
