package resource

import "embed"

//go:embed frontend/dist
var Frontend embed.FS

//go:embed sounds/**
var Sounds embed.FS
