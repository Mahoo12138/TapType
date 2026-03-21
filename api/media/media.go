package media

import (
	"context"

	v1 "taptype/api/media/v1"
)

type IMediaV1 interface {
	ListMedia(ctx context.Context, req *v1.ListMediaReq) (res *v1.ListMediaRes, err error)
	UploadMedia(ctx context.Context, req *v1.UploadMediaReq) (res *v1.UploadMediaRes, err error)
	DeleteMedia(ctx context.Context, req *v1.DeleteMediaReq) (res *v1.DeleteMediaRes, err error)
	UploadMyAvatar(ctx context.Context, req *v1.UploadMyAvatarReq) (res *v1.UploadMyAvatarRes, err error)
	DeleteMyAvatar(ctx context.Context, req *v1.DeleteMyAvatarReq) (res *v1.DeleteMyAvatarRes, err error)
	GetSounds(ctx context.Context, req *v1.GetSoundsReq) (res *v1.GetSoundsRes, err error)
	GetSystemSoundCatalog(ctx context.Context, req *v1.GetSystemSoundCatalogReq) (res *v1.GetSystemSoundCatalogRes, err error)
}

type IMediaPublicV1 interface {
	GetMediaTypes(ctx context.Context, req *v1.GetMediaTypesReq) (res *v1.GetMediaTypesRes, err error)
}

type IAdminMediaV1 interface {
	UploadSystemSound(ctx context.Context, req *v1.UploadSystemSoundReq) (res *v1.UploadSystemSoundRes, err error)
}
