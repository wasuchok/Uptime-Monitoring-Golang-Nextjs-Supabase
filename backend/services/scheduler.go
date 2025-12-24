package services

import (
	"context"
	"time"
)

func StartUptimeScheduler(ctx context.Context) {
	// ตรวจทุก 5 วินาทีว่าถึงเวลารันของบริการใดบ้างตาม interval_sec
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	lastRun := make(map[int]time.Time)

	for {
		select {
		case now := <-ticker.C:
			services, err := LoadActiveServices(ctx)
			if err != nil {
				continue
			}

			for _, s := range services {
				interval := time.Duration(s.Interval_Sec) * time.Second
				if interval <= 0 {
					interval = 10 * time.Second
				}

				lr, ok := lastRun[s.ID]
				if !ok || now.Sub(lr) >= interval {
					lastRun[s.ID] = now
					go RunUptimeCheck(ctx, s)
				}
			}

		case <-ctx.Done():
			return
		}
	}
}
