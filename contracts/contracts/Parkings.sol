// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

contract Chargings{

     struct  Charging{
        address owner;
        uint price;
        bool isListed;
        int countLikes;
    }

    struct user{
        bool isActive;
    }

    address administrator;
    address contractAddress;
    mapping(uint=>Charging) public ChargingData;
    mapping(address=>user) public userData;
    
    // Constructor #####
    constructor() public payable{
        administrator = msg.sender;
        contractAddress=address(this);
        user memory newUser = user(true);
        userData[administrator]=newUser;

        // initial Chargings upload by admin
        Charging memory newCharging1 = Charging(msg.sender,10,true,0);
        ChargingData[1] = newCharging1;
        Charging memory newCharging2 = Charging(msg.sender,20,true,0);
        ChargingData[2] = newCharging2;
        Charging memory newCharging3 = Charging(msg.sender,30,true,0);
        ChargingData[3] = newCharging3;
        Charging memory newCharging4 = Charging(msg.sender,40,true,0);
        ChargingData[4] = newCharging4;
        Charging memory newCharging5 = Charging(msg.sender,50,true,0);
        ChargingData[5] = newCharging5;
        Charging memory newCharging6 = Charging(msg.sender,60,true,0);
        ChargingData[6] = newCharging6;
        Charging memory newCharging7 = Charging(msg.sender,70,true,0);
        ChargingData[7] = newCharging7;
        Charging memory newCharging8 = Charging(msg.sender,80,true,0);
        ChargingData[8] = newCharging8;
        Charging memory newCharging9 = Charging(msg.sender,90,true,0);
        ChargingData[9] = newCharging9;
    }

    // Modifiers #####
    modifier balanceCheck(address fromAddress) {
        require(msg.value <= fromAddress.balance, "Insufficient balance");
        _;
    }

    modifier onlyAdmin(){
        require(msg.sender==administrator);
        _;
    }

    modifier registeredUser(address userId){
        require(userData[userId].isActive==true,"User is not registered for exchange");
        _;
    }

    modifier verifyPrice(uint price){
        require(msg.value==price,"Transfer value does not match the Charging price");
        _;
    }

    // Functions #####

    function register() public{
        user memory newUser = user(true);
        userData[msg.sender]=newUser;
    }

    function deregister(address userId) public onlyAdmin registeredUser(userId){
        // userData[userId].weight=0;
        userData[userId].isActive=false;
    }

    function viewBalance() public view returns(uint) {
        return address(this).balance;
    }

    function viewContractAddress() public view returns(address){
        return contractAddress;
    }

    function addBalance() external payable balanceCheck(msg.sender) {
    
    }

    function sendBalance(address payable toAddress, uint price) external {
        require(contractAddress.balance>=price,"Smart Contract has insufficient balance");
        toAddress.transfer(price);
    }

    function upload(uint ChargingId, uint price) public returns(uint){
        Charging memory newCharging = Charging(msg.sender,price,true,0);
        ChargingData[ChargingId] = newCharging;
        return 1;
    }

    function buyCharging(uint ChargingId, address payable toAddress) external payable{//, address fromAddress, address payable toAddress, uint price) external payable verifyPrice(price) balanceCheck(msg.sender) registeredUser(fromAddress) registeredUser(toAddress){
        toAddress.transfer(ChargingData[ChargingId].price *10 ** 18);
        ChargingData[ChargingId].owner=msg.sender;
        ChargingData[ChargingId].isListed=false;
        // return price;        
    }
    
    function like(uint ChargingId) public registeredUser(msg.sender){
        ChargingData[ChargingId].countLikes+=1;
    }

    function unlike(uint ChargingId) public registeredUser(msg.sender){
        ChargingData[ChargingId].countLikes-=1;
    }
}