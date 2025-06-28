// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ShellfishTraceability is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant HARVESTER_ROLE = keccak256("HARVESTER_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Batch status enum
    enum BatchStatus {
        Harvested,
        Processing,
        Processed,
        InTransit,
        Inspected,
        Delivered
    }

    // Batch structure
    struct Batch {
        uint256 id;
        string batchNumber;
        address harvester;
        string species;
        uint256 quantity;
        string harvestLocation;
        uint256 harvestDate;
        BatchStatus status;
        bool exists;
    }

    // Trace step structure
    struct TraceStep {
        address actor;
        bytes32 role;
        uint256 timestamp;
        BatchStatus newStatus;
        string location;
        string details;
        bytes32 dataHash;
    }

    // State variables
    uint256 private _batchIdCounter;
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => TraceStep[]) public batchTraceSteps;
    mapping(string => uint256) public batchNumberToId;
    mapping(address => string) public userProfiles;

    // Events
    event BatchCreated(
        uint256 indexed batchId,
        string indexed batchNumber,
        address indexed harvester,
        string species,
        uint256 quantity
    );

    event BatchUpdated(
        uint256 indexed batchId,
        address indexed actor,
        BatchStatus newStatus,
        string location
    );

    event TraceStepAdded(
        uint256 indexed batchId,
        address indexed actor,
        bytes32 role,
        BatchStatus newStatus
    );

    event UserRegistered(address indexed user, bytes32 role, string profile);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _batchIdCounter = 1;
    }

    // Modifiers
    modifier onlyValidBatch(uint256 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }

    modifier onlyBatchActor(uint256 batchId) {
        Batch memory batch = batches[batchId];
        require(
            hasRole(HARVESTER_ROLE, msg.sender) ||
            hasRole(PROCESSOR_ROLE, msg.sender) ||
            hasRole(TRANSPORTER_ROLE, msg.sender) ||
            hasRole(INSPECTOR_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized for this batch"
        );
        _;
    }

    // User management functions
    function registerUser(
        address user,
        bytes32 role,
        string memory profile
    ) external onlyRole(ADMIN_ROLE) {
        require(
            role == HARVESTER_ROLE ||
            role == PROCESSOR_ROLE ||
            role == TRANSPORTER_ROLE ||
            role == INSPECTOR_ROLE,
            "Invalid role"
        );
        
        _grantRole(role, user);
        userProfiles[user] = profile;
        
        emit UserRegistered(user, role, profile);
    }

    // Batch creation (only harvesters)
    function createBatch(
        string memory batchNumber,
        string memory species,
        uint256 quantity,
        string memory harvestLocation,
        string memory details
    ) external onlyRole(HARVESTER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        require(bytes(batchNumber).length > 0, "Batch number required");
        require(batchNumberToId[batchNumber] == 0, "Batch number already exists");
        require(quantity > 0, "Quantity must be greater than 0");

        uint256 batchId = _batchIdCounter++;
        
        batches[batchId] = Batch({
            id: batchId,
            batchNumber: batchNumber,
            harvester: msg.sender,
            species: species,
            quantity: quantity,
            harvestLocation: harvestLocation,
            harvestDate: block.timestamp,
            status: BatchStatus.Harvested,
            exists: true
        });

        batchNumberToId[batchNumber] = batchId;

        // Add initial trace step
        _addTraceStep(
            batchId,
            msg.sender,
            HARVESTER_ROLE,
            BatchStatus.Harvested,
            harvestLocation,
            details
        );

        emit BatchCreated(batchId, batchNumber, msg.sender, species, quantity);
        
        return batchId;
    }

    // Update batch status
    function updateBatchStatus(
        uint256 batchId,
        BatchStatus newStatus,
        string memory location,
        string memory details
    ) external onlyValidBatch(batchId) onlyBatchActor(batchId) whenNotPaused {
        Batch storage batch = batches[batchId];
        
        // Validate status transition
        require(_isValidStatusTransition(batch.status, newStatus), "Invalid status transition");
        
        batch.status = newStatus;
        
        bytes32 actorRole = _getActorRole(msg.sender);
        
        _addTraceStep(batchId, msg.sender, actorRole, newStatus, location, details);
        
        emit BatchUpdated(batchId, msg.sender, newStatus, location);
    }

    // Internal function to add trace step
    function _addTraceStep(
        uint256 batchId,
        address actor,
        bytes32 role,
        BatchStatus newStatus,
        string memory location,
        string memory details
    ) internal {
        bytes32 dataHash = keccak256(abi.encodePacked(
            batchId,
            actor,
            role,
            block.timestamp,
            newStatus,
            location,
            details
        ));

        batchTraceSteps[batchId].push(TraceStep({
            actor: actor,
            role: role,
            timestamp: block.timestamp,
            newStatus: newStatus,
            location: location,
            details: details,
            dataHash: dataHash
        }));

        emit TraceStepAdded(batchId, actor, role, newStatus);
    }

    // Get actor's primary role
    function _getActorRole(address actor) internal view returns (bytes32) {
        if (hasRole(HARVESTER_ROLE, actor)) return HARVESTER_ROLE;
        if (hasRole(PROCESSOR_ROLE, actor)) return PROCESSOR_ROLE;
        if (hasRole(TRANSPORTER_ROLE, actor)) return TRANSPORTER_ROLE;
        if (hasRole(INSPECTOR_ROLE, actor)) return INSPECTOR_ROLE;
        if (hasRole(ADMIN_ROLE, actor)) return ADMIN_ROLE;
        return bytes32(0);
    }

    // Validate status transitions
    function _isValidStatusTransition(BatchStatus current, BatchStatus next) internal pure returns (bool) {
        if (current == BatchStatus.Harvested) {
            return next == BatchStatus.Processing;
        } else if (current == BatchStatus.Processing) {
            return next == BatchStatus.Processed;
        } else if (current == BatchStatus.Processed) {
            return next == BatchStatus.InTransit;
        } else if (current == BatchStatus.InTransit) {
            return next == BatchStatus.Inspected;
        } else if (current == BatchStatus.Inspected) {
            return next == BatchStatus.Delivered;
        }
        return false;
    }

    // View functions
    function getBatch(uint256 batchId) external view returns (Batch memory) {
        require(batches[batchId].exists, "Batch does not exist");
        return batches[batchId];
    }

    function getBatchByNumber(string memory batchNumber) external view returns (Batch memory) {
        uint256 batchId = batchNumberToId[batchNumber];
        require(batchId != 0, "Batch not found");
        return batches[batchId];
    }

    function getTraceSteps(uint256 batchId) external view returns (TraceStep[] memory) {
        require(batches[batchId].exists, "Batch does not exist");
        return batchTraceSteps[batchId];
    }

    function getTotalBatches() external view returns (uint256) {
        return _batchIdCounter - 1;
    }

    function getUserRole(address user) external view returns (string memory) {
        if (hasRole(HARVESTER_ROLE, user)) return "harvester";
        if (hasRole(PROCESSOR_ROLE, user)) return "processor";
        if (hasRole(TRANSPORTER_ROLE, user)) return "transporter";
        if (hasRole(INSPECTOR_ROLE, user)) return "inspector";
        if (hasRole(ADMIN_ROLE, user)) return "admin";
        return "none";
    }

    // Admin functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}