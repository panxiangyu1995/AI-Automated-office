//! Domain switching cost calculation.

use serde::{Deserialize, Serialize};

/// Switching cost between domains
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwitchingCost {
    pub from_domain: String,
    pub to_domain: String,
    pub cost: f64,
    pub reason: String,
}

/// Switching cost calculator
pub struct SwitchingCostCalculator {
    /// Base cost matrix (domain -> domain -> cost)
    base_costs: std::collections::HashMap<(String, String), f64>,
    /// Domain hierarchy (parent -> children)
    hierarchy: std::collections::HashMap<String, Vec<String>>,
}

impl SwitchingCostCalculator {
    pub fn new() -> Self {
        let mut calculator = Self {
            base_costs: std::collections::HashMap::new(),
            hierarchy: std::collections::HashMap::new(),
        };

        // Set up default hierarchy
        // finance -> reporting, accounting, planning
        calculator.hierarchy.insert(
            "finance".to_string(),
            vec!["reporting".to_string(), "accounting".to_string(), "planning".to_string()],
        );
        // hr -> recruiting, onboarding, payroll
        calculator.hierarchy.insert(
            "hr".to_string(),
            vec!["recruiting".to_string(), "onboarding".to_string(), "payroll".to_string()],
        );
        // sales -> crm, proposals, pipeline
        calculator.hierarchy.insert(
            "sales".to_string(),
            vec!["crm".to_string(), "proposals".to_string(), "pipeline".to_string()],
        );

        // Same domain costs are low
        calculator.set_base_cost("finance", "finance", 0.1);
        calculator.set_base_cost("hr", "hr", 0.1);
        calculator.set_base_cost("sales", "sales", 0.1);

        // Related domains have medium cost
        calculator.set_base_cost("finance", "hr", 0.5);
        calculator.set_base_cost("hr", "finance", 0.5);
        calculator.set_base_cost("sales", "finance", 0.6);
        calculator.set_base_cost("finance", "sales", 0.6);

        // Unrelated domains have high cost
        calculator.set_base_cost("sales", "hr", 0.8);
        calculator.set_base_cost("hr", "sales", 0.8);

        calculator
    }

    /// Set base switching cost between domains
    pub fn set_base_cost(&mut self, from: &str, to: &str, cost: f64) {
        self.base_costs
            .insert((from.to_string(), to.to_string()), cost);
    }

    /// Calculate switching cost
    pub fn calculate(&self, from_domain: &str, to_domain: &str) -> SwitchingCost {
        let cost = self.get_cost(from_domain, to_domain);

        let reason = if from_domain == to_domain {
            "Same domain, minimal cost".to_string()
        } else if self.are_related(from_domain, to_domain) {
            format!("{} and {} are related domains", from_domain, to_domain)
        } else {
            format!("{} and {} are unrelated domains", from_domain, to_domain)
        };

        SwitchingCost {
            from_domain: from_domain.to_string(),
            to_domain: to_domain.to_string(),
            cost,
            reason,
        }
    }

    /// Get cost between two domains
    fn get_cost(&self, from: &str, to: &str) -> f64 {
        // Direct cost
        if let Some(&cost) = self.base_costs.get(&(from.to_string(), to.to_string())) {
            return cost;
        }

        // Check parent relationships
        for (parent, children) in &self.hierarchy {
            if children.contains(&from.to_string()) && children.contains(&to.to_string()) {
                // Both are children of same parent
                return 0.3;
            }
            if parent == from && children.contains(&to.to_string()) {
                // Switching to child
                return 0.2;
            }
            if parent == to && children.contains(&from.to_string()) {
                // Switching from child to parent
                return 0.2;
            }
        }

        // Default high cost
        1.0
    }

    /// Check if two domains are related
    fn are_related(&self, domain1: &str, domain2: &str) -> bool {
        for children in self.hierarchy.values() {
            if children.contains(&domain1.to_string()) && children.contains(&domain2.to_string()) {
                return true;
            }
        }
        false
    }

    /// Get all domains in hierarchy
    pub fn get_all_domains(&self) -> Vec<String> {
        let mut domains: std::collections::HashSet<String> = std::collections::HashSet::new();

        for (parent, children) in &self.hierarchy {
            domains.insert(parent.clone());
            for child in children {
                domains.insert(child.clone());
            }
        }

        domains.into_iter().collect()
    }

    /// Add domain to hierarchy
    pub fn add_domain(&mut self, domain: &str, parent: Option<&str>) {
        if let Some(parent) = parent {
            self.hierarchy
                .entry(parent.to_string())
                .or_insert_with(Vec::new)
                .push(domain.to_string());
        }
    }
}

impl Default for SwitchingCostCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_same_domain_cost() {
        let calculator = SwitchingCostCalculator::new();
        let cost = calculator.calculate("finance", "finance");
        assert_eq!(cost.cost, 0.1);
    }

    #[test]
    fn test_unrelated_domain_cost() {
        let calculator = SwitchingCostCalculator::new();
        let cost = calculator.calculate("sales", "hr");
        assert_eq!(cost.cost, 0.8);
    }

    #[test]
    fn test_related_domain_cost() {
        let calculator = SwitchingCostCalculator::new();
        // Both finance-related
        let cost = calculator.calculate("finance", "hr");
        assert_eq!(cost.cost, 0.5);
    }
}
