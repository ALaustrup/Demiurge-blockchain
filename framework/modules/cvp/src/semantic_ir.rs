//! Semantic Intermediate Representation (SIR)
//!
//! The SIR captures the **meaning** of contract logic independent of its
//! bytecode representation. This enables:
//!
//! 1. Multiple valid bytecode implementations of the same logic
//! 2. Formal verification of semantic preservation
//! 3. ZK proof of equivalence between variants

use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// Unique identifier for a contract
pub type ContractId = [u8; 32];

/// Function selector (first 4 bytes of keccak256 hash)
pub type FunctionSelector = [u8; 4];

/// The Semantic Intermediate Representation of a contract
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct SemanticIR {
    /// Contract identifier (hash of original bytecode)
    pub id: ContractId,
    
    /// Version of the semantic IR schema
    pub schema_version: u32,
    
    /// Version counter for this contract's mutations
    pub mutation_version: u64,
    
    /// Human-readable contract name
    pub name: String,
    
    /// All functions in the contract
    pub functions: Vec<SemanticFunction>,
    
    /// Global state schema
    pub state_schema: StateSchema,
    
    /// Invariants that must hold across all mutations
    pub invariants: Vec<Invariant>,
    
    /// External calls and their constraints
    pub external_calls: Vec<ExternalCallSpec>,
}

impl SemanticIR {
    /// Create a new empty Semantic IR
    pub fn new(id: ContractId, name: String) -> Self {
        Self {
            id,
            schema_version: 1,
            mutation_version: 0,
            name,
            functions: Vec::new(),
            state_schema: StateSchema::default(),
            invariants: Vec::new(),
            external_calls: Vec::new(),
        }
    }
    
    /// Add a function to the IR
    pub fn add_function(&mut self, function: SemanticFunction) {
        self.functions.push(function);
    }
    
    /// Add an invariant
    pub fn add_invariant(&mut self, invariant: Invariant) {
        self.invariants.push(invariant);
    }
    
    /// Compute a hash commitment to this IR
    pub fn commitment(&self) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = self.encode();
        let mut hasher = Blake2b512::new();
        hasher.update(&encoded);
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
    
    /// Increment mutation version
    pub fn increment_version(&mut self) {
        self.mutation_version += 1;
    }
}

/// A function's semantic definition
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct SemanticFunction {
    /// Function selector (4 bytes)
    pub selector: FunctionSelector,
    
    /// Human-readable name
    pub name: String,
    
    /// Input parameters with types
    pub inputs: Vec<TypedParameter>,
    
    /// Output parameters with types
    pub outputs: Vec<TypedParameter>,
    
    /// The semantic effects (what happens)
    pub effects: Vec<Effect>,
    
    /// Pre-conditions that must be true before execution
    pub preconditions: Vec<Condition>,
    
    /// Post-conditions that must be true after execution
    pub postconditions: Vec<Condition>,
    
    /// Resource bounds (gas, storage operations)
    pub resource_bounds: ResourceBounds,
    
    /// Whether this function can modify state
    pub mutability: Mutability,
    
    /// Visibility level
    pub visibility: Visibility,
}

impl SemanticFunction {
    /// Create a new function definition
    pub fn new(selector: FunctionSelector, name: String) -> Self {
        Self {
            selector,
            name,
            inputs: Vec::new(),
            outputs: Vec::new(),
            effects: Vec::new(),
            preconditions: Vec::new(),
            postconditions: Vec::new(),
            resource_bounds: ResourceBounds::default(),
            mutability: Mutability::Mutable,
            visibility: Visibility::Public,
        }
    }
    
    /// Add an input parameter
    pub fn with_input(mut self, name: &str, typ: Type) -> Self {
        self.inputs.push(TypedParameter {
            name: name.to_string(),
            typ,
        });
        self
    }
    
    /// Add an output parameter
    pub fn with_output(mut self, name: &str, typ: Type) -> Self {
        self.outputs.push(TypedParameter {
            name: name.to_string(),
            typ,
        });
        self
    }
    
    /// Add an effect
    pub fn with_effect(mut self, effect: Effect) -> Self {
        self.effects.push(effect);
        self
    }
    
    /// Add a precondition
    pub fn with_precondition(mut self, condition: Condition) -> Self {
        self.preconditions.push(condition);
        self
    }
    
    /// Add a postcondition
    pub fn with_postcondition(mut self, condition: Condition) -> Self {
        self.postconditions.push(condition);
        self
    }
}

/// Typed parameter (input or output)
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct TypedParameter {
    pub name: String,
    pub typ: Type,
}

/// Supported types in the IR
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum Type {
    /// Boolean
    Bool,
    /// Unsigned integers
    Uint8,
    Uint16,
    Uint32,
    Uint64,
    Uint128,
    Uint256,
    /// Signed integers
    Int8,
    Int16,
    Int32,
    Int64,
    Int128,
    Int256,
    /// Address (32 bytes)
    Address,
    /// Fixed-size bytes
    Bytes(u32),
    /// Dynamic bytes
    DynamicBytes,
    /// String
    String,
    /// Array of type
    Array(Box<Type>),
    /// Fixed-size array
    FixedArray(Box<Type>, u32),
    /// Mapping
    Mapping(Box<Type>, Box<Type>),
    /// Struct (named fields)
    Struct(Vec<(String, Type)>),
    /// Tuple (unnamed fields)
    Tuple(Vec<Type>),
}

/// An effect represents a state change or action
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub enum Effect {
    /// Modify a storage slot
    StorageWrite {
        slot: StorageSlot,
        value: Expression,
    },
    
    /// Transfer tokens/value
    Transfer {
        from: Expression,
        to: Expression,
        amount: Expression,
    },
    
    /// Emit an event
    Emit {
        event_id: u32,
        data: Vec<Expression>,
    },
    
    /// External call to another contract
    ExternalCall {
        target: Expression,
        selector: FunctionSelector,
        args: Vec<Expression>,
        value: Option<Expression>,
    },
    
    /// Conditional effect
    Conditional {
        condition: Condition,
        then_effects: Vec<Effect>,
        else_effects: Vec<Effect>,
    },
    
    /// Bounded loop
    Loop {
        iterations: BoundedRange,
        index_var: String,
        body: Vec<Effect>,
    },
    
    /// Revert transaction
    Revert {
        message: String,
    },
    
    /// Assert condition (revert if false)
    Assert {
        condition: Condition,
        message: String,
    },
    
    /// Return value(s)
    Return {
        values: Vec<Expression>,
    },
}

/// Storage slot reference
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub enum StorageSlot {
    /// Fixed slot index
    Fixed(u64),
    
    /// Dynamic slot based on expression
    Dynamic(Box<Expression>),
    
    /// Mapping access
    Mapping {
        base_slot: u64,
        key: Box<Expression>,
    },
    
    /// Array access
    Array {
        base_slot: u64,
        index: Box<Expression>,
    },
    
    /// Named slot (resolved during compilation)
    Named(String),
}

/// Expression in the IR
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub enum Expression {
    /// Constant value
    Constant(ConstantValue),
    
    /// Reference to parameter by name
    Param(String),
    
    /// Reference to local variable
    Local(String),
    
    /// Storage read
    StorageRead(StorageSlot),
    
    /// Message sender
    Caller,
    
    /// Message value
    CallValue,
    
    /// Current block number
    BlockNumber,
    
    /// Current timestamp
    Timestamp,
    
    /// Contract's own address
    SelfAddress,
    
    /// Binary operation
    BinaryOp {
        op: BinaryOperator,
        left: Box<Expression>,
        right: Box<Expression>,
    },
    
    /// Unary operation
    UnaryOp {
        op: UnaryOperator,
        operand: Box<Expression>,
    },
    
    /// Conditional expression
    Ternary {
        condition: Box<Condition>,
        then_expr: Box<Expression>,
        else_expr: Box<Expression>,
    },
    
    /// Function call result
    FunctionResult {
        function: FunctionSelector,
        args: Vec<Expression>,
    },
    
    /// Hash of data
    Hash {
        algorithm: HashAlgorithm,
        data: Box<Expression>,
    },
}

/// Constant values
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub enum ConstantValue {
    Bool(bool),
    Uint(u128),
    Int(i128),
    Bytes(Vec<u8>),
    String(String),
    Address([u8; 32]),
}

/// Binary operators
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum BinaryOperator {
    // Arithmetic
    Add,
    Sub,
    Mul,
    Div,
    Mod,
    Pow,
    
    // Bitwise
    And,
    Or,
    Xor,
    Shl,
    Shr,
    
    // Comparison
    Eq,
    Ne,
    Lt,
    Le,
    Gt,
    Ge,
    
    // Logical
    LogicalAnd,
    LogicalOr,
}

/// Unary operators
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum UnaryOperator {
    Not,
    Neg,
    BitwiseNot,
}

/// Hash algorithms
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum HashAlgorithm {
    Keccak256,
    Blake2b,
    Sha256,
}

/// Condition (boolean expression)
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub enum Condition {
    /// Literal true/false
    Literal(bool),
    
    /// Compare two expressions
    Compare {
        op: CompareOperator,
        left: Expression,
        right: Expression,
    },
    
    /// Logical AND
    And(Box<Condition>, Box<Condition>),
    
    /// Logical OR
    Or(Box<Condition>, Box<Condition>),
    
    /// Logical NOT
    Not(Box<Condition>),
    
    /// Expression is non-zero
    IsNonZero(Expression),
    
    /// Expression is zero
    IsZero(Expression),
}

/// Comparison operators
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum CompareOperator {
    Equal,
    NotEqual,
    LessThan,
    LessOrEqual,
    GreaterThan,
    GreaterOrEqual,
}

/// Bounded range for loops
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct BoundedRange {
    pub min: u64,
    pub max: u64,
}

impl BoundedRange {
    pub fn new(min: u64, max: u64) -> Self {
        Self { min, max }
    }
    
    pub fn exact(n: u64) -> Self {
        Self { min: n, max: n }
    }
}

/// Resource bounds for gas/storage
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct ResourceBounds {
    /// Maximum gas/energy this function can consume
    pub max_gas: u64,
    
    /// Maximum storage write operations
    pub max_storage_writes: u32,
    
    /// Maximum storage read operations
    pub max_storage_reads: u32,
    
    /// Maximum external calls
    pub max_external_calls: u32,
    
    /// Maximum loop iterations (sum of all loops)
    pub max_loop_iterations: u64,
}

impl Default for ResourceBounds {
    fn default() -> Self {
        Self {
            max_gas: 1_000_000,
            max_storage_writes: 10,
            max_storage_reads: 50,
            max_external_calls: 5,
            max_loop_iterations: 1000,
        }
    }
}

/// Function mutability
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum Mutability {
    /// Can read and write state
    Mutable,
    /// Can only read state
    View,
    /// Cannot access state
    Pure,
}

/// Function visibility
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum Visibility {
    /// Callable by anyone
    Public,
    /// Callable only by this contract
    Private,
    /// Callable by this contract and derived contracts
    Internal,
    /// Callable only externally
    External,
}

/// State schema definition
#[derive(Debug, Clone, Default, Encode, Decode, Serialize, Deserialize)]
pub struct StateSchema {
    /// Named storage slots
    pub slots: Vec<StateSlot>,
    
    /// Total storage size in slots
    pub total_slots: u64,
}

/// A named storage slot
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct StateSlot {
    pub name: String,
    pub slot: u64,
    pub typ: Type,
}

/// Invariant that must hold
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct Invariant {
    /// Invariant name for debugging
    pub name: String,
    
    /// Human-readable description
    pub description: String,
    
    /// The condition that must always be true
    pub condition: Condition,
    
    /// When this invariant is checked
    pub check_point: CheckPoint,
    
    /// Severity if violated
    pub severity: InvariantSeverity,
}

/// When to check an invariant
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum CheckPoint {
    /// Before any function execution
    PreExecution,
    /// After any function execution
    PostExecution,
    /// Before and after
    Both,
    /// Only for specific functions
    Functions,
}

/// Severity of invariant violation
#[derive(Debug, Clone, Copy, Encode, Decode, Serialize, Deserialize, PartialEq)]
pub enum InvariantSeverity {
    /// Log warning but continue
    Warning,
    /// Revert transaction
    Error,
    /// Trigger emergency mutation
    Critical,
}

/// External call specification
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct ExternalCallSpec {
    /// Target contract (if known)
    pub target: Option<ContractId>,
    
    /// Function being called
    pub function: FunctionSelector,
    
    /// Maximum value that can be sent
    pub max_value: Option<u128>,
    
    /// Whether re-entrancy is allowed
    pub allows_reentrancy: bool,
    
    /// Required return type
    pub return_type: Option<Type>,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_semantic_ir_creation() {
        let id = [0u8; 32];
        let ir = SemanticIR::new(id, "TestContract".to_string());
        
        assert_eq!(ir.name, "TestContract");
        assert_eq!(ir.schema_version, 1);
        assert_eq!(ir.mutation_version, 0);
    }
    
    #[test]
    fn test_function_builder() {
        let func = SemanticFunction::new([0xa9, 0x05, 0x9c, 0xbb], "transfer".to_string())
            .with_input("to", Type::Address)
            .with_input("amount", Type::Uint256)
            .with_output("success", Type::Bool)
            .with_precondition(Condition::IsNonZero(Expression::Param("to".to_string())));
        
        assert_eq!(func.inputs.len(), 2);
        assert_eq!(func.outputs.len(), 1);
        assert_eq!(func.preconditions.len(), 1);
    }
    
    #[test]
    fn test_ir_commitment() {
        let id = [1u8; 32];
        let mut ir = SemanticIR::new(id, "Test".to_string());
        let commit1 = ir.commitment();
        
        ir.add_function(SemanticFunction::new([0, 0, 0, 1], "func".to_string()));
        let commit2 = ir.commitment();
        
        // Commitment should change when IR changes
        assert_ne!(commit1, commit2);
    }
}
