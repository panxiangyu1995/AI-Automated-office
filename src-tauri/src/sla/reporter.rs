//! SLA 报告生成模块
//!
//! 提供 SLA 报告的生成和多维度统计功能

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};

/// 报告周期
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReportPeriod {
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

impl ReportPeriod {
    /// 获取周期时长
    pub fn get_duration(&self) -> Duration {
        match self {
            ReportPeriod::Hourly => Duration::hours(1),
            ReportPeriod::Daily => Duration::days(1),
            ReportPeriod::Weekly => Duration::weeks(1),
            ReportPeriod::Monthly => Duration::days(30),
            ReportPeriod::Quarterly => Duration::days(90),
            ReportPeriod::Yearly => Duration::days(365),
        }
    }
}

/// 报告格式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReportFormat {
    Json,
    Csv,
    Html,
    Pdf,
}

/// SLA 报告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaReport {
    /// 报告 ID
    pub report_id: String,
    /// 服务 ID
    pub service_id: String,
    /// 服务名称
    pub service_name: String,
    /// 报告周期
    pub period: ReportPeriod,
    /// 开始时间
    pub start_time: DateTime<Utc>,
    /// 结束时间
    pub end_time: DateTime<Utc>,
    /// 可用率
    pub availability: f64,
    /// SLA 目标
    pub sla_target: f64,
    /// 是否满足 SLA
    pub meets_sla: bool,
    /// 平均响应时间（毫秒）
    pub avg_response_time_ms: f64,
    /// 最大响应时间（毫秒）
    pub max_response_time_ms: f64,
    /// P95 响应时间（毫秒）
    pub p95_response_time_ms: f64,
    /// 错误率
    pub error_rate: f64,
    /// 总请求数
    pub total_requests: u64,
    /// 成功请求数
    pub successful_requests: u64,
    /// 失败请求数
    pub failed_requests: u64,
    /// 事件数
    pub incident_count: usize,
    /// 停机时长（秒）
    pub downtime_secs: u64,
    /// 数据质量分数
    pub data_quality_score: f64,
    /// 报告生成时间
    pub generated_at: DateTime<Utc>,
    /// 报告格式
    pub format: ReportFormat,
}

impl SlaReport {
    /// 创建新的 SLA 报告
    pub fn new(
        service_id: String,
        service_name: String,
        period: ReportPeriod,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Self {
        Self {
            report_id: uuid::Uuid::new_v4().to_string(),
            service_id,
            service_name,
            period,
            start_time,
            end_time,
            availability: 100.0,
            sla_target: 99.9,
            meets_sla: true,
            avg_response_time_ms: 0.0,
            max_response_time_ms: 0.0,
            p95_response_time_ms: 0.0,
            error_rate: 0.0,
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            incident_count: 0,
            downtime_secs: 0,
            data_quality_score: 100.0,
            generated_at: Utc::now(),
            format: ReportFormat::Json,
        }
    }
}

/// 维度统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DimensionStats {
    /// 维度名称
    pub dimension_name: String,
    /// 维度值
    pub dimension_value: String,
    /// 请求数
    pub request_count: u64,
    /// 成功数
    pub success_count: u64,
    /// 失败数
    pub failure_count: u64,
    /// 错误率
    pub error_rate: f64,
    /// 平均响应时间
    pub avg_response_time_ms: f64,
}

/// 多维度统计报告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiDimensionalReport {
    /// 报告 ID
    pub report_id: String,
    /// 服务 ID
    pub service_id: String,
    /// 时间范围
    pub start_time: DateTime<Utc>,
    /// 结束时间
    pub end_time: DateTime<Utc>,
    /// 维度统计列表
    pub dimension_stats: Vec<DimensionStats>,
    /// 总体统计
    pub overall_stats: DimensionStats,
    /// 生成时间
    pub generated_at: DateTime<Utc>,
}

/// SLA 趋势数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaTrendData {
    /// 时间点
    pub timestamp: DateTime<Utc>,
    /// 可用率
    pub availability: f64,
    /// 响应时间
    pub response_time_ms: f64,
    /// 错误率
    pub error_rate: f64,
}

/// SLA 趋势报告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaTrendReport {
    /// 服务 ID
    pub service_id: String,
    /// 服务名称
    pub service_name: String,
    /// 趋势数据点
    pub data_points: Vec<SlaTrendData>,
    /// 趋势方向
    pub trend_direction: TrendDirection,
    /// 平均值
    pub avg_availability: f64,
    /// 最小值
    pub min_availability: f64,
    /// 最大值
    pub max_availability: f64,
}

/// 趋势方向
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrendDirection {
    Improving,
    Stable,
    Declining,
}

/// SLA 报告生成器
pub struct SlaReporter {
    /// 报告存储
    reports: Vec<SlaReport>,
    /// 维度统计存储
    dimension_reports: Vec<MultiDimensionalReport>,
    /// 趋势数据存储
    trend_reports: Vec<SlaTrendReport>,
    /// 最大报告存储数
    max_reports: usize,
}

impl SlaReporter {
    /// 创建新的 SLA 报告生成器
    pub fn new() -> Self {
        Self {
            reports: Vec::new(),
            dimension_reports: Vec::new(),
            trend_reports: Vec::new(),
            max_reports: 100,
        }
    }

    /// 生成 SLA 报告
    pub fn generate_report(&mut self, report: SlaReport) {
        self.reports.push(report);
        self.trim_reports();
    }

    /// 获取报告
    pub fn get_report(&self, report_id: &str) -> Option<&SlaReport> {
        self.reports.iter().find(|r| r.report_id == report_id)
    }

    /// 获取所有报告
    pub fn get_all_reports(&self) -> &[SlaReport] {
        &self.reports
    }

    /// 获取指定服务的报告
    pub fn get_service_reports(&self, service_id: &str) -> Vec<&SlaReport> {
        self.reports.iter()
            .filter(|r| r.service_id == service_id)
            .collect()
    }

    /// 获取指定周期的报告
    pub fn get_reports_by_period(&self, period: ReportPeriod) -> Vec<&SlaReport> {
        self.reports.iter()
            .filter(|r| r.period == period)
            .collect()
    }

    /// 获取指定时间范围的报告
    pub fn get_reports_in_range(&self, start: DateTime<Utc>, end: DateTime<Utc>) -> Vec<&SlaReport> {
        self.reports.iter()
            .filter(|r| r.start_time >= start && r.end_time <= end)
            .collect()
    }

    /// 获取满足 SLA 的报告
    pub fn get_sla_met_reports(&self) -> Vec<&SlaReport> {
        self.reports.iter()
            .filter(|r| r.meets_sla)
            .collect()
    }

    /// 获取未满足 SLA 的报告
    pub fn get_sla_violated_reports(&self) -> Vec<&SlaReport> {
        self.reports.iter()
            .filter(|r| !r.meets_sla)
            .collect()
    }

    /// 生成维度统计报告
    pub fn generate_dimension_report(&mut self, report: MultiDimensionalReport) {
        self.dimension_reports.push(report);
        if self.dimension_reports.len() > self.max_reports {
            self.dimension_reports.remove(0);
        }
    }

    /// 获取维度统计报告
    pub fn get_dimension_report(&self, report_id: &str) -> Option<&MultiDimensionalReport> {
        self.dimension_reports.iter().find(|r| r.report_id == report_id)
    }

    /// 生成趋势报告
    pub fn generate_trend_report(&mut self, report: SlaTrendReport) {
        self.trend_reports.push(report);
        if self.trend_reports.len() > self.max_reports {
            self.trend_reports.remove(0);
        }
    }

    /// 获取趋势报告
    pub fn get_trend_report(&self, service_id: &str) -> Option<&SlaTrendReport> {
        self.trend_reports.iter().find(|r| r.service_id == service_id)
    }

    /// 获取所有趋势报告
    pub fn get_all_trend_reports(&self) -> Vec<&SlaTrendReport> {
        self.trend_reports.iter().collect()
    }

    /// 计算趋势方向
    pub fn calculate_trend_direction(data_points: &[SlaTrendData]) -> TrendDirection {
        if data_points.len() < 2 {
            return TrendDirection::Stable;
        }

        let mid_point = data_points.len() / 2;
        let first_half_avg: f64 = data_points[..mid_point].iter()
            .map(|dp| dp.availability)
            .sum::<f64>() / mid_point as f64;
        let second_half_avg: f64 = data_points[mid_point..].iter()
            .map(|dp| dp.availability)
            .sum::<f64>() / (data_points.len() - mid_point) as f64;

        let diff = second_half_avg - first_half_avg;
        if diff > 0.1 {
            TrendDirection::Improving
        } else if diff < -0.1 {
            TrendDirection::Declining
        } else {
            TrendDirection::Stable
        }
    }

    /// 导出报告为 JSON
    pub fn export_as_json(&self, report_id: &str) -> Option<String> {
        self.get_report(report_id)
            .map(|r| serde_json::to_string_pretty(r).ok())
            .flatten()
    }

    /// 导出报告为 CSV
    pub fn export_as_csv(&self, report_id: &str) -> Option<String> {
        self.get_report(report_id).map(|r| {
            format!(
                "Metric,Value\n\
                 Service ID,{}\n\
                 Service Name,{}\n\
                 Period,{:?}\n\
                 Availability,{:.2}%\n\
                 SLA Target,{:.2}%\n\
                 Meets SLA,{}\n\
                 Avg Response Time,{:.2}ms\n\
                 Max Response Time,{:.2}ms\n\
                 P95 Response Time,{:.2}ms\n\
                 Error Rate,{:.2}%\n\
                 Total Requests,{}\n\
                 Failed Requests,{}",
                r.service_id,
                r.service_name,
                r.period,
                r.availability,
                r.sla_target,
                r.meets_sla,
                r.avg_response_time_ms,
                r.max_response_time_ms,
                r.p95_response_time_ms,
                r.error_rate,
                r.total_requests,
                r.failed_requests,
            )
        })
    }

    /// 清理过期报告
    pub fn cleanup_old_reports(&mut self, threshold_days: u32) {
        let threshold = Utc::now() - Duration::days(threshold_days as i64);
        self.reports.retain(|r| r.generated_at > threshold);
    }

    /// 获取统计摘要
    pub fn get_summary(&self) -> ReporterSummary {
        let total_reports = self.reports.len();
        let sla_met = self.reports.iter().filter(|r| r.meets_sla).count();
        let sla_violated = total_reports - sla_met;
        let avg_availability = if self.reports.is_empty() {
            100.0
        } else {
            self.reports.iter().map(|r| r.availability).sum::<f64>() / total_reports as f64
        };

        ReporterSummary {
            total_reports,
            sla_met_count: sla_met,
            sla_violated_count: sla_violated,
            overall_sla_compliance: if total_reports > 0 {
                (sla_met as f64 / total_reports as f64) * 100.0
            } else {
                100.0
            },
            avg_availability,
            total_trend_reports: self.trend_reports.len(),
        }
    }

    /// 修剪报告列表
    fn trim_reports(&mut self) {
        while self.reports.len() > self.max_reports {
            self.reports.remove(0);
        }
    }
}

impl Default for SlaReporter {
    fn default() -> Self {
        Self::new()
    }
}

/// 报告生成器摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReporterSummary {
    /// 总报告数
    pub total_reports: usize,
    /// SLA 达成数
    pub sla_met_count: usize,
    /// SLA 违反数
    pub sla_violated_count: usize,
    /// 整体 SLA 合规率
    pub overall_sla_compliance: f64,
    /// 平均可用率
    pub avg_availability: f64,
    /// 趋势报告数
    pub total_trend_reports: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_report() {
        let mut reporter = SlaReporter::new();
        
        let mut report = SlaReport::new(
            "svc-1".to_string(),
            "API Service".to_string(),
            ReportPeriod::Daily,
            Utc::now() - Duration::days(1),
            Utc::now(),
        );
        report.availability = 99.5;
        report.sla_target = 99.9;
        report.meets_sla = false;
        
        reporter.generate_report(report);
        
        assert_eq!(reporter.reports.len(), 1);
    }

    #[test]
    fn test_get_sla_met_reports() {
        let mut reporter = SlaReporter::new();
        
        let mut report1 = SlaReport::new(
            "svc-1".to_string(),
            "Service 1".to_string(),
            ReportPeriod::Daily,
            Utc::now() - Duration::days(1),
            Utc::now(),
        );
        report1.meets_sla = true;
        
        let mut report2 = SlaReport::new(
            "svc-2".to_string(),
            "Service 2".to_string(),
            ReportPeriod::Daily,
            Utc::now() - Duration::days(1),
            Utc::now(),
        );
        report2.meets_sla = false;
        
        reporter.generate_report(report1);
        reporter.generate_report(report2);
        
        let met = reporter.get_sla_met_reports();
        assert_eq!(met.len(), 1);
    }

    #[test]
    fn test_export_as_csv() {
        let reporter = SlaReporter::new();
        
        let csv = reporter.export_as_csv("non-existent");
        assert!(csv.is_none());
    }

    #[test]
    fn test_trend_direction() {
        let mut data_points = Vec::new();
        for i in 1..=10 {
            data_points.push(SlaTrendData {
                timestamp: Utc::now() - Duration::hours(10 - i),
                availability: 99.0 + i as f64 * 0.1,
                response_time_ms: 100.0,
                error_rate: 1.0,
            });
        }
        
        let direction = SlaReporter::calculate_trend_direction(&data_points);
        assert_eq!(direction, TrendDirection::Improving);
    }
}
