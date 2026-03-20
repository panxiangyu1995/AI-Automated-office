package service

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

// FieldPermissionService 字段权限服务
type FieldPermissionService struct {
	overrideRepo repository.PermissionOverrideRepository
	cache        *FieldPermissionCache
	logger       *zap.Logger
}

// NewFieldPermissionService 创建字段权限服务
func NewFieldPermissionService(
	overrideRepo repository.PermissionOverrideRepository,
	logger *zap.Logger,
) *FieldPermissionService {
	return &FieldPermissionService{
		overrideRepo: overrideRepo,
		cache:        NewFieldPermissionCache(5 * time.Minute),
		logger:       logger,
	}
}

// GetFieldRestrictions 获取字段限制配置
func (s *FieldPermissionService) GetFieldRestrictions(ctx context.Context, userID, resource string) (model.FieldRestrictionsMap, error) {
	// 检查缓存
	cacheKey := fmt.Sprintf("%s:%s", userID, resource)
	if cached, ok := s.cache.Get(cacheKey); ok {
		return cached, nil
	}

	// 从数据库获取
	overrides, err := s.overrideRepo.FindEffectiveByUserIDAndResource(ctx, userID, resource)
	if err != nil {
		s.logger.Error("failed to get field restrictions",
			zap.Error(err),
			zap.String("userID", userID),
			zap.String("resource", resource),
		)
		return nil, err
	}

	// 合并字段限制
	restrictions := s.mergeFieldRestrictions(overrides)

	// 缓存结果
	s.cache.Set(cacheKey, restrictions)

	return restrictions, nil
}

// mergeFieldRestrictions 合并字段限制（deny 优先）
func (s *FieldPermissionService) mergeFieldRestrictions(overrides []*model.PermissionOverride) model.FieldRestrictionsMap {
	restrictions := make(model.FieldRestrictionsMap)

	for _, override := range overrides {
		if override.FieldRestrictions == nil {
			continue
		}

		for fieldName, restriction := range override.FieldRestrictions {
			if existing, ok := restrictions[fieldName]; ok {
				// deny 类型的覆盖优先
				if override.OverrideType == model.OverrideTypeDeny {
					restrictions[fieldName] = restriction
				} else if existing.Mode == model.FieldModeVisible {
					// 只有当前为可见时才覆盖
					restrictions[fieldName] = restriction
				}
			} else {
				restrictions[fieldName] = restriction
			}
		}
	}

	return restrictions
}

// IsFieldVisible 检查字段是否可见
func (s *FieldPermissionService) IsFieldVisible(ctx context.Context, userID, resource, field string) (bool, error) {
	restrictions, err := s.GetFieldRestrictions(ctx, userID, resource)
	if err != nil {
		return true, err
	}

	if restriction, ok := restrictions[field]; ok {
		return restriction.Mode != model.FieldModeHidden, nil
	}

	return true, nil
}

// IsFieldReadonly 检查字段是否只读
func (s *FieldPermissionService) IsFieldReadonly(ctx context.Context, userID, resource, field string) (bool, error) {
	restrictions, err := s.GetFieldRestrictions(ctx, userID, resource)
	if err != nil {
		return false, err
	}

	if restriction, ok := restrictions[field]; ok {
		return restriction.Mode == model.FieldModeReadonly, nil
	}

	return false, nil
}

// GetFieldMode 获取字段模式
func (s *FieldPermissionService) GetFieldMode(ctx context.Context, userID, resource, field string) (model.FieldMode, error) {
	restrictions, err := s.GetFieldRestrictions(ctx, userID, resource)
	if err != nil {
		return model.FieldModeVisible, err
	}

	if restriction, ok := restrictions[field]; ok {
		return restriction.Mode, nil
	}

	return model.FieldModeVisible, nil
}

// ApplyFieldMasking 应用字段脱敏
func (s *FieldPermissionService) ApplyFieldMasking(ctx context.Context, userID, resource string, data map[string]interface{}) (map[string]interface{}, error) {
	restrictions, err := s.GetFieldRestrictions(ctx, userID, resource)
	if err != nil {
		return data, err
	}

	result := make(map[string]interface{})
	for k, v := range data {
		if restriction, ok := restrictions[k]; ok {
			switch restriction.Mode {
			case model.FieldModeHidden:
				// 隐藏字段，不返回
				continue
			case model.FieldModeMasked:
				// 脱敏处理
				result[k] = s.maskValue(v, restriction.MaskRule, restriction.CustomMaskPattern)
			default:
				result[k] = v
			}
		} else {
			result[k] = v
		}
	}

	return result, nil
}

// ApplyFieldMaskingToList 对列表数据应用字段脱敏
func (s *FieldPermissionService) ApplyFieldMaskingToList(ctx context.Context, userID, resource string, dataList []map[string]interface{}) ([]map[string]interface{}, error) {
	if len(dataList) == 0 {
		return dataList, nil
	}

	restrictions, err := s.GetFieldRestrictions(ctx, userID, resource)
	if err != nil {
		return dataList, err
	}

	result := make([]map[string]interface{}, len(dataList))
	for i, data := range dataList {
		result[i] = s.applyMaskingToMap(data, restrictions)
	}

	return result, nil
}

// applyMaskingToMap 对单个 map 应用脱敏
func (s *FieldPermissionService) applyMaskingToMap(data map[string]interface{}, restrictions model.FieldRestrictionsMap) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range data {
		if restriction, ok := restrictions[k]; ok {
			switch restriction.Mode {
			case model.FieldModeHidden:
				continue
			case model.FieldModeMasked:
				result[k] = s.maskValue(v, restriction.MaskRule, restriction.CustomMaskPattern)
			default:
				result[k] = v
			}
		} else {
			result[k] = v
		}
	}
	return result
}

// maskValue 对值进行脱敏处理
func (s *FieldPermissionService) maskValue(value interface{}, rule model.MaskRule, customPattern string) interface{} {
	if value == nil {
		return nil
	}

	str := fmt.Sprintf("%v", value)

	switch rule {
	case model.MaskRulePhone:
		return maskPhone(str)
	case model.MaskRuleEmail:
		return maskEmail(str)
	case model.MaskRuleIDCard:
		return maskIDCard(str)
	case model.MaskRuleBankCard:
		return maskBankCard(str)
	case model.MaskRuleCustom:
		if customPattern != "" {
			return applyCustomMask(str, customPattern)
		}
		return "****"
	default:
		return "****"
	}
}

// InvalidateCache 使缓存失效
func (s *FieldPermissionService) InvalidateCache(userID, resource string) {
	cacheKey := fmt.Sprintf("%s:%s", userID, resource)
	s.cache.Delete(cacheKey)
}

// InvalidateUserCache 使用户所有缓存失效
func (s *FieldPermissionService) InvalidateUserCache(userID string) {
	s.cache.DeleteByPrefix(userID)
}

// ========== 脱敏函数 ==========

// maskPhone 手机号脱敏：138****1234
func maskPhone(phone string) string {
	if len(phone) < 7 {
		return "****"
	}
	return phone[:3] + "****" + phone[len(phone)-4:]
}

// maskEmail 邮箱脱敏：a***@example.com
func maskEmail(email string) string {
	atIndex := strings.Index(email, "@")
	if atIndex <= 1 {
		return "****"
	}
	return email[:1] + "***" + email[atIndex:]
}

// maskIDCard 身份证脱敏：320***********1234
func maskIDCard(idCard string) string {
	if len(idCard) < 8 {
		return "****"
	}
	return idCard[:3] + "***********" + idCard[len(idCard)-4:]
}

// maskBankCard 银行卡脱敏：6222****1234
func maskBankCard(card string) string {
	if len(card) < 8 {
		return "****"
	}
	return card[:4] + "****" + card[len(card)-4:]
}

// applyCustomMask 自定义脱敏
func applyCustomMask(value, pattern string) string {
	// pattern 示例: "3,4" 表示保留前3位和后4位
	re := regexp.MustCompile(`^(\d+),(\d+)$`)
	matches := re.FindStringSubmatch(pattern)
	if len(matches) != 3 {
		return "****"
	}

	// 解析数字
	keepFront, err := strconv.Atoi(matches[1])
	if err != nil || keepFront < 0 {
		return "****"
	}
	if keepFront > len(value) {
		keepFront = len(value)
	}

	keepEnd, err := strconv.Atoi(matches[2])
	if err != nil || keepEnd < 0 {
		return "****"
	}
	if keepEnd > len(value) {
		keepEnd = len(value)
	}

	if keepFront+keepEnd >= len(value) {
		return value
	}

	return value[:keepFront] + "****" + value[len(value)-keepEnd:]
}

// FieldPermissionCache 字段权限缓存
type FieldPermissionCache struct {
	mu         sync.RWMutex
	items      map[string]*fieldCacheItem
	ttl        time.Duration
	stopChan   chan struct{}
}

type fieldCacheItem struct {
	restrictions model.FieldRestrictionsMap
	expiredAt    time.Time
}

// NewFieldPermissionCache 创建字段权限缓存
func NewFieldPermissionCache(ttl time.Duration) *FieldPermissionCache {
	c := &FieldPermissionCache{
		items:    make(map[string]*fieldCacheItem),
		ttl:      ttl,
		stopChan: make(chan struct{}),
	}

	go c.cleanup()

	return c
}

// Get 获取缓存
func (c *FieldPermissionCache) Get(key string) (model.FieldRestrictionsMap, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists {
		return nil, false
	}

	if time.Now().After(item.expiredAt) {
		return nil, false
	}

	return item.restrictions, true
}

// Set 设置缓存
func (c *FieldPermissionCache) Set(key string, restrictions model.FieldRestrictionsMap) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = &fieldCacheItem{
		restrictions: restrictions,
		expiredAt:    time.Now().Add(c.ttl),
	}
}

// Delete 删除缓存
func (c *FieldPermissionCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// DeleteByPrefix 按前缀删除缓存
func (c *FieldPermissionCache) DeleteByPrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if strings.HasPrefix(key, prefix) {
			delete(c.items, key)
		}
	}
}

// Clear 清空缓存
func (c *FieldPermissionCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*fieldCacheItem)
}

// cleanup 定期清理过期缓存
func (c *FieldPermissionCache) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.doCleanup()
		case <-c.stopChan:
			return
		}
	}
}

// doCleanup 执行清理
func (c *FieldPermissionCache) doCleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, item := range c.items {
		if now.After(item.expiredAt) {
			delete(c.items, key)
		}
	}
}

// Stop 停止缓存清理
func (c *FieldPermissionCache) Stop() {
	close(c.stopChan)
}
