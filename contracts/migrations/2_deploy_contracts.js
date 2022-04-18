const Chargings = artifacts.require("./Chargings.sol");

module.exports = function (deployer) {
  deployer.deploy(Chargings);
};
