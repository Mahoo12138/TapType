package analysis

import (
	"context"

	v1 "taptype/api/analysis/v1"
)

type IAnalysisV1 interface {
	GetTrend(ctx context.Context, req *v1.GetTrendReq) (res *v1.GetTrendRes, err error)
	GetKeymap(ctx context.Context, req *v1.GetKeymapReq) (res *v1.GetKeymapRes, err error)
	GetSummary(ctx context.Context, req *v1.GetSummaryReq) (res *v1.GetSummaryRes, err error)
}
