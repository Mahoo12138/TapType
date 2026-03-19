package daily

import (
	"context"

	v1 "taptype/api/daily/v1"
)

type IDailyV1 interface {
	GetToday(ctx context.Context, req *v1.GetTodayReq) (res *v1.GetTodayRes, err error)
}
