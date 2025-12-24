package services

import (
	"backend/config"
	"backend/handlers"
	"context"
	"net/http"
	"time"
)

func RunUptimeCheck(ctx context.Context, s handlers.Service) {
	start := time.Now()

	// 1️⃣ สร้าง HTTP client + timeout
	client := &http.Client{
		Timeout: time.Duration(s.Timeout_Ms) * time.Millisecond,
	}

	req, err := http.NewRequest(s.Method, s.Url, nil)
	if err != nil {
		saveFailure(ctx, s.ID, 0, 0, err.Error())
		return
	}

	// 2️⃣ ยิง request
	resp, err := client.Do(req)
	elapsed := int(time.Since(start).Milliseconds())

	// ❌ request fail (timeout / dns / connect)
	if err != nil {
		saveFailure(ctx, s.ID, 0, elapsed, err.Error())
		return
	}
	defer resp.Body.Close()

	// 3️⃣ ประเมินผล
	isUp := resp.StatusCode == s.Expected_Status

	// 4️⃣ บันทึก log
	err = saveCheckLog(ctx, s.ID, resp.StatusCode, elapsed, isUp, "")
	if err != nil {
		return
	}

	// 5️⃣ update status + alert (TRANSACTION)
	_ = handlers.UpdateServiceStatusAndAlert(
		ctx,
		s.ID,
		isUp,
		resp.StatusCode,
		elapsed,
	)

	BroadcastStatus(StatusMessage{
		ServiceID:    s.ID,
		IsUp:         isUp,
		StatusCode:   resp.StatusCode,
		ResponseTime: elapsed,
		CheckedAt:    time.Now().Format(time.RFC3339),
	})
}

func saveCheckLog(
	ctx context.Context,
	serviceID int,
	statusCode int,
	responseTime int,
	isUp bool,
	errMsg string,
) error {

	_, err := config.DB.Exec(ctx, `
		INSERT INTO uptime_checks (
			service_id, status_code, response_time, is_up, error_message
		)
		VALUES ($1, $2, $3, $4, $5)
	`,
		serviceID,
		statusCode,
		responseTime,
		isUp,
		errMsg,
	)

	return err
}

func saveFailure(
	ctx context.Context,
	serviceID int,
	statusCode int,
	responseTime int,
	errMsg string,
) {
	_ = saveCheckLog(ctx, serviceID, statusCode, responseTime, false, errMsg)

	_ = handlers.UpdateServiceStatusAndAlert(
		ctx,
		serviceID,
		false,
		statusCode,
		responseTime,
	)

	BroadcastStatus(StatusMessage{
		ServiceID:    serviceID,
		IsUp:         false,
		StatusCode:   statusCode,
		ResponseTime: responseTime,
		CheckedAt:    time.Now().Format(time.RFC3339),
	})
}

func LoadActiveServices(ctx context.Context) ([]handlers.Service, error) {
	rows, err := config.DB.Query(ctx, `
		SELECT id, name, url, method, expected_status, timeout_ms, interval_sec
		FROM services
		WHERE is_active = true
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []handlers.Service

	for rows.Next() {
		var s handlers.Service
		rows.Scan(
			&s.ID,
			&s.Name,
			&s.Url,
			&s.Method,
			&s.Expected_Status,
			&s.Timeout_Ms,
			&s.Interval_Sec,
		)
		services = append(services, s)
	}

	return services, nil
}
