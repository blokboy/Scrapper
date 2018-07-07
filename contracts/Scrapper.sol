pragma solidity ^0.4.24;

import "./Ownable.sol";

contract Scrapper is Ownable {

  modifier onlyCurator(uint _photoID) {
    require(msg.sender == photoToCurator[_photoID]);
    _;
  }

  uint public photoIndex;

  struct Photo {
    address curator; // Who initially brought the image to Scrapper
    uint photoID;
    uint likes;
    string name;
    string category;
    string imageLink;
    string descLink;
    bool flagged;
  }

  event NewPhoto(address _curator, uint _ID, uint _likes, string _name, string _category, string _imageLink, string _descLink, bool flagged);

  mapping (address => mapping(uint => Photo)) public scrapbook;
  mapping (uint => address) public photoToCurator;

  constructor() public {
    photoIndex = 0;
  }

  function addPhoto(string _name, string _category, string _imageLink, string _descLink) payable public {
    photoIndex += 1;
    Photo memory photo = Photo(msg.sender, photoIndex, 0, _name, _category, _imageLink, _descLink, false);
    scrapbook[msg.sender][photoIndex] = photo;
    photoToCurator[photoIndex] = msg.sender;
    //emit NewPhoto(msg.sender, photoIndex, 0, _name, _category, _imageLink, _descLink, _flagged);
  }

  function getPhoto(uint _photoID) public view returns (address, uint, uint, string, string, string, string, bool) {
    Photo memory photo = scrapbook[photoToCurator[_photoID]][_photoID];
    return (
              photo.curator,
              photo.photoID,
              photo.likes,
              photo.name,
              photo.category,
              photo.imageLink,
              photo.descLink,
              photo.flagged
           );
  }

  function likePhoto(uint _photoID) payable public {
    require(msg.sender != address(0));
    require(photoToCurator[_photoID] != address(0));
    scrapbook[photoToCurator[_photoID]][_photoID].likes += 1;
    scrapbook[photoToCurator[_photoID]].curator.transfer(msg.value);
  }

  function flagPhoto(uint _photoID) private onlyOwner {
    require(photoToCurator[_photoID] != address(0));
    scrapbook[photoToCurator[_photoID]][_photoID].flagged = true;
  }

}
