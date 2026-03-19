package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"github.com/pressly/goose/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"taptype/migrations"
)

var DB *gorm.DB

func Init(driver, dsn string) (*gorm.DB, error) {
	var dialector gorm.Dialector
	switch driver {
	case "sqlite":
		// Ensure the directory exists for SQLite file
		dir := filepath.Dir(dsn)
		if dir != "" && dir != "." {
			if err := os.MkdirAll(dir, 0750); err != nil {
				return nil, fmt.Errorf("create db dir: %w", err)
			}
		}
		dialector = sqlite.Open(dsn)
	case "postgres":
		dialector = postgres.Open(dsn)
	default:
		return nil, fmt.Errorf("unsupported DB_DRIVER: %s", driver)
	}

	gormDB, err := gorm.Open(dialector, &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	// Run goose migrations
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql.DB: %w", err)
	}
	if err := RunMigrations(sqlDB, driver); err != nil {
		return nil, fmt.Errorf("migration: %w", err)
	}

	DB = gormDB
	return gormDB, nil
}

func RunMigrations(sqlDB *sql.DB, driver string) error {
	dialect := driver
	if driver == "sqlite" {
		dialect = "sqlite3"
	}
	if err := goose.SetDialect(dialect); err != nil {
		return fmt.Errorf("goose set dialect: %w", err)
	}
	goose.SetBaseFS(migrations.FS)

	if err := goose.Up(sqlDB, "."); err != nil {
		return fmt.Errorf("goose up: %w", err)
	}
	return nil
}
