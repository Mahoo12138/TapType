package admin

import (
	"taptype/api/admin"

	"gorm.io/gorm"
)

type ControllerV1 struct {
	db *gorm.DB
}

func NewV1(db *gorm.DB) admin.IAdminV1 {
	return &ControllerV1{db: db}
}
