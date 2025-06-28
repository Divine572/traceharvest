// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IShellfishTraceability {
    function getBatch(uint256 batchId) external view returns (
        uint256 id,
        string memory batchNumber,
        address harvester,
        string memory species,
        uint256 quantity,
        string memory harvestLocation,
        uint256 harvestDate,
        uint8 status,
        bool exists
    );
}

contract BatchNFT is ERC721, ERC721URIStorage, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    IShellfishTraceability public traceabilityContract;
    
    // Mapping from batch ID to token ID
    mapping(uint256 => uint256) public batchToToken;
    mapping(uint256 => uint256) public tokenToBatch;
    mapping(uint256 => string) private _tokenQRData;
    
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    
    event BatchTokenMinted(
        uint256 indexed tokenId,
        uint256 indexed batchId,
        address indexed to,
        string qrData
    );
    
    event QRDataUpdated(
        uint256 indexed tokenId,
        string newQRData
    );

    constructor(
        address _traceabilityContract,
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        traceabilityContract = IShellfishTraceability(_traceabilityContract);
        _baseTokenURI = _baseURI;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        _tokenIdCounter = 1;
    }

    // Mint NFT for a batch
    function mintBatchToken(
        uint256 batchId,
        address to,
        string memory qrData
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(batchToToken[batchId] == 0, "Token already exists for this batch");
        
        // Verify batch exists in traceability contract
        (, , , , , , , , bool exists) = traceabilityContract.getBatch(batchId);
        require(exists, "Batch does not exist in traceability contract");
        
        uint256 tokenId = _tokenIdCounter++;
        
        batchToToken[batchId] = tokenId;
        tokenToBatch[tokenId] = batchId;
        _tokenQRData[tokenId] = qrData;
        
        _safeMint(to, tokenId);
        
        // Generate metadata URI
        string memory metadataURI = _generateTokenURI(tokenId, batchId);
        _setTokenURI(tokenId, metadataURI);
        
        emit BatchTokenMinted(tokenId, batchId, to, qrData);
        
        return tokenId;
    }

    // Update QR data for a token
    function updateQRData(
        uint256 tokenId,
        string memory newQRData
    ) external onlyRole(MINTER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        _tokenQRData[tokenId] = newQRData;
        
        // Update token URI with new data
        uint256 batchId = tokenToBatch[tokenId];
        string memory updatedURI = _generateTokenURI(tokenId, batchId);
        _setTokenURI(tokenId, updatedURI);
        
        emit QRDataUpdated(tokenId, newQRData);
    }

    // Generate token metadata URI
    function _generateTokenURI(
        uint256 tokenId,
        uint256 batchId
    ) internal view returns (string memory) {
        // Get batch data from traceability contract
        (
            ,
            string memory batchNumber,
            address harvester,
            string memory species,
            uint256 quantity,
            string memory harvestLocation,
            uint256 harvestDate,
            uint8 status,
        ) = traceabilityContract.getBatch(batchId);
        
        // Split JSON creation to avoid stack too deep
        string memory basicInfo = _createBasicInfo(batchNumber, species, harvestLocation, tokenId);
        string memory attributes = _createAttributes(species, quantity, harvestLocation, harvestDate, status, harvester, tokenId);
        
        string memory json = string(abi.encodePacked(basicInfo, attributes, "}"));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(bytes(json))
        ));
    }

    function _createBasicInfo(
        string memory batchNumber,
        string memory species,
        string memory harvestLocation,
        uint256 tokenId
    ) internal view returns (string memory) {
        return string(abi.encodePacked(
            '{"name":"TraceHarvest Batch #',
            batchNumber,
            '","description":"Shellfish batch traceability token for ',
            species,
            ' harvested from ',
            harvestLocation,
            '","image":"',
            _baseTokenURI,
            'batch/',
            Strings.toString(tokenId),
            '.png","attributes":['
        ));
    }

    function _createAttributes(
        string memory species,
        uint256 quantity,
        string memory harvestLocation,
        uint256 harvestDate,
        uint8 status,
        address harvester,
        uint256 tokenId
    ) internal view returns (string memory) {
        string memory part1 = string(abi.encodePacked(
            '{"trait_type":"Species","value":"',
            species,
            '"},{"trait_type":"Quantity","value":"',
            Strings.toString(quantity),
            '"},{"trait_type":"Harvest Location","value":"',
            harvestLocation,
            '"}'
        ));
        
        string memory part2 = string(abi.encodePacked(
            ',{"trait_type":"Harvest Date","value":"',
            Strings.toString(harvestDate),
            '"},{"trait_type":"Status","value":"',
            Strings.toString(status),
            '"},{"trait_type":"Harvester","value":"',
            Strings.toHexString(uint256(uint160(harvester)), 20),
            '"}'
        ));
        
        string memory part3 = string(abi.encodePacked(
            ',{"trait_type":"QR Data","value":"',
            _tokenQRData[tokenId],
            '"}]'
        ));
        
        return string(abi.encodePacked(part1, part2, part3));
    }

    // Base64 encoding function
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        string memory result = new string(4 * ((data.length + 2) / 3));
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let dataPtr := data
                let endPtr := add(dataPtr, mload(data))
            } lt(dataPtr, endPtr) {
            
            } {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 2), 0x3d)
                mstore8(sub(resultPtr, 1), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }
        
        return result;
    }

    // View functions
    function getQRData(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenQRData[tokenId];
    }

    function getBatchIdFromToken(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenToBatch[tokenId];
    }

    function getTokenFromBatch(uint256 batchId) external view returns (uint256) {
        return batchToToken[batchId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    // Admin functions
    function setTraceabilityContract(address _traceabilityContract) external onlyRole(ADMIN_ROLE) {
        traceabilityContract = IShellfishTraceability(_traceabilityContract);
    }

    function setBaseURI(string memory _baseURI) external onlyRole(ADMIN_ROLE) {
        _baseTokenURI = _baseURI;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Override functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}