import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("SimpleAccessControl", () => {
    let contract: Contract;

    beforeEach(async () => {
        const Contract = await ethers.getContractFactory("SimpleAccessControlTest");
        contract = await Contract.deploy();
    });

    describe("isAuthorized", () => {
        it("true only if admin or controller", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();
            expect(
                await contract.isAuthorized(deployer.address),
                "Contract deployer is authorized by default"
            ).to.be.true;
            expect(
                await contract.isAuthorized(aloe.address),
                "Random accounts are not authorized by default"
            ).to.be.false;
            expect(
                await contract.isAuthorized(bill.address),
                "Random accounts are not authorized by default"
            ).to.be.false;
            const tx = await contract.addController(aloe.address);
            await tx.wait();
            expect(
                await contract.isAuthorized(aloe.address),
                "Aloe is authorized after being added as a controller"
            ).to.be.true;
        });
    });
    describe("isAdmin", () => {
        it("true only if admin", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();
            const tx = await contract.addController(aloe.address);
            await tx.wait();
            expect(
                await contract.isAdmin(deployer.address),
                "Contract deployer is the admin by default"
            ).to.be.true;
            expect(
                await contract.isAdmin(aloe.address),
                "Controllers are not admins by default"
            ).to.be.false;
            expect(
                await contract.isAdmin(bill.address),
                "Random accounts are not admins by default"
            ).to.be.false;
        });
    });
    describe("isController", () => {
        it("true only if controller", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();
            expect(
                await contract.isController(deployer.address),
                "Contract deployer is not a controller by default"
            ).to.be.false;
            expect(
                await contract.isController(aloe.address),
                "No controllers upon deployment"
            ).to.be.false;
            expect(
                await contract.isController(bill.address),
                "No controllers upon deployment"
            ).to.be.false;
            const tx = await contract.addController(aloe.address);
            await tx.wait();
            expect(
                await contract.isController(aloe.address),
                "Aloe is a controller after being added as one"
            ).to.be.true;
        });
    });
    describe("setAdmin", () => {
        it("replaces admin", async () => {
            const [deployer, aloe] = await ethers.getSigners();
            expect(
                await contract.isAdmin(deployer.address),
                "Contract deployer starts as admin"
            ).to.be.true;
            expect(
                await contract.isAdmin(aloe.address),
                "Random accounts are not admin by default"
            ).to.be.false;
            const tx = await contract.setAdmin(aloe.address);
            await tx.wait();
            expect(
                await contract.isAdmin(deployer.address),
                "Contract deployer is no longer an admin when admin is changed"
            ).to.be.false;
            expect(
                await contract.isAdmin(aloe.address),
                "Aloe is the admin after being added as admin"
            ).to.be.true;
        });
        it("reverts if caller is not admin", async () => {
            const [deployer, aloe] = await ethers.getSigners();
            expect(
                await contract.isAdmin(deployer.address),
                "Contract deployer starts as admin"
            ).to.be.true;
            expect(
                await contract.isAdmin(aloe.address),
                "Random accounts are not admin by default"
            ).to.be.false;

            try {
                const tx = await contract.connect(aloe).setAdmin(aloe.address);
                await tx.wait();
                throw Error("should never reach here");
            } catch (err: any) {
                expect(
                    err.message,
                    "setAdmin fails when called by non admin"
                ).contains("SimpleAccessControl: 403");
            }
        });
    });
    describe("addController", () => {
        it("reverts if caller is not authorized", async () => {
            const [deployer, aloe, bill] = await ethers.getSigners();
            expect(
                await contract.isAuthorized(deployer.address),
                "Contract deployer is authorized by default"
            ).to.be.true;
            expect(
                await contract.isAuthorized(aloe.address),
                "Random accounts are not authorized by default"
            ).to.be.false;

            try {
                const tx = await contract.connect(aloe).addController(aloe.address);
                await tx.wait();
                throw Error("should never reach here");
            } catch (err: any) {
                expect(
                    err.message,
                    "Unauthorized accounts can not add controllers"
                ).contains("SimpleAccessControl: 403");
            }

            const tx = await contract.addController(aloe.address);
            await tx.wait();
            expect(
                await contract.isAuthorized(aloe.address),
                "Aloe is authorized after being added as a controller"
            ).to.be.true;

            const tx2 = await contract.connect(aloe).addController(bill.address);
            await tx2.wait();
            expect(
                await contract.isAuthorized(bill.address),
                "Bill is authorized after an authroized account adds her as a controller"
            ).to.be.true;
        });
    });
    describe("removeController", () => {
        it("removes account as an authorized controller", async () => {
            const [_, aloe] = await ethers.getSigners();
            const tx = await contract.addController(aloe.address);
            await tx.wait();
            expect(
                await contract.isAuthorized(aloe.address),
                "Aloe is authorized after being added as a controller"
            ).to.be.true;

            const tx2 = await contract.removeController(aloe.address);
            await tx2.wait();
            expect(
                await contract.isAuthorized(aloe.address),
                "Aloe is unauthorized after being removed from the controllers"
            ).to.be.false;
        });
    });
});
