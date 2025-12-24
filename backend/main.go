package main

import (
	"context"
	"log"
	"os"

	"backend/config"
	"backend/routes"
	"backend/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env")
	}

	config.ConnectDB()

	app := fiber.New()

	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:3000,http://127.0.0.1:3000"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: corsOrigins,
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	routes.ServicesRoutes(app)
	services.SetupStatusWebsocket(app)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go services.StartStatusHub(ctx)
	go services.StartUptimeScheduler(ctx)

	app.Listen(":4001")
}
