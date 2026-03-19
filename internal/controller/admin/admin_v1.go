package admin

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"gorm.io/gorm"

	v1 "taptype/api/admin/v1"
	"taptype/internal/model/code"
	"taptype/internal/model/entity"
)

func (c *ControllerV1) ListUsers(ctx context.Context, req *v1.ListUsersReq) (res *v1.ListUsersRes, err error) {
	page := req.Page
	pageSize := req.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	c.db.WithContext(ctx).Model(&entity.User{}).Count(&total)

	var users []entity.User
	if err = c.db.WithContext(ctx).Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&users).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	return &v1.ListUsersRes{
		List:     users,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (c *ControllerV1) UpdateUser(ctx context.Context, req *v1.UpdateUserReq) (res *v1.UpdateUserRes, err error) {
	r := g.RequestFromCtx(ctx)

	var user entity.User
	if err = c.db.WithContext(ctx).Where("id = ?", req.Id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gerror.NewCode(code.CodeNotFound, "user not found")
		}
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	updates := map[string]interface{}{}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.Role != nil {
		validRoles := map[string]bool{"user": true, "admin": true}
		if !validRoles[*req.Role] {
			return nil, gerror.NewCode(code.CodeBadRequest, "invalid role, must be 'user' or 'admin'")
		}
		updates["role"] = *req.Role
	}

	if len(updates) > 0 {
		if err = c.db.WithContext(ctx).Model(&user).Updates(updates).Error; err != nil {
			return nil, gerror.NewCode(code.CodeInternalError, err.Error())
		}
	}

	c.db.WithContext(ctx).First(&user, "id = ?", req.Id)
	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": user})
	return
}

func (c *ControllerV1) ListPublicWordBanks(ctx context.Context, req *v1.ListPublicWordBanksReq) (res *v1.ListPublicWordBanksRes, err error) {
	page := req.Page
	pageSize := req.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	c.db.WithContext(ctx).Model(&entity.WordBank{}).Where("is_public = 1").Count(&total)

	var banks []entity.WordBank
	if err = c.db.WithContext(ctx).Where("is_public = 1").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&banks).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	return &v1.ListPublicWordBanksRes{
		List:     banks,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (c *ControllerV1) ListPublicSentenceBanks(ctx context.Context, req *v1.ListPublicSentenceBanksReq) (res *v1.ListPublicSentenceBanksRes, err error) {
	page := req.Page
	pageSize := req.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	c.db.WithContext(ctx).Model(&entity.SentenceBank{}).Where("is_public = 1").Count(&total)

	var banks []entity.SentenceBank
	if err = c.db.WithContext(ctx).Where("is_public = 1").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&banks).Error; err != nil {
		return nil, gerror.NewCode(code.CodeInternalError, err.Error())
	}

	return &v1.ListPublicSentenceBanksRes{
		List:     banks,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}
