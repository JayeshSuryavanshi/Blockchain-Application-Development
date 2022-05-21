// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

/// @title  Chargings — the Beacon peer-to-peer EV charger marketplace
/// @notice Hosts list a home charger at a price; drivers register, browse, like, and pay per charge.
/// @dev    This is the finished version. My first cut compiled but had real bugs (see README
///         "What my first version got wrong"). The important ones:
///           - buyCharging ignored msg.value and paid the seller out of the CONTRACT's balance,
///             to a caller-supplied address, scaled by 1e18 -> anyone could drain funds for free.
///           - sendBalance had no access control -> anyone could empty the contract.
///           - prices were stored as bare 10..90 but paid out * 1e18 (unit mismatch).
///           - countLikes was an int and could go negative; like/unlike were unbounded.
///         This version is a straightforward, safe pay-as-you-go design: the buyer's own ETH
///         goes straight to the host, the contract never custodies funds, and the units are wei
///         everywhere. I kept the data model and function names recognizable from the report.
contract Chargings {
    struct Charging {
        address owner;    // the host who listed this charger
        uint price;       // price for a single charge, in WEI
        bool isListed;    // is it currently available to buy?
        uint countLikes;  // was `int` in my first cut (could go negative) — now uint + one-like-per-user
    }

    struct User {
        bool isActive;
    }

    address public administrator;

    // charger id (1..9) -> its on-chain state. This is the source of truth for price/likes/owner.
    // The cosmetic name + image for each id live off-chain in the frontend's mapping.json.
    mapping(uint => Charging) public ChargingData;

    // who has registered to use the marketplace
    mapping(address => User) public userData;

    // one like per (charger, user) so likes can't be spammed or driven negative
    mapping(uint => mapping(address => bool)) public liked;

    // number of demo chargers seeded in the constructor (matches mapping.json)
    uint public constant CHARGER_COUNT = 9;

    event Registered(address indexed user);
    event Deregistered(address indexed user);
    event Uploaded(uint indexed id, address indexed owner, uint price);
    event Charged(uint indexed id, address indexed driver, address indexed host, uint amount);
    event LikeChanged(uint indexed id, address indexed user, bool liked, uint totalLikes);

    modifier onlyAdmin() {
        require(msg.sender == administrator, "not admin");
        _;
    }

    modifier registeredUser(address userId) {
        require(userData[userId].isActive, "user not registered");
        _;
    }

    constructor() {
        administrator = msg.sender;
        userData[administrator] = User(true);

        // Seed the 9 demo chargers the report/UI expect. My first cut seeded these as bare
        // integers 10..90 (which the payout code then treated as whole ETH via *1e18). Here I
        // seed real wei prices of 0.01 .. 0.09 ETH so a purchase is cheap enough to actually run
        // on a local chain and the units line up with buyCharging.
        for (uint id = 1; id <= CHARGER_COUNT; id++) {
            ChargingData[id] = Charging({
                owner: msg.sender,
                price: id * 0.01 ether,
                isListed: true,
                countLikes: 0
            });
        }
    }

    /// @notice Register the caller so they can list, buy, and like.
    /// @dev Self-service on purpose (it always was). There's no approval or stake, so
    ///      `registeredUser` is a soft gate for the demo, not a real trust boundary. Documented.
    function register() external {
        userData[msg.sender] = User(true);
        emit Registered(msg.sender);
    }

    /// @notice Admin can deactivate an account.
    function deregister(address userId) external onlyAdmin registeredUser(userId) {
        userData[userId].isActive = false;
        emit Deregistered(userId);
    }

    /// @notice List (or re-list) a charger you own at a wei price.
    /// @dev My first cut let ANYONE overwrite ANY listing. Now only the current host may re-list a slot
    ///      that's already taken. Price comes in as wei; the frontend converts human ETH first.
    function upload(uint id, uint price) external registeredUser(msg.sender) {
        require(id >= 1 && id <= CHARGER_COUNT, "bad id");
        Charging storage c = ChargingData[id];
        require(!c.isListed || c.owner == msg.sender, "not your charger");
        c.owner = msg.sender;
        c.price = price;
        c.isListed = true;
        emit Uploaded(id, msg.sender, price);
    }

    /// @notice Pay the host for one charge. Pay-as-you-go: the buyer's own ETH goes to the host.
    /// @dev This is THE fix. My first version was `buyCharging(id, toAddress)`: it never checked
    ///      msg.value, paid `price * 1e18` out of the contract's balance to the caller-supplied
    ///      `toAddress` (default: the attacker), and flipped ownership to the buyer. All of that is
    ///      gone. A charge does not transfer the charger — the host keeps owning and listing it.
    function buyCharging(uint id) external payable registeredUser(msg.sender) {
        Charging storage c = ChargingData[id];
        require(c.isListed, "not listed");
        require(msg.value == c.price, "wrong price");

        // checks-effects-interactions: nothing mutable changes after this call, so no reentrancy.
        (bool ok, ) = payable(c.owner).call{value: msg.value}("");
        require(ok, "payment to host failed");

        emit Charged(id, msg.sender, c.owner, msg.value);
    }

    /// @notice Like a charger (once per account).
    function like(uint id) external registeredUser(msg.sender) {
        require(id >= 1 && id <= CHARGER_COUNT, "bad id");
        require(!liked[id][msg.sender], "already liked");
        liked[id][msg.sender] = true;
        ChargingData[id].countLikes += 1;
        emit LikeChanged(id, msg.sender, true, ChargingData[id].countLikes);
    }

    /// @notice Remove your like.
    function unlike(uint id) external registeredUser(msg.sender) {
        require(id >= 1 && id <= CHARGER_COUNT, "bad id");
        require(liked[id][msg.sender], "not liked yet");
        liked[id][msg.sender] = false;
        ChargingData[id].countLikes -= 1; // safe: the check above guarantees count > 0
        emit LikeChanged(id, msg.sender, false, ChargingData[id].countLikes);
    }

    /// @notice Convenience read for the frontend: is this account registered?
    /// @dev The public `userData` mapping getter returns a single bool (User has one field), which
    ///      is awkward to consume. This gives callers a clean, obvious boolean.
    function isRegistered(address account) external view returns (bool) {
        return userData[account].isActive;
    }

    /// @notice Contract ETH balance. Pay-as-you-go forwards funds straight to hosts, so in normal
    ///         use this stays 0 — I kept it because the original interface had it.
    function viewBalance() external view returns (uint) {
        return address(this).balance;
    }
}
