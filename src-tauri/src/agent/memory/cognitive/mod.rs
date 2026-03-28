//! Cognitive layer for memory state and trajectory tracking.

pub mod state;
pub mod trajectory;
pub mod switching;

pub use state::{CognitiveState, CognitiveStateManager, ContextItem, DomainStats};
pub use trajectory::{ThoughtStep, ThoughtTrajectory, TrajectoryTracker};
pub use switching::{SwitchingCost, SwitchingCostCalculator};
