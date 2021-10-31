import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { formatEther, parseEther } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

describe("TokenGate", () => {
    let contract: Contract;
    let erc20Contract: Contract;
    let erc721Contract: Contract;
    // ERC20
    const preRegisteredToken = "0x35bd01fc9d6d5d81ca9e055db88dc49aa2c699a8";
    const notRegisteredToken = "0x81dBc1c8e40C3095071949Eda9800C2209a7279A";

    beforeEach(async () => {
        const Contract = await ethers.getContractFactory("TokenGateTest");
        contract = await Contract.deploy([preRegisteredToken], [20]);
        const ERC20Contract = await ethers.getContractFactory("TestERC20Token");
        erc20Contract = await ERC20Contract.deploy();
        const ERC721Contract = await ethers.getContractFactory("TestERC721Token");
        erc721Contract = await ERC721Contract.deploy();
    });

    describe("registerToken & unregisterToken", () => {
        it("'register' adds token by erc, 'unregister' removes it", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();
            const token = notRegisteredToken;
            const erc = 20;

            expect(
                await contract.checkAuthorized(aloe.address),
                "Aloe is not authorized"
            );
            await expect(
                contract.connect(aloe).registerToken(
                    token,
                    erc
                ),
                "Aloe is not authorized to call registerToken"
            ).to.be.revertedWith("Unauthorized");

            expect(
                await contract.checkAuthorized(deployer.address),
                "Contract deployer is authorized by default"
            ).to.be.true;

            expect(
                await contract.checkTokenRegistered(token),
                "PUP is not a registered token"
            ).to.be.false;

            let tx = await contract.registerToken(token, erc);
            await tx.wait();
            expect(
                await contract.checkTokenRegistered(token),
                "PUP was added as a registered token"
            ).to.be.true;
            expect(
                await contract.getERCOfToken(token),
                "PUP was added as an ERC 20"
            ).to.equal(BigNumber.from("20"));

            await expect(
                contract.connect(aloe).unregisterToken(token),
                "Aloe is not authorized and can not unregister"
            ).to.be.revertedWith("Unauthorized");

            tx = await contract.unregisterToken(token);
            await tx.wait();
            expect(
                await contract.checkTokenRegistered(token),
                "PUP was removed as a registered token"
            ).to.be.false;
            expect(
                await contract.getERCOfToken(token),
                "PUP was removed as an ERC 20"
            ).to.equal(BigNumber.from("0"));
        });
    });
    describe("tokenHoldersCanCall", () => {
        it("reverts if caller does not hold the token", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();

            let tx = await contract.registerToken(erc20Contract.address, 20);
            await tx.wait();

            const aloeBalance = await erc20Contract.balanceOf(aloe.address);
            expect(
                aloeBalance,
                "Aloe does not hold the token"
            ).to.equal(BigNumber.from(0));
            await expect (
                contract.tokenHoldersCanCall(erc20Contract.address),
                "Aloe can not call the method without a minimum balance of the token"
            ).to.be.revertedWith("does not hold enough");
        });
        it("emits true if caller holds a token balance of at least 1", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();

            let tx = await contract.registerToken(erc20Contract.address, 20);
            await tx.wait();
            tx = await erc20Contract.mint(deployer.address, 100);
            await tx.wait();

            const aloeBalance = await erc20Contract.balanceOf(deployer.address);
            expect(
                aloeBalance,
                "Aloe holds 100 tokens"
            ).to.equal(BigNumber.from(100));
            await expect(
                contract.tokenHoldersCanCall(erc20Contract.address),
                "Aloe can call the method with a balance of 100 tokens"
            ).to.emit(contract, "Result");
        });
    });
    describe("tokenHoldersWithMinimumBalanceCanCall", () => {
        const minimumBalance = parseEther("100000000000");
        const underMinimumBalance = BigNumber.from("100");
        it("reverts if caller does not hold the minimum balance of the token", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();

            let tx = await contract.registerToken(erc20Contract.address, 20);
            await tx.wait();
            tx = await erc20Contract.mint(deployer.address, underMinimumBalance);
            await tx.wait();

            const aloeBalance = await erc20Contract.balanceOf(deployer.address);
            expect(
                aloeBalance,
                "Aloe holds 100 tokens"
            ).to.equal(BigNumber.from(underMinimumBalance));
            await expect(
                contract.tokenHoldersWithMinimumBalanceCanCall(erc20Contract.address),
                "Aloe has too few tokens to call the method"
            ).to.be.revertedWith("does not hold enough");
        });
        it("emits true if caller holds a token balance of at least minimum balance", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();

            let tx = await contract.registerToken(erc20Contract.address, 20);
            await tx.wait();
            tx = await erc20Contract.mint(deployer.address, minimumBalance);
            await tx.wait();

            const aloeBalance = await erc20Contract.balanceOf(deployer.address);
            expect(
                aloeBalance,
                "Aloe holds 1B tokens"
            ).to.equal(BigNumber.from(minimumBalance));
            await expect(
                contract.tokenHoldersWithMinimumBalanceCanCall(erc20Contract.address),
                "Aloe has enough tokens to call the method"
            ).to.be.emit(contract, "Result");
        });
    });

    describe("getTokenCount", () => {
        it("returns number of tokens registered", async () => {
            let tx = await contract.registerToken(notRegisteredToken, 20);
            await tx.wait();
            expect(
                await contract.getTokenCount(),
                "Two tokens are registered"
            ).to.equal(BigNumber.from(2));
        });
    });
    describe("getTokenAtIndex", () => {
        it("allows listing registered tokens", async () => {
            let tx = await contract.registerToken(notRegisteredToken, 20);
            await tx.wait();
            const counts = await contract.getTokenCount();
            for (let index = 0; index < counts; index++) {
                await contract.getTokenAtIndex(index);
            }
        });
    });
});
