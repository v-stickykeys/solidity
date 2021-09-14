import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { randomBytes } from "@ethersproject/random";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("ERC1155MinterBurnerPauser", function () {
  let token: Contract;
  const uri = "https://tokens.stickykeys.eth/samples/1155-mbp/{id}"

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("contracts/ERC1155MinterBurnerPauser.sol:ERC1155MinterBurnerPauser");
    token = await Token.deploy(uri);
  });
  describe("mint", function () {
    it("can only be called by an authorized account", async () => {
      const [deployer, aloe, bill] = await ethers.getSigners();

      expect(
        await token.isAuthorized(deployer.address),
        "Contract deployer is authorized by default"
      ).to.be.true;
      expect(
        await mint(deployer, bill.address),
        "Deployer can mint when authorized"
      ).to.not.throw;

      expect(
        await token.isAuthorized(aloe.address),
        "Random accounts are not authorized by default"
      ).to.be.false;
      try {
        expect(
          await mint(aloe, bill.address),
          "Aloe can not mint when unauthorized"
        ).to.throw;
        throw Error("Should never reach here");
      } catch(err: any) {
        expect(
          err.message,
          "Unauthorized accounts can not mint"
        ).to.include("SimpleAccessControl: 403");
      }

      const tx3 = await token.addController(aloe.address);
      await tx3.wait();
      expect(
        await token.isAuthorized(aloe.address),
        "Aloe is added as a controller and is authorized"
      ).to.be.true;
      expect(
        await mint(aloe, bill.address),
        "Aloe can mint once authorized"
      ).to.not.throw;
    });

    async function mint(signer: Signer, to: string) {
      const tx = await token.connect(signer).mint(to, 1, BigNumber.from("5"), randomBytes(1));
      await tx.wait();
    }

  });
  describe("mintBatch", function () {
    it("can only be called by an authorized account", async () => {
      const [deployer, aloe, bill] = await ethers.getSigners();

      expect(
        await token.isAuthorized(deployer.address),
        "Contract deployer is authorized by default"
      ).to.be.true;
      expect(
        await mintBatch(deployer, bill.address),
        "Deployer can mint batches when authorized"
      ).to.not.throw;

      expect(
        await token.isAuthorized(aloe.address),
        "Random accounts are not authorized by default"
      ).to.be.false;
      try {
        expect(
          await mintBatch(aloe, bill.address),
          "Aloe can not mint batches when unauthorized"
        ).to.throw;
        throw Error("Should never reach here");
      } catch(err: any) {
        expect(
          err.message,
          "Unauthorized accounts can not mint batches"
        ).to.include("SimpleAccessControl: 403");
      }

      const tx3 = await token.addController(aloe.address);
      await tx3.wait();
      expect(
        await token.isAuthorized(aloe.address),
        "Aloe is added as a controller and is authorized"
      ).to.be.true;
      expect(
        await mintBatch(aloe, bill.address),
        "Aloe can mint batches once authorized"
      ).to.not.throw;
    });

    async function mintBatch(signer: Signer, to: string) {
      const tx = await token.connect(signer).mintBatch(
        to,
        [0, 1, 23],
        [BigNumber.from("5"), BigNumber.from("1"), BigNumber.from("10")],
        randomBytes(1)
      );
      await tx.wait();
    }
  });
  describe("pause/unpause", function () {
    it("can only be called by an authorized account", async () => {
      const [deployer, aloe] = await ethers.getSigners();

      expect(
        await token.isAuthorized(deployer.address),
        "Contract deployer is authorized by default"
      ).to.be.true;
      expect(
        await pause(deployer),
        "Deployer can pause transfers when authorized"
      ).to.not.throw;
      expect(
        await unpause(deployer),
        "Deployer can unpause transfers when they are paused and account is authorized"
      ).to.not.throw;

      // No need to test pause/unpause transfer functionality here

      expect(
        await pause(deployer),
        "Deployer can pause transfers when they are unpaused and account is authorized"
      ).to.not.throw;
      expect(
        await token.isAuthorized(aloe.address),
        "Random accounts are not authorized by default"
      ).to.be.false;
      try {
        expect(
          await unpause(aloe),
          "Aloe can not unpause transfers when unauthorized"
        ).to.throw;
        throw Error("Should never reach here");
      } catch(err: any) {
        expect(
          err.message,
          "Unauthorized accounts can not unpause transfers"
        ).to.include("SimpleAccessControl: 403");
      }

      const tx3 = await token.addController(aloe.address);
      await tx3.wait();
      expect(
        await token.isAuthorized(aloe.address),
        "Aloe is added as a controller and is authorized"
      ).to.be.true;
      expect(
        await unpause(aloe),
        "Aloe can pause transfers once authorized"
      ).to.not.throw;
    });
  });

  async function pause(signer: Signer) {
    const tx = await token.connect(signer).pause();
    await tx.wait();
  }

  async function unpause(signer: Signer) {
    const tx = await token.connect(signer).unpause();
    await tx.wait();
  }
});
