const { expect } = require("chai");
const { ethers } = require("hardhat");

// These tests are the point of the whole security fix: they lock in that a buyer actually pays,
// the host actually receives, the contract never custodies funds, and the old drain paths are gone.
describe("Chargings", function () {
  let chargings, admin, host, driver, stranger;

  beforeEach(async function () {
    [admin, host, driver, stranger] = await ethers.getSigners();
    const Chargings = await ethers.getContractFactory("Chargings");
    chargings = await Chargings.deploy(); // admin (signer 0) is the deployer/administrator
    await chargings.waitForDeployment();
  });

  describe("deployment + seeding", function () {
    it("sets the deployer as administrator and registers them", async function () {
      expect(await chargings.administrator()).to.equal(admin.address);
      expect(await chargings.isRegistered(admin.address)).to.equal(true);
    });

    it("seeds 9 chargers with consistent wei prices (0.01..0.09 ETH), all listed", async function () {
      expect(await chargings.CHARGER_COUNT()).to.equal(9n);
      for (let id = 1; id <= 9; id++) {
        const c = await chargings.ChargingData(id);
        expect(c.owner).to.equal(admin.address);
        expect(c.isListed).to.equal(true);
        expect(c.price).to.equal(ethers.parseEther((id * 0.01).toFixed(2)));
        expect(c.countLikes).to.equal(0n);
      }
    });
  });

  describe("registration gate", function () {
    it("lets an account self-register (documented soft gate)", async function () {
      await expect(chargings.connect(driver).register())
        .to.emit(chargings, "Registered").withArgs(driver.address);
      expect(await chargings.isRegistered(driver.address)).to.equal(true);
    });

    it("blocks buying / liking until registered", async function () {
      const price = (await chargings.ChargingData(1)).price;
      await expect(chargings.connect(stranger).buyCharging(1, { value: price }))
        .to.be.revertedWith("user not registered");
      await expect(chargings.connect(stranger).like(1))
        .to.be.revertedWith("user not registered");
    });
  });

  describe("buyCharging — the fixed pay-as-you-go flow", function () {
    beforeEach(async function () {
      await chargings.connect(driver).register();
    });

    it("requires the buyer to pay EXACTLY the listed price", async function () {
      const price = (await chargings.ChargingData(3)).price; // 0.03 ETH
      await expect(chargings.connect(driver).buyCharging(3, { value: price - 1n }))
        .to.be.revertedWith("wrong price");
      await expect(chargings.connect(driver).buyCharging(3, { value: price + 1n }))
        .to.be.revertedWith("wrong price");
      // the original bug: value 0 used to succeed and PAY the caller. Now it reverts.
      await expect(chargings.connect(driver).buyCharging(3, { value: 0 }))
        .to.be.revertedWith("wrong price");
    });

    it("sends the buyer's ETH to the host and keeps ZERO in the contract", async function () {
      const price = (await chargings.ChargingData(3)).price;
      // host of the seeded chargers is admin. Assert admin gains exactly `price`, contract gains 0.
      await expect(
        chargings.connect(driver).buyCharging(3, { value: price })
      ).to.changeEtherBalances([admin, chargings], [price, 0n]);
    });

    it("emits Charged(id, driver, host, amount)", async function () {
      const price = (await chargings.ChargingData(3)).price;
      await expect(chargings.connect(driver).buyCharging(3, { value: price }))
        .to.emit(chargings, "Charged")
        .withArgs(3, driver.address, admin.address, price);
    });

    it("does not transfer charger ownership on a charge (pay-per-charge, not a sale)", async function () {
      const price = (await chargings.ChargingData(3)).price;
      await chargings.connect(driver).buyCharging(3, { value: price });
      const c = await chargings.ChargingData(3);
      expect(c.owner).to.equal(admin.address); // still the host's
      expect(c.isListed).to.equal(true);       // still buyable
    });
  });

  describe("no fund-drain surface remains", function () {
    it("has no sendBalance / addBalance functions at all", function () {
      expect(chargings.interface.hasFunction("sendBalance")).to.equal(false);
      expect(chargings.interface.hasFunction("addBalance")).to.equal(false);
    });

    it("holds no balance to drain (funds always flow straight to hosts)", async function () {
      await chargings.connect(driver).register();
      const price = (await chargings.ChargingData(2)).price;
      await chargings.connect(driver).buyCharging(2, { value: price });
      expect(await ethers.provider.getBalance(await chargings.getAddress())).to.equal(0n);
    });
  });

  describe("upload — access controlled", function () {
    it("blocks a non-owner from overwriting someone else's listing", async function () {
      await chargings.connect(host).register();
      await expect(chargings.connect(host).upload(3, ethers.parseEther("1")))
        .to.be.revertedWith("not your charger");
    });

    it("lets the owner re-price their own charger", async function () {
      const newPrice = ethers.parseEther("0.5");
      await expect(chargings.connect(admin).upload(3, newPrice))
        .to.emit(chargings, "Uploaded").withArgs(3, admin.address, newPrice);
      expect((await chargings.ChargingData(3)).price).to.equal(newPrice);
    });

    it("requires registration to upload", async function () {
      await expect(chargings.connect(stranger).upload(3, 1))
        .to.be.revertedWith("user not registered");
    });
  });

  describe("like / unlike — bounded, one per user", function () {
    beforeEach(async function () {
      await chargings.connect(driver).register();
    });

    it("counts one like per account and blocks double-likes", async function () {
      await chargings.connect(driver).like(1);
      expect((await chargings.ChargingData(1)).countLikes).to.equal(1n);
      await expect(chargings.connect(driver).like(1)).to.be.revertedWith("already liked");
    });

    it("can unlike, and cannot unlike what you never liked (no negative counts)", async function () {
      await chargings.connect(driver).like(1);
      await chargings.connect(driver).unlike(1);
      expect((await chargings.ChargingData(1)).countLikes).to.equal(0n);
      await expect(chargings.connect(driver).unlike(1)).to.be.revertedWith("not liked yet");
    });
  });
});
