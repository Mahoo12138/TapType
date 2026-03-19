package controller

import (
	"github.com/gogf/gf/v2/net/ghttp"

	"gorm.io/gorm"

	"taptype/internal/model/entity"
)

type AdminController struct {
	db *gorm.DB
}

func NewAdminController(db *gorm.DB) *AdminController {
	return &AdminController{db: db}
}

// ListUsers handles GET /api/v1/admin/users
func (c *AdminController) ListUsers(r *ghttp.Request) {
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 20).Int()
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	c.db.Model(&entity.User{}).Count(&total)

	var users []entity.User
	if err := c.db.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&users).Error; err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"list":      users,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

type updateUserReq struct {
	IsActive *int    `json:"is_active"`
	Role     *string `json:"role"`
}

// UpdateUser handles PUT /api/v1/admin/users/:id
func (c *AdminController) UpdateUser(r *ghttp.Request) {
	targetUserID := r.Get("id").String()
	var req updateUserReq
	if err := r.Parse(&req); err != nil {
		r.Response.WriteJsonExit(map[string]interface{}{
			"code":    40001,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	var user entity.User
	if err := c.db.Where("id = ?", targetUserID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    40401,
				"message": "user not found",
				"data":    nil,
			})
			return
		}
		writeError(r, err)
		return
	}

	updates := map[string]interface{}{}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.Role != nil {
		validRoles := map[string]bool{"user": true, "admin": true}
		if !validRoles[*req.Role] {
			r.Response.WriteJsonExit(map[string]interface{}{
				"code":    40001,
				"message": "invalid role, must be 'user' or 'admin'",
				"data":    nil,
			})
			return
		}
		updates["role"] = *req.Role
	}

	if len(updates) > 0 {
		if err := c.db.Model(&user).Updates(updates).Error; err != nil {
			writeError(r, err)
			return
		}
	}

	c.db.First(&user, "id = ?", targetUserID)
	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    user,
	})
}

// ListPublicWordBanks handles GET /api/v1/admin/word-banks (pending review)
func (c *AdminController) ListPublicWordBanks(r *ghttp.Request) {
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 20).Int()
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	c.db.Model(&entity.WordBank{}).Where("is_public = 1").Count(&total)

	var banks []entity.WordBank
	if err := c.db.Where("is_public = 1").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&banks).Error; err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"list":      banks,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// ListPublicSentenceBanks handles GET /api/v1/admin/sentence-banks (pending review)
func (c *AdminController) ListPublicSentenceBanks(r *ghttp.Request) {
	page := r.GetQuery("page", 1).Int()
	pageSize := r.GetQuery("page_size", 20).Int()
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	c.db.Model(&entity.SentenceBank{}).Where("is_public = 1").Count(&total)

	var banks []entity.SentenceBank
	if err := c.db.Where("is_public = 1").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&banks).Error; err != nil {
		writeError(r, err)
		return
	}

	r.Response.WriteJsonExit(map[string]interface{}{
		"code":    0,
		"message": "success",
		"data": map[string]interface{}{
			"list":      banks,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}
