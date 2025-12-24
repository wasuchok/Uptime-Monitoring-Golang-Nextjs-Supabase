package routes

import (
	"backend/handlers"

	"github.com/gofiber/fiber/v2"
)

func ServicesRoutes(app *fiber.App) {

	api := app.Group("/api/v1")
	api.Get("/services", handlers.GetServices)
	api.Post("/services", handlers.CreateService)
	api.Get("/services/:id", handlers.GetServiceByID)
	api.Put("/services/:id", handlers.UpdateService)
	api.Delete("/services/:id", handlers.DeleteService)

	api.Get("/services/:id/checks", handlers.GetUptimeChecks)
	api.Get("/services/:id/uptime", handlers.GetUptimeSummary)
	api.Get("/status", handlers.GetAllServiceStatus)
	api.Get("/services/:id/status", handlers.GetServiceStatus)
}
