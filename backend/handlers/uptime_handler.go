package handlers

import (
	"backend/config"
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type UptimeCheck struct {
	ID            string    `json:"id"`
	Service_ID    string    `json:"service_id"`
	Status_Code   int       `json:"status_code"`
	Response_Time int       `json:"response_time"`
	Is_Up         bool      `json:"is_up"`
	Error_Message string    `json:"error_message"`
	Checked_At    time.Time `json:"checked_at"`
}

type UptimeSummaryResponse struct {
	ServiceID       int     `json:"service_id"`
	From            string  `json:"from"`
	To              string  `json:"to"`
	TotalChecks     int     `json:"total_checks"`
	UpChecks        int     `json:"up_checks"`
	DownChecks      int     `json:"down_checks"`
	UptimePercent   float64 `json:"uptime_percent"`
	AvgResponseTime float64 `json:"avg_response_time"`
}

func GetUptimeChecks(c *fiber.Ctx) error {
	serviceID := c.Params("id")

	from := c.Query("from")
	to := c.Query("to")
	limit := c.Query("limit", "100")

	query := `
		SELECT id, service_id, status_code, response_time, is_up, COALESCE(error_message, ''), checked_at
		FROM uptime_checks
		WHERE service_id = $1`

	args := []any{serviceID}
	argIndex := 2

	if from != "" {
		query += " AND checked_at >= $" + strconv.Itoa(argIndex)
		args = append(args, from)
		argIndex++
	}

	if to != "" {
		query += " AND checked_at <= $" + strconv.Itoa(argIndex)
		args = append(args, to)
		argIndex++
	}

	query += " ORDER BY checked_at DESC LIMIT $" + strconv.Itoa(argIndex)
	args = append(args, limit)

	rows, err := config.DB.Query(context.Background(), query, args...)
	if err != nil {
		return err
	}
	defer rows.Close()

	results := []UptimeCheck{}

	for rows.Next() {
		var r UptimeCheck
		err := rows.Scan(
			&r.ID,
			&r.Service_ID,
			&r.Status_Code,
			&r.Response_Time,
			&r.Is_Up,
			&r.Error_Message,
			&r.Checked_At,
		)
		if err != nil {
			return err
		}
		results = append(results, r)
	}

	return c.JSON(fiber.Map{
		"resultData": results,
		"message":    "ดึงข้อมูลสำเร็จ",
	})
}

func GetUptimeSummary(c *fiber.Ctx) error {
	ctx := context.Background()

	// 1. path param
	serviceID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(400, "invalid service id")
	}

	// 2. query time range
	from := c.Query("from")
	to := c.Query("to")

	// default: last 24 hours
	if from == "" || to == "" {
		toTime := time.Now()
		fromTime := toTime.Add(-24 * time.Hour)

		from = fromTime.Format(time.RFC3339)
		to = toTime.Format(time.RFC3339)
	}

	// 3. query db
	var total, up, down int
	var avgRT *float64

	query := `
		SELECT
			COUNT(*) AS total_checks,
			COUNT(*) FILTER (WHERE is_up = true),
			COUNT(*) FILTER (WHERE is_up = false),
			AVG(response_time)
		FROM uptime_checks
		WHERE service_id = $1
		  AND checked_at BETWEEN $2 AND $3
	`

	err = config.DB.QueryRow(
		ctx,
		query,
		serviceID,
		from,
		to,
	).Scan(&total, &up, &down, &avgRT)

	if err != nil {
		return err
	}

	// 4. calculate uptime %
	var uptimePercent float64
	if total > 0 {
		uptimePercent = (float64(up) / float64(total)) * 100
	}

	resp := UptimeSummaryResponse{
		ServiceID:     serviceID,
		From:          from,
		To:            to,
		TotalChecks:   total,
		UpChecks:      up,
		DownChecks:    down,
		UptimePercent: uptimePercent,
		AvgResponseTime: func() float64 {
			if avgRT != nil {
				return *avgRT
			}
			return 0
		}(),
	}

	return c.JSON(fiber.Map{
		"resultData": resp,
		"message":    "ดึงข้อมูลสำเร็จ",
	})
}

func UpdateServiceStatusAndAlert(
	ctx context.Context,
	serviceID int,
	isUp bool,
	statusCode int,
	responseTime int,
) error {

	tx, err := config.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) // safety rollback

	// 1️⃣ ดึงสถานะเดิม
	var prevIsUp *bool

	err = tx.QueryRow(ctx, `
		SELECT is_up
		FROM service_status
		WHERE service_id = $1
		FOR UPDATE
	`, serviceID).Scan(&prevIsUp)

	// ถ้ายังไม่เคยมี record
	if err == pgx.ErrNoRows {
		prevIsUp = nil
	} else if err != nil {
		return err
	}

	// 2️⃣ upsert service_status
	_, err = tx.Exec(ctx, `
		INSERT INTO service_status (
			service_id, is_up, last_checked, response_time, status_code
		)
		VALUES ($1, $2, NOW(), $3, $4)
		ON CONFLICT (service_id)
		DO UPDATE SET
			is_up = EXCLUDED.is_up,
			last_checked = EXCLUDED.last_checked,
			response_time = EXCLUDED.response_time,
			status_code = EXCLUDED.status_code
	`,
		serviceID,
		isUp,
		responseTime,
		statusCode,
	)
	if err != nil {
		return err
	}

	// 3️⃣ ตรวจว่าต้องสร้าง alert ไหม
	if prevIsUp == nil || *prevIsUp != isUp {
		alertStatus := "DOWN"
		message := "Service is DOWN"

		if isUp {
			alertStatus = "RECOVERED"
			message = "Service has recovered"
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO alerts (service_id, status, message)
			VALUES ($1, $2, $3)
		`,
			serviceID,
			alertStatus,
			message,
		)
		if err != nil {
			return err
		}
	}

	// 4️⃣ commit transaction
	return tx.Commit(ctx)
}
