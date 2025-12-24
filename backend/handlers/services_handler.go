package handlers

import (
	"context"
	"time"

	"backend/config"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type Service struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Url             string `json:"url"`
	Method          string `json:"method"`
	Expected_Status int    `json:"expected_status"`
	Timeout_Ms      int    `json:"timeout_ms"`
	Interval_Sec    int    `json:"interval_sec"`
	Is_Active       bool   `json:"is_active"`
	Created_At      time.Time `json:"created_at"`
	Updated_At      time.Time `json:"updated_at"`
}

type CreateServiceRequest struct {
	Name            string `json:"name"`
	Url             string `json:"url"`
	Method          string `json:"method"`
	Expected_Status int    `json:"expected_status"`
	Timeout_Ms      int    `json:"timeout_ms"`
	Interval_Sec    int    `json:"interval_sec"`
}

func GetServices(c *fiber.Ctx) error {
	sql := `
		SELECT
			id,
			name,
			url,
			method,
			expected_status,
			timeout_ms,
			interval_sec,
			COALESCE(is_active, false),
			created_at,
			updated_at
		FROM services
		ORDER BY id
	`
	rows, err := config.DB.Query(context.Background(), sql)

	if err != nil {
		return err
	}

	defer rows.Close()

	services := []Service{}

	for rows.Next() {
		var s Service
		if err := rows.Scan(
			&s.ID,
			&s.Name,
			&s.Url,
			&s.Method,
			&s.Expected_Status,
			&s.Timeout_Ms,
			&s.Interval_Sec,
			&s.Is_Active,
			&s.Created_At,
			&s.Updated_At,
		); err != nil {
			return err
		}
		services = append(services, s)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"resultData": services,
		"message":    "ดึงข้อมูลสำเร็จ",
	})
}

func CreateService(c *fiber.Ctx) error {
	createReq := new(CreateServiceRequest)

	if err := c.BodyParser(createReq); err != nil {
		return err
	}

	sql := "INSERT INTO services (name, url, method, expected_status, timeout_ms, interval_sec) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id"

	var id string
	err := config.DB.QueryRow(
		context.Background(),
		sql,
		createReq.Name,
		createReq.Url,
		createReq.Method,
		createReq.Expected_Status,
		createReq.Timeout_Ms,
		createReq.Interval_Sec,
	).Scan(&id)

	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"id": id,
	})

}

func GetServiceByID(c *fiber.Ctx) error {
	id := c.Params("id")

	sql := `
		SELECT
			id,
			name,
			url,
			method,
			expected_status,
			timeout_ms,
			interval_sec,
			COALESCE(is_active, false),
			created_at,
			updated_at
		FROM services
		WHERE id = $1
	`
	row := config.DB.QueryRow(context.Background(), sql, id)

	s := Service{}

	if err := row.Scan(
		&s.ID,
		&s.Name,
		&s.Url,
		&s.Method,
		&s.Expected_Status,
		&s.Timeout_Ms,
		&s.Interval_Sec,
		&s.Is_Active,
		&s.Created_At,
		&s.Updated_At,
	); err != nil {
		if err == pgx.ErrNoRows {
			return fiber.NewError(404, "service not found")
		}
		return err
	}

	return c.JSON(fiber.Map{
		"resultData": s,
		"message":    "ดึงข้อมูลสำเร็จ",
	})
}

func UpdateService(c *fiber.Ctx) error {
	id := c.Params("id")
	updateReq := new(CreateServiceRequest)
	if err := c.BodyParser(updateReq); err != nil {
		return err
	}

	sql := "UPDATE services SET name=$1, url=$2, method=$3, expected_status=$4, timeout_ms=$5, interval_sec=$6, updated_at=NOW() WHERE id=$7"

	_, err := config.DB.Exec(
		context.Background(),
		sql,
		updateReq.Name,
		updateReq.Url,
		updateReq.Method,
		updateReq.Expected_Status,
		updateReq.Timeout_Ms,
		updateReq.Interval_Sec,
		id,
	)

	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message": "อัพเดทข้อมูลสำเร็จ",
	})
}

func DeleteService(c *fiber.Ctx) error {
	id := c.Params("id")
	sql := "DELETE FROM services WHERE id = $1"

	_, err := config.DB.Exec(context.Background(), sql, id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message": "ลบข้อมูลสำเร็จ",
	})
}
