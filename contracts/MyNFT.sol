// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private allArts;

    address public owner;

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        owner = msg.sender;
    }

struct Art {  
  uint tokenId;
  uint price;
  address seller;
  bool forSale;
}

mapping(uint256 => Art) public arts;

modifier onlyArtOwner(uint _Id) {
        require(msg.sender == arts[_Id].seller);
        _;
    }

    function mintArt(string memory tokenURI) public payable {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        listArt(newItemId);
    }

    function listArt(uint256 _tokenId) private {
    allArts.increment();
    arts[allArts.current()] = Art(
       _tokenId,
       0,
       payable(msg.sender), 
       false
       );
  }

  function sellArt(uint256 _Id, uint _price) external onlyArtOwner(_Id){
     Art storage art = arts[_Id];
     require(_price != 0);
     require(art.seller == msg.sender, "Only the nft owner can sell nft");
     require(art.forSale == false);
      _transfer(msg.sender, address(this), _Id);
      art.price = _price;
     art.forSale = true;
  }

  function cancelArtSale(uint _Id) external onlyArtOwner(_Id){
     Art storage art = arts[_Id];
     require(art.seller == msg.sender);
     require(art.forSale == true);
      _transfer(address(this), msg.sender, _Id);
     art.forSale = false;
  }

  function buyArt(uint _Id) external payable {
        Art storage art = arts[_Id];
        require(_Id > 0 && _Id <= allArts.current(), "item doesn't exist");
        require(msg.value >= art.price,"not enough balance for this transaction");
        require(art.forSale != false, "item is not for sell");
        require(art.seller != msg.sender, "You cannot buy your own nft art");
        payable(art.seller).transfer(art.price);
         _transfer(address(this), msg.sender, art.tokenId);
        art.seller = msg.sender;
        art.forSale = false;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

     function getArt(uint _Id) public view returns (Art memory) {
        return arts[_Id];
    }

     function getAllArts() public view returns (uint) {
        return allArts.current();
    }

}
