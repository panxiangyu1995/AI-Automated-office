//! Graph Memory Module (Post-MVP)
//!
//! Implements L3 graph-based memory using relationship structures.
//! This module provides:
//! - Entity nodes with properties
//! - Relationship edges between entities
//! - Graph traversal and query
//! - Path finding algorithms
//!
//! Note: This is a placeholder implementation. Full graph memory will be implemented post-MVP.

use std::collections::{HashMap, HashSet};
use serde::{Deserialize, Serialize};

/// Graph memory configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphMemoryConfig {
    /// Maximum number of nodes
    pub max_nodes: usize,
    /// Maximum number of edges
    pub max_edges: usize,
    /// Enable automatic relationship discovery
    pub auto_discover: bool,
    /// Path finding max depth
    pub max_path_depth: usize,
}

impl Default for GraphMemoryConfig {
    fn default() -> Self {
        Self {
            max_nodes: 10000,
            max_edges: 50000,
            auto_discover: false,
            max_path_depth: 5,
        }
    }
}

/// Entity in the graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEntity {
    /// Unique entity ID
    pub id: String,
    /// Entity type (person, company, project, etc.)
    pub entity_type: String,
    /// Entity name
    pub name: String,
    /// Properties (key-value pairs)
    pub properties: HashMap<String, serde_json::Value>,
    /// Creation timestamp
    pub created_at: i64,
    /// Last update timestamp
    pub updated_at: i64,
}

/// Relationship between entities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRelationship {
    /// Unique relationship ID
    pub id: String,
    /// Source entity ID
    pub source_id: String,
    /// Target entity ID
    pub target_id: String,
    /// Relationship type (works_for, knows, created_by, etc.)
    pub relationship_type: String,
    /// Relationship properties
    pub properties: HashMap<String, serde_json::Value>,
    /// Weight/confidence (0.0 - 1.0)
    pub weight: f32,
    /// Creation timestamp
    pub created_at: i64,
}

/// Graph query result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphQueryResult {
    /// Matching entities
    pub entities: Vec<GraphEntity>,
    /// Matching relationships
    pub relationships: Vec<GraphRelationship>,
    /// Path suggestions
    pub paths: Vec<GraphPath>,
}

/// A path through the graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphPath {
    /// Path nodes
    pub nodes: Vec<String>,
    /// Path edges
    pub edges: Vec<String>,
    /// Total weight
    pub total_weight: f32,
}

/// Graph memory service
pub struct GraphMemoryService {
    /// Entities by ID
    entities: HashMap<String, GraphEntity>,
    /// Relationships by ID
    relationships: HashMap<String, GraphRelationship>,
    /// Outgoing edges by entity ID
    outgoing_edges: HashMap<String, Vec<String>>,
    /// Incoming edges by entity ID
    incoming_edges: HashMap<String, Vec<String>>,
    /// Configuration
    config: GraphMemoryConfig,
}

impl GraphMemoryService {
    /// Create a new graph memory service
    pub fn new(config: GraphMemoryConfig) -> Self {
        Self {
            entities: HashMap::new(),
            relationships: HashMap::new(),
            outgoing_edges: HashMap::new(),
            incoming_edges: HashMap::new(),
            config,
        }
    }

    /// Add an entity to the graph
    pub fn add_entity(&mut self, entity: GraphEntity) -> Result<(), GraphMemoryError> {
        if self.entities.len() >= self.config.max_nodes {
            return Err(GraphMemoryError::CapacityExceeded("nodes".to_string()));
        }
        
        self.entities.insert(entity.id.clone(), entity);
        Ok(())
    }

    /// Add a relationship to the graph
    pub fn add_relationship(&mut self, rel: GraphRelationship) -> Result<(), GraphMemoryError> {
        // Verify entities exist
        if !self.entities.contains_key(&rel.source_id) {
            return Err(GraphMemoryError::EntityNotFound(rel.source_id));
        }
        if !self.entities.contains_key(&rel.target_id) {
            return Err(GraphMemoryError::EntityNotFound(rel.target_id));
        }
        
        if self.relationships.len() >= self.config.max_edges {
            return Err(GraphMemoryError::CapacityExceeded("edges".to_string()));
        }
        
        // Add relationship
        self.relationships.insert(rel.id.clone(), rel.clone());
        
        // Update edge indices
        self.outgoing_edges
            .entry(rel.source_id.clone())
            .or_default()
            .push(rel.id.clone());
        self.incoming_edges
            .entry(rel.target_id.clone())
            .or_default()
            .push(rel.id.clone());
        
        Ok(())
    }

    /// Find shortest path between two entities
    pub fn find_path(&self, source_id: &str, target_id: &str) -> Option<GraphPath> {
        if source_id == target_id {
            return Some(GraphPath {
                nodes: vec![source_id.to_string()],
                edges: vec![],
                total_weight: 0.0,
            });
        }

        // BFS for shortest path
        let mut visited = HashSet::new();
        let mut queue = vec![(source_id.to_string(), vec![source_id.to_string()], vec![], 0.0f32)];
        
        while let Some((current, nodes, edges, weight)) = queue.pop() {
            if visited.contains(&current) {
                continue;
            }
            visited.insert(current.clone());
            
            // Check outgoing edges
            if let Some(outgoing) = self.outgoing_edges.get(&current) {
                for edge_id in outgoing {
                    if let Some(rel) = self.relationships.get(edge_id) {
                        let new_weight = weight + rel.weight;
                        
                        if rel.target_id == target_id {
                            // Found path
                            let mut path_nodes = nodes.clone();
                            path_nodes.push(target_id.to_string());
                            let mut path_edges = edges.clone();
                            path_edges.push(edge_id.clone());
                            return Some(GraphPath {
                                nodes: path_nodes,
                                edges: path_edges,
                                total_weight: new_weight,
                            });
                        }
                        
                        if nodes.len() < self.config.max_path_depth {
                            let mut new_nodes = nodes.clone();
                            new_nodes.push(rel.target_id.clone());
                            let mut new_edges = edges.clone();
                            new_edges.push(edge_id.clone());
                            queue.push((rel.target_id.clone(), new_nodes, new_edges, new_weight));
                        }
                    }
                }
            }
        }
        
        None
    }

    /// Get entity by ID
    pub fn get_entity(&self, id: &str) -> Option<&GraphEntity> {
        self.entities.get(id)
    }

    /// Get relationships for an entity
    pub fn get_entity_relationships(&self, entity_id: &str) -> Vec<&GraphRelationship> {
        let mut rels = Vec::new();
        
        // Outgoing
        if let Some(outgoing) = self.outgoing_edges.get(entity_id) {
            for edge_id in outgoing {
                if let Some(rel) = self.relationships.get(edge_id) {
                    rels.push(rel);
                }
            }
        }
        
        // Incoming
        if let Some(incoming) = self.incoming_edges.get(entity_id) {
            for edge_id in incoming {
                if let Some(rel) = self.relationships.get(edge_id) {
                    rels.push(rel);
                }
            }
        }
        
        rels
    }

    /// Get graph statistics
    pub fn stats(&self) -> GraphStats {
        GraphStats {
            node_count: self.entities.len(),
            edge_count: self.relationships.len(),
            max_nodes: self.config.max_nodes,
            max_edges: self.config.max_edges,
        }
    }
}

/// Graph memory errors
#[derive(Debug, thiserror::Error)]
pub enum GraphMemoryError {
    #[error("Entity not found: {0}")]
    EntityNotFound(String),
    
    #[error("Capacity exceeded: {0}")]
    CapacityExceeded(String),
    
    #[error("Invalid operation: {0}")]
    InvalidOperation(String),
}

/// Graph statistics
#[derive(Debug, Clone, serde::Serialize)]
pub struct GraphStats {
    pub node_count: usize,
    pub edge_count: usize,
    pub max_nodes: usize,
    pub max_edges: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graph_operations() {
        let mut service = GraphMemoryService::new(GraphMemoryConfig::default());
        
        // Add entities
        service.add_entity(GraphEntity {
            id: "e1".to_string(),
            entity_type: "person".to_string(),
            name: "Alice".to_string(),
            properties: HashMap::new(),
            created_at: 0,
            updated_at: 0,
        }).unwrap();
        
        service.add_entity(GraphEntity {
            id: "e2".to_string(),
            entity_type: "company".to_string(),
            name: "Acme Corp".to_string(),
            properties: HashMap::new(),
            created_at: 0,
            updated_at: 0,
        }).unwrap();
        
        // Add relationship
        service.add_relationship(GraphRelationship {
            id: "r1".to_string(),
            source_id: "e1".to_string(),
            target_id: "e2".to_string(),
            relationship_type: "works_for".to_string(),
            properties: HashMap::new(),
            weight: 1.0,
            created_at: 0,
        }).unwrap();
        
        // Find path
        let path = service.find_path("e1", "e2");
        assert!(path.is_some());
        assert_eq!(path.unwrap().nodes, vec!["e1", "e2"]);
    }
}
