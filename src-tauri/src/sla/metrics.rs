//! SLA 指标收集模块
//!
//! 提供系统指标的收集、存储和聚合功能

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};

/// 指标类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MetricType {
    /// 请求数
    RequestCount,
    /// 响应时间
    ResponseTime,
    /// 错误数
    ErrorCount,
    /// 可用率
    Availability,
    /// CPU 使用率
    CpuUsage,
    /// 内存使用率
    MemoryUsage,
    /// 磁盘使用率
    DiskUsage,
    /// 网络流量
    NetworkTraffic,
    /// 自定义
    Custom,
}

/// 指标数据点
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricDataPoint {
    /// 时间戳
    pub timestamp: DateTime<Utc>,
    /// 值
    pub value: f64,
}

/// SLA 指标
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaMetric {
    /// 指标名称
    pub name: String,
    /// 指标类型
    pub metric_type: MetricType,
    /// 单位
    pub unit: String,
    /// 当前值
    pub current_value: f64,
    /// 最小值
    pub min_value: f64,
    /// 最大值
    pub max_value: f64,
    /// 平均值
    pub avg_value: f64,
    /// 数据点列表
    pub data_points: Vec<MetricDataPoint>,
}

/// 指标收集配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsCollectorConfig {
    /// 保留的数据点数量
    pub max_data_points: usize,
    /// 聚合间隔（秒）
    pub aggregation_interval_secs: u64,
    /// 是否启用自动清理
    pub auto_cleanup_enabled: bool,
    /// 清理阈值（小时）
    pub cleanup_threshold_hours: u64,
}

impl Default for MetricsCollectorConfig {
    fn default() -> Self {
        Self {
            max_data_points: 1000,
            aggregation_interval_secs: 60,
            auto_cleanup_enabled: true,
            cleanup_threshold_hours: 24,
        }
    }
}

/// 指标收集器
pub struct MetricsCollector {
    /// 指标存储
    metrics: HashMap<String, SlaMetric>,
    /// 原始数据点队列
    raw_data: HashMap<String, VecDeque<MetricDataPoint>>,
    /// 配置
    config: MetricsCollectorConfig,
}

impl MetricsCollector {
    /// 创建新的指标收集器
    pub fn new() -> Self {
        Self {
            metrics: HashMap::new(),
            raw_data: HashMap::new(),
            config: MetricsCollectorConfig::default(),
        }
    }

    /// 创建带有配置的指标收集器
    pub fn with_config(config: MetricsCollectorConfig) -> Self {
        Self {
            metrics: HashMap::new(),
            raw_data: HashMap::new(),
            config,
        }
    }

    /// 记录指标数据
    pub fn record(&mut self, name: &str, metric_type: MetricType, value: f64, unit: &str) {
        let timestamp = Utc::now();
        let data_point = MetricDataPoint { timestamp, value };

        // 添加到原始数据队列
        let raw_queue = self.raw_data.entry(name.to_string()).or_insert_with(VecDeque::new);
        raw_queue.push_back(data_point);

        // 限制队列大小
        while raw_queue.len() > self.config.max_data_points {
            raw_queue.pop_front();
        }

        // 更新聚合指标
        let metric = self.metrics.entry(name.to_string()).or_insert_with(|| {
            SlaMetric {
                name: name.to_string(),
                metric_type,
                unit: unit.to_string(),
                current_value: value,
                min_value: value,
                max_value: value,
                avg_value: value,
                data_points: Vec::new(),
            }
        });

        metric.current_value = value;
        metric.min_value = metric.min_value.min(value);
        metric.max_value = metric.max_value.max(value);
        metric.data_points.push(data_point);

        // 限制数据点数量
        while metric.data_points.len() > self.config.max_data_points {
            metric.data_points.remove(0);
        }

        // 重新计算平均值
        if !metric.data_points.is_empty() {
            let sum: f64 = metric.data_points.iter().map(|dp| dp.value).sum();
            metric.avg_value = sum / metric.data_points.len() as f64;
        }
    }

    /// 批量记录指标
    pub fn record_batch(&mut self, metrics: Vec<(&str, MetricType, f64, &str)>) {
        for (name, metric_type, value, unit) in metrics {
            self.record(name, metric_type, value, unit);
        }
    }

    /// 获取指标
    pub fn get_metric(&self, name: &str) -> Option<&SlaMetric> {
        self.metrics.get(name)
    }

    /// 获取所有指标
    pub fn get_all_metrics(&self) -> Vec<&SlaMetric> {
        self.metrics.values().collect()
    }

    /// 获取指定时间范围的指标
    pub fn get_metric_in_range(&self, name: &str, start: DateTime<Utc>, end: DateTime<Utc>) -> Option<Vec<&MetricDataPoint>> {
        let metric = self.metrics.get(name)?;
        let filtered: Vec<&MetricDataPoint> = metric.data_points.iter()
            .filter(|dp| dp.timestamp >= start && dp.timestamp <= end)
            .collect();
        Some(filtered)
    }

    /// 获取最近 N 个数据点
    pub fn get_recent_data_points(&self, name: &str, count: usize) -> Option<Vec<MetricDataPoint>> {
        let metric = self.metrics.get(name)?;
        let start = metric.data_points.len().saturating_sub(count);
        Some(metric.data_points[start..].to_vec())
    }

    /// 计算聚合值
    pub fn calculate_aggregate(&self, name: &str, aggregate_type: AggregateType) -> Option<f64> {
        let metric = self.metrics.get(name)?;
        
        match aggregate_type {
            AggregateType::Sum => Some(metric.data_points.iter().map(|dp| dp.value).sum()),
            AggregateType::Avg => Some(metric.avg_value),
            AggregateType::Min => Some(metric.min_value),
            AggregateType::Max => Some(metric.max_value),
            AggregateType::Count => Some(metric.data_points.len() as f64),
            AggregateType::P50 => self.percentile(&metric.data_points, 50.0),
            AggregateType::P95 => self.percentile(&metric.data_points, 95.0),
            AggregateType::P99 => self.percentile(&metric.data_points, 99.0),
        }
    }

    /// 计算百分位数
    fn percentile(&self, data_points: &[MetricDataPoint], percentile: f64) -> Option<f64> {
        if data_points.is_empty() {
            return None;
        }
        let mut values: Vec<f64> = data_points.iter().map(|dp| dp.value).collect();
        values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let index = ((percentile / 100.0) * (values.len() - 1) as f64).round() as usize;
        Some(values[index.min(values.len() - 1)])
    }

    /// 获取指标统计
    pub fn get_statistics(&self, name: &str) -> Option<MetricStatistics> {
        let metric = self.metrics.get(name)?;
        
        Some(MetricStatistics {
            metric_name: name.to_string(),
            current_value: metric.current_value,
            min_value: metric.min_value,
            max_value: metric.max_value,
            avg_value: metric.avg_value,
            data_point_count: metric.data_points.len(),
            p50: self.percentile(&metric.data_points, 50.0),
            p95: self.percentile(&metric.data_points, 95.0),
            p99: self.percentile(&metric.data_points, 99.0),
        })
    }

    /// 清理过期数据
    pub fn cleanup(&mut self, threshold_hours: u64) {
        let threshold = Utc::now() - Duration::hours(threshold_hours as i64);
        
        for metric in self.metrics.values_mut() {
            metric.data_points.retain(|dp| dp.timestamp > threshold);
            if let Some(raw_queue) = self.raw_data.get_mut(&metric.name) {
                raw_queue.retain(|dp| dp.timestamp > threshold);
            }
        }
    }

    /// 重置指标
    pub fn reset(&mut self, name: &str) {
        self.metrics.remove(name);
        self.raw_data.remove(name);
    }

    /// 重置所有指标
    pub fn reset_all(&mut self) {
        self.metrics.clear();
        self.raw_data.clear();
    }

    /// 获取配置
    pub fn get_config(&self) -> &MetricsCollectorConfig {
        &self.config
    }

    /// 更新配置
    pub fn set_config(&mut self, config: MetricsCollectorConfig) {
        self.config = config;
    }
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new()
    }
}

/// 聚合类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AggregateType {
    Sum,
    Avg,
    Min,
    Max,
    Count,
    P50,
    P95,
    P99,
}

/// 指标统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricStatistics {
    /// 指标名称
    pub metric_name: String,
    /// 当前值
    pub current_value: f64,
    /// 最小值
    pub min_value: f64,
    /// 最大值
    pub max_value: f64,
    /// 平均值
    pub avg_value: f64,
    /// 数据点数量
    pub data_point_count: usize,
    /// P50
    pub p50: Option<f64>,
    /// P95
    pub p95: Option<f64>,
    /// P99
    pub p99: Option<f64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_metric() {
        let mut collector = MetricsCollector::new();
        
        collector.record("test_metric", MetricType::ResponseTime, 100.0, "ms");
        
        let metric = collector.get_metric("test_metric").unwrap();
        assert_eq!(metric.current_value, 100.0);
        assert_eq!(metric.min_value, 100.0);
        assert_eq!(metric.max_value, 100.0);
    }

    #[test]
    fn test_aggregate() {
        let mut collector = MetricsCollector::new();
        
        collector.record("test_metric", MetricType::ResponseTime, 100.0, "ms");
        collector.record("test_metric", MetricType::ResponseTime, 200.0, "ms");
        collector.record("test_metric", MetricType::ResponseTime, 300.0, "ms");
        
        assert_eq!(collector.calculate_aggregate("test_metric", AggregateType::Avg), Some(200.0));
        assert_eq!(collector.calculate_aggregate("test_metric", AggregateType::Min), Some(100.0));
        assert_eq!(collector.calculate_aggregate("test_metric", AggregateType::Max), Some(300.0));
    }

    #[test]
    fn test_percentile() {
        let mut collector = MetricsCollector::new();
        
        for i in 1..=100 {
            collector.record("test_metric", MetricType::ResponseTime, i as f64, "ms");
        }
        
        assert_eq!(collector.calculate_aggregate("test_metric", AggregateType::P50), Some(50.0));
        assert_eq!(collector.calculate_aggregate("test_metric", AggregateType::P95), Some(95.0));
        assert_eq!(collector.calculate_aggregate("test_metric", AggregateType::P99), Some(99.0));
    }
}
