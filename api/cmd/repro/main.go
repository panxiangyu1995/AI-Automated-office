package main

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/tenant"
)

func main() {
	dsn := "host=localhost port=5432 user=ai_office password=ai_office_pass dbname=ai_office sslmode=disable"
	base, err := gorm.Open(postgres.Open(dsn), &gorm.Config{SkipDefaultTransaction: true, PrepareStmt: false})
	if err != nil {
		panic(err)
	}
	tenant.RegisterSchemaCallbacks(base)
	tenant.InitGlobalDB(base)

	connDB := tenant.UseSchema(base, "f2802128-705b-4201-a261-bfe05ffffb61")
	defer tenant.ReleaseConn(connDB)

	defer func() {
		if r := recover(); r != nil {
			fmt.Println("PANIC:", r)
		}
	}()

	// Step 1: FindPlanByID (like Subscribe)
	var plan model.SubscriptionPlan
	err = connDB.Where("id = ?", "b9000001-0000-0000-0000-000000000001").First(&plan).Error
	fmt.Println("find plan err:", err, "| price:", plan.PriceMonthly)

	// Step 2: Create Subscription
	now := time.Now().Format(time.RFC3339)
	sub := &model.EnterpriseSubscription{
		EnterpriseID:       "f2802128-705b-4201-a261-bfe05ffffb61",
		PlanID:             "b9000001-0000-0000-0000-000000000001",
		Status:             "active",
		StartAt:            &now,
		EndAt:              &now,
		AutoRenew:          true,
		CurrentPeriodStart: &now,
		CurrentPeriodEnd:   &now,
		BillingCycle:       "monthly",
	}
	err = connDB.Create(sub).Error
	fmt.Println("create sub err:", err, "| sub.ID:", sub.ID.String())

	// Step 3: Create BillingRecord
	nowT := time.Now()
	rec := &model.BillingRecord{
		EnterpriseID:   uuid.MustParse("f2802128-705b-4201-a261-bfe05ffffb61"),
		SubscriptionID: sub.ID,
		Amount:         plan.PriceMonthly,
		Type:           "charge",
		Status:         "pending",
		PeriodStart:    &nowT,
		PeriodEnd:      &nowT,
		DueDate:        &nowT,
	}
	err = connDB.Create(rec).Error
	fmt.Println("create record err:", err)
}
