package i18n

import (
	"time"
)

var timezoneMap = map[string]string{
	"zh-CN": "Asia/Shanghai",
	"en-US": "America/New_York",
	"ja-JP": "Asia/Tokyo",
}

func GetLocation(locale string) *time.Location {
	tz, ok := timezoneMap[locale]
	if !ok {
		tz = "UTC"
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}

func FormatTime(t time.Time, locale, format string) string {
	loc := GetLocation(locale)
	return t.In(loc).Format(format)
}
