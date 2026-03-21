package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type GetMediaTypesReq struct {
	g.Meta `path:"/media/types" method:"get" tags:"Media" summary:"List media type definitions"`
}

type GetMediaTypesRes struct{}

type ListMediaReq struct {
	g.Meta    `path:"/media" method:"get" tags:"Media" summary:"List media files by owner"`
	TypeKey   string `json:"type_key" in:"query" v:"required#type_key is required"`
	OwnerType string `json:"owner_type" in:"query" v:"required#owner_type is required"`
	OwnerID   string `json:"owner_id" in:"query"`
}

type ListMediaRes struct{}

type UploadMediaReq struct {
	g.Meta      `path:"/media/upload" method:"post" tags:"Media" summary:"Upload media file" mime:"multipart/form-data"`
	TypeKey     string            `json:"type_key" v:"required#type_key is required"`
	OwnerType   string            `json:"owner_type" v:"required#owner_type is required"`
	OwnerID     string            `json:"owner_id"`
	Slot        string            `json:"slot"`
	DisplayName string            `json:"display_name"`
	Remark      string            `json:"remark"`
	File        *ghttp.UploadFile `json:"file" type:"file" v:"required#file is required"`
}

type UploadMediaRes struct {
	FileID string `json:"file_id"`
	URL    string `json:"url"`
}

type DeleteMediaReq struct {
	g.Meta `path:"/media/{id}" method:"delete" tags:"Media" summary:"Delete media file"`
	Id     string `json:"id" in:"path"`
}

type DeleteMediaRes struct{}

type UploadMyAvatarReq struct {
	g.Meta `path:"/users/me/avatar" method:"post" tags:"Media" summary:"Upload current user avatar" mime:"multipart/form-data"`
	File   *ghttp.UploadFile `json:"file" type:"file"`
}

type UploadMyAvatarRes struct {
	FileID string `json:"file_id"`
	URL    string `json:"url"`
}

type DeleteMyAvatarReq struct {
	g.Meta `path:"/users/me/avatar" method:"delete" tags:"Media" summary:"Delete current user avatar"`
}

type DeleteMyAvatarRes struct{}

type GetSoundsReq struct {
	g.Meta `path:"/sounds" method:"get" tags:"Media" summary:"Get system sound URLs"`
}

type GetSoundsRes struct{}

type GetSystemSoundCatalogReq struct {
	g.Meta `path:"/sounds/system" method:"get" tags:"Media" summary:"Get system sound catalog identifiers"`
}

type GetSystemSoundCatalogRes struct{}

type UploadSystemSoundReq struct {
	g.Meta      `path:"/admin/media/system.sound/{slot}" method:"post" tags:"Media" summary:"Upload system sound" mime:"multipart/form-data"`
	Slot        string            `json:"slot" in:"path" v:"required#slot is required"`
	DisplayName string            `json:"display_name"`
	Remark      string            `json:"remark"`
	File        *ghttp.UploadFile `json:"file" type:"file" v:"required#file is required"`
}

type UploadSystemSoundRes struct {
	FileID string `json:"file_id"`
	URL    string `json:"url"`
}
