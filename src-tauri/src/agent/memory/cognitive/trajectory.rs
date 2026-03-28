//! Thought trajectory tracking for memory.

use serde::{Deserialize, Serialize};

/// A single thought step in a trajectory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThoughtStep {
    /// Step ID
    pub id: String,
    /// Parent step ID (None for root)
    pub parent_id: Option<String>,
    /// Thought content
    pub content: String,
    /// Domain at this step
    pub domain: String,
    /// Timestamp
    pub timestamp: i64,
    /// Access count for this thought
    pub access_count: i64,
    /// Related memory IDs
    pub related_memories: Vec<String>,
}

/// Thought trajectory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThoughtTrajectory {
    /// Trajectory ID
    pub id: String,
    /// User ID
    pub user_id: String,
    /// All steps in the trajectory
    pub steps: Vec<ThoughtStep>,
    /// Created at
    pub created_at: i64,
    /// Updated at
    pub updated_at: i64,
}

impl ThoughtTrajectory {
    pub fn new(id: String, user_id: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id,
            user_id,
            steps: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }

    /// Add a step to the trajectory
    pub fn add_step(&mut self, step: ThoughtStep) {
        self.steps.push(step);
        self.updated_at = chrono::Utc::now().timestamp();
    }

    /// Get the current step (latest)
    pub fn current_step(&self) -> Option<&ThoughtStep> {
        self.steps.last()
    }

    /// Get steps in a domain
    pub fn steps_in_domain(&self, domain: &str) -> Vec<&ThoughtStep> {
        self.steps.iter().filter(|s| s.domain == domain).collect()
    }

    /// Calculate domain distribution
    pub fn domain_distribution(&self) -> std::collections::HashMap<String, f64> {
        let total = self.steps.len() as f64;
        if total == 0.0 {
            return std::collections::HashMap::new();
        }

        let mut counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
        for step in &self.steps {
            *counts.entry(step.domain.clone()).or_insert(0) += 1;
        }

        counts
            .into_iter()
            .map(|(domain, count)| (domain, count as f64 / total))
            .collect()
    }
}

/// Thought trajectory tracker
pub struct TrajectoryTracker {
    trajectories: std::collections::HashMap<String, ThoughtTrajectory>,
}

impl TrajectoryTracker {
    pub fn new() -> Self {
        Self {
            trajectories: std::collections::HashMap::new(),
        }
    }

    /// Create or get a trajectory for a user
    pub fn get_or_create_trajectory(&mut self, user_id: &str) -> &mut ThoughtTrajectory {
        self.trajectories
            .entry(user_id.to_string())
            .or_insert_with(|| ThoughtTrajectory::new(
                uuid::Uuid::new_v4().to_string(),
                user_id.to_string(),
            ))
    }

    /// Record a thought
    pub fn record_thought(
        &mut self,
        user_id: &str,
        content: &str,
        domain: &str,
        related_memories: Vec<String>,
    ) {
        let trajectory = self.get_or_create_trajectory(user_id);

        let step = ThoughtStep {
            id: uuid::Uuid::new_v4().to_string(),
            parent_id: trajectory.current_step().map(|s| s.id.clone()),
            content: content.to_string(),
            domain: domain.to_string(),
            timestamp: chrono::Utc::now().timestamp(),
            access_count: 0,
            related_memories,
        };

        trajectory.add_step(step);
    }

    /// Get trajectory for a user
    pub fn get_trajectory(&self, user_id: &str) -> Option<&ThoughtTrajectory> {
        self.trajectories.get(user_id)
    }

    /// Calculate switching cost between domains
    pub fn calculate_switching_cost(&self, user_id: &str, from_domain: &str, to_domain: &str) -> f64 {
        if let Some(trajectory) = self.get_trajectory(user_id) {
            let recent_steps: Vec<_> = trajectory.steps.iter().rev().take(10).collect();

            // Check if we switched recently
            for (i, step) in recent_steps.iter().enumerate() {
                if step.domain == from_domain {
                    // Found from_domain, check if we switched to different domain before
                    for j in (i + 1..recent_steps.len()).rev() {
                        if recent_steps[j].domain != from_domain {
                            // Recent switch detected, lower cost
                            return 0.3;
                        }
                    }
                    // No recent switch, medium cost
                    return 0.7;
                }
            }
        }
        // No trajectory or no recent activity, high cost
        1.0
    }
}

impl Default for TrajectoryTracker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trajectory_creation() {
        let mut tracker = TrajectoryTracker::new();
        tracker.record_thought("user-1", "Analyzing Q4 report", "finance", vec![]);
        tracker.record_thought("user-1", "Reviewing Q4 report", "finance", vec![]);

        let trajectory = tracker.get_trajectory("user-1").unwrap();
        assert_eq!(trajectory.steps.len(), 2);
        assert_eq!(trajectory.current_step().unwrap().domain, "finance");
    }

    #[test]
    fn test_domain_distribution() {
        let mut tracker = TrajectoryTracker::new();
        tracker.record_thought("user-1", "Step 1", "finance", vec![]);
        tracker.record_thought("user-1", "Step 2", "finance", vec![]);
        tracker.record_thought("user-1", "Step 3", "hr", vec![]);

        let trajectory = tracker.get_trajectory("user-1").unwrap();
        let dist = trajectory.domain_distribution();

        assert_eq!(dist.get("finance").copied(), Some(2.0 / 3.0));
        assert_eq!(dist.get("hr").copied(), Some(1.0 / 3.0));
    }
}
