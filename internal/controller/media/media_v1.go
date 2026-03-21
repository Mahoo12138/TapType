package media

import (
	"context"
	"io"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"

	v1 "taptype/api/media/v1"
	"taptype/internal/model/code"
	mediaService "taptype/internal/service/media"
)

func (c *PublicControllerV1) GetMediaTypes(ctx context.Context, req *v1.GetMediaTypesReq) (res *v1.GetMediaTypesRes, err error) {
	r := g.RequestFromCtx(ctx)
	defs, err := c.mediaSvc.GetDefinitions(ctx)
	if err != nil {
		return nil, err
	}
	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": defs})
	return
}

func (c *ControllerV1) ListMedia(ctx context.Context, req *v1.ListMediaReq) (res *v1.ListMediaRes, err error) {
	r := g.RequestFromCtx(ctx)
	items, err := c.mediaSvc.ListByOwner(
		ctx,
		req.TypeKey,
		req.OwnerType,
		req.OwnerID,
		r.GetCtxVar("user_id").String(),
		r.GetCtxVar("role").String(),
	)
	if err != nil {
		return nil, err
	}
	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": items})
	return
}

func (c *ControllerV1) UploadMedia(ctx context.Context, req *v1.UploadMediaReq) (res *v1.UploadMediaRes, err error) {
	r := g.RequestFromCtx(ctx)
	file, data, err := readUpload(r, req.File)
	if err != nil {
		return nil, err
	}
	result, err := c.mediaSvc.Upload(ctx, mediaService.UploadReq{
		TypeKey:      req.TypeKey,
		OwnerType:    req.OwnerType,
		OwnerID:      req.OwnerID,
		Slot:         req.Slot,
		DisplayName:  req.DisplayName,
		Remark:       req.Remark,
		Filename:     file.Filename,
		Data:         data,
		OperatorID:   r.GetCtxVar("user_id").String(),
		OperatorRole: r.GetCtxVar("role").String(),
	})
	if err != nil {
		return nil, err
	}
	return &v1.UploadMediaRes{FileID: result.FileID, URL: result.URL}, nil
}

func (c *ControllerV1) DeleteMedia(ctx context.Context, req *v1.DeleteMediaReq) (res *v1.DeleteMediaRes, err error) {
	r := g.RequestFromCtx(ctx)
	if err = c.mediaSvc.Delete(ctx, req.Id, r.GetCtxVar("user_id").String(), r.GetCtxVar("role").String()); err != nil {
		return nil, err
	}
	return &v1.DeleteMediaRes{}, nil
}

func (c *ControllerV1) UploadMyAvatar(ctx context.Context, req *v1.UploadMyAvatarReq) (res *v1.UploadMyAvatarRes, err error) {
	r := g.RequestFromCtx(ctx)
	file, data, err := readUpload(r, req.File)
	if err != nil {
		return nil, err
	}
	result, err := c.mediaSvc.UploadUserAvatar(ctx, r.GetCtxVar("user_id").String(), file.Filename, data)
	if err != nil {
		return nil, err
	}
	return &v1.UploadMyAvatarRes{FileID: result.FileID, URL: result.URL}, nil
}

func (c *ControllerV1) DeleteMyAvatar(ctx context.Context, req *v1.DeleteMyAvatarReq) (res *v1.DeleteMyAvatarRes, err error) {
	r := g.RequestFromCtx(ctx)
	if err = c.mediaSvc.DeleteUserAvatar(ctx, r.GetCtxVar("user_id").String()); err != nil {
		return nil, err
	}
	return &v1.DeleteMyAvatarRes{}, nil
}

func (c *ControllerV1) GetSounds(ctx context.Context, req *v1.GetSoundsReq) (res *v1.GetSoundsRes, err error) {
	r := g.RequestFromCtx(ctx)
	sounds, err := c.mediaSvc.GetSystemSounds(ctx)
	if err != nil {
		return nil, err
	}
	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": sounds})
	return
}

func (c *ControllerV1) GetSystemSoundCatalog(ctx context.Context, req *v1.GetSystemSoundCatalogReq) (res *v1.GetSystemSoundCatalogRes, err error) {
	r := g.RequestFromCtx(ctx)
	sounds, err := c.mediaSvc.GetSystemSounds(ctx)
	if err != nil {
		return nil, err
	}
	r.Response.WriteJsonExit(g.Map{"code": 0, "message": "success", "data": sounds})
	return
}

func (c *AdminControllerV1) UploadSystemSound(ctx context.Context, req *v1.UploadSystemSoundReq) (res *v1.UploadSystemSoundRes, err error) {
	r := g.RequestFromCtx(ctx)
	file, data, err := readUpload(r, req.File)
	if err != nil {
		return nil, err
	}
	result, err := c.mediaSvc.Upload(ctx, mediaService.UploadReq{
		TypeKey:      "system.sound",
		OwnerType:    "system",
		OwnerID:      "",
		Slot:         req.Slot,
		DisplayName:  req.DisplayName,
		Remark:       req.Remark,
		Filename:     file.Filename,
		Data:         data,
		OperatorID:   r.GetCtxVar("user_id").String(),
		OperatorRole: r.GetCtxVar("role").String(),
	})
	if err != nil {
		return nil, err
	}
	return &v1.UploadSystemSoundRes{FileID: result.FileID, URL: result.URL}, nil
}

func readUpload(r *ghttp.Request, reqFile *ghttp.UploadFile) (*ghttp.UploadFile, []byte, error) {
	file := reqFile
	if file == nil {
		file = r.GetUploadFile("file")
	}
	if file == nil {
		return nil, nil, gerror.NewCode(code.CodeBadRequest, "file is required")
	}
	f, err := file.Open()
	if err != nil {
		return nil, nil, gerror.NewCode(code.CodeBadRequest, "cannot read file")
	}
	defer f.Close()
	data, err := io.ReadAll(f)
	if err != nil {
		return nil, nil, gerror.NewCode(code.CodeBadRequest, "cannot read file")
	}
	return file, data, nil
}
