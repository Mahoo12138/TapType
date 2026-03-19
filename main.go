package main

import (
	_ "taptype/internal/packed"

	"github.com/gogf/gf/v2/os/gctx"

	"taptype/internal/cmd"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
