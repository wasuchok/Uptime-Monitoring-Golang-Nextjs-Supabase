package handlers

import (
	"backend/config"
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type ServiceStatusResponse struct {
	ServiceID     int    `json:"service_id"`
	Name          string `json:"name"`
	URL           string `json:"url"`
	IsUp          bool   `json:"is_up"`
	StatusCode    int    `json:"status_code"`
	ResponseTime  int    `json:"response_time"`
	LastCheckedAt string `json:"last_checked_at"`
}

func GetAllServiceStatus(c *fiber.Ctx) error {
	ctx := context.Background()

	rows, err := config.DB.Query(ctx, `
		SELECT
			s.id,
			s.name,
			s.url,
			COALESCE(ss.is_up, false),
			COALESCE(ss.status_code, 0),
			COALESCE(ss.response_time, 0),
			ss.last_checked
		FROM services s
		LEFT JOIN service_status ss ON s.id = ss.service_id
		ORDER BY s.name
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	results := []ServiceStatusResponse{}

	for rows.Next() {
		var r ServiceStatusResponse
		var lastChecked *time.Time

		err := rows.Scan(
			&r.ServiceID,
			&r.Name,
			&r.URL,
			&r.IsUp,
			&r.StatusCode,
			&r.ResponseTime,
			&lastChecked,
		)
		if err != nil {
			return err
		}

		if lastChecked != nil {
			r.LastCheckedAt = lastChecked.Format(time.RFC3339)
		}

		results = append(results, r)
	}

	return c.JSON(results)
}

func GetServiceStatus(c *fiber.Ctx) error {
	ctx := context.Background()

	serviceID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(400, "invalid service id")
	}

	var r ServiceStatusResponse
	var lastChecked *time.Time

	err = config.DB.QueryRow(ctx, `
		SELECT
			s.id,
			s.name,
			s.url,
			COALESCE(ss.is_up, false),
			COALESCE(ss.status_code, 0),
			COALESCE(ss.response_time, 0),
			ss.last_checked
		FROM services s
		LEFT JOIN service_status ss ON s.id = ss.service_id
		WHERE s.id = $1
	`, serviceID).Scan(
		&r.ServiceID,
		&r.Name,
		&r.URL,
		&r.IsUp,
		&r.StatusCode,
		&r.ResponseTime,
		&lastChecked,
	)

	if err == pgx.ErrNoRows {
		return fiber.NewError(404, "service not found")
	}
	if err != nil {
		return err
	}

	if lastChecked != nil {
		r.LastCheckedAt = lastChecked.Format(time.RFC3339)
	}

	return c.JSON(r)
}
